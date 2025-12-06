# fmt: off
# isort: off
import json

from uuid import UUID
from loguru import logger
from typing import Optional
from abc import ABC, abstractmethod
from contextlib import asynccontextmanager

from app.storage import Request, Subscription, get_session
from ..toolcalls.manager import tool_manager
from ..objects import HandlerResponse
from ..utils import HistoryManager
from ..clients import get_client
from ..config import *


class BaseHandler(ABC):
    """Базовый обработчик нейросетевых запросов."""

    def __init__(self):
        """Инициализация базового обработчика."""
        self._chat_id = None

    @asynccontextmanager
    async def _handle_errors(self, request: Request):
        """Контекст менеджер для обработки ошибок."""
        from app.services import get_service
        try:
            yield

        except ValueError as e:
            logger.warning(f"Ошибка валидации в {self.__class__.__name__} [{e.__class__.__name__}]: {e}")
            await get_service.redis.set_error(request.id, str(e), 400, request.payload.get("stream", False))
            raise

        except Exception as e:
            logger.error(f"Неожиданная ошибка в {self.__class__.__name__} [{e.__class__.__name__}]: {e}", exc_info=True)
            await get_service.redis.set_error(request.id, str(e), 500, request.payload.get("stream", False))
            raise


    async def _update_usage(self, user_id: Optional[str] = None) -> None:
        """Обновляет статистику использования."""
        async for db in get_session():
            if not (success := await Subscription.increment_usage(db, user_id)):
                raise Exception("Статистика запросов не обновлена для юзера")


    def _extract_attachments(self, messages: list) -> list:
        """Извлекает файлы из результатов тулкалов."""
        attachments = []
        for msg in messages:
            if msg.get("role") != "tool":
                continue
            try:
                content = json.loads(msg.get("content", "{}"))
                if content.get("success"):
                    attachments.extend(
                        {"type": key[:-4], "url": url} for key, url in content.items()
                        if key.endswith("_url")
                    )
            except (json.JSONDecodeError, AttributeError):
                pass
        return attachments


    async def _get_chat_title(self, text: str) -> str:
        """Генерирует название чата по сообщению."""
        try:
            return (await get_client("OpenaiLLM").chat_completion(
                model=TOOL_CALLS_MODEL,
                messages=[
                    {"role": "system", "content": CHAT_TITLE_PROMPT},
                    {"role": "user", "content": text}
                ],
                max_tokens=100
            )).choices[0].message.content.strip()[:50]

        except Exception as e:
            logger.warning(f"Ошибка генерации названия чата: {e}")
            return "Новый чат"


    async def _get_or_create_chat(self, request: Request) -> None:
        """Получает существующий чат или создает новый."""
        from app.services import get_service

        async for db in get_session():
            if (chat_id := request.payload.get("chat_id")):
                if not (chat_info := await get_service.chat.get_chat(db, UUID(chat_id), request.user_id)):
                    raise ValueError(f"Чат {chat_id} не найден или недоступен")
                self._chat_id = chat_info.id
            else:
                title = await self._get_chat_title(request.payload.get("text"))
                self._chat_id = (await get_service.chat.create_chat(
                    db, request.user_id, title
                )).id


    def _clean_messages_for_final_request(self, messages: list) -> list:
        """Очищает сообщения от метаданных для финального запроса."""
        return [{k: v for k, v in msg.items() if k != "tool_metadata"} for msg in messages]


    async def process(self, request: Request) -> bool:
        """Обработка запроса с общей логикой."""
        async with self._handle_errors(request):
            # Получаем или создаем чат
            title = await self._get_or_create_chat(request)

            print(title)

            async for db in get_session():
                # Добавляем сообщение пользователя
                await HistoryManager.add_user_message(
                    db, self._chat_id, request.payload.get("text"),
                    request.payload.get("model"), request.payload.get("attachments")
                )

                # Получаем историю сообщений с системным промптом
                messages = await HistoryManager.get_chat_history(db, self._chat_id)


                # Создаем пустое сообщение ассистента заранее
                assistant_message = await HistoryManager.add_assistant_message(
                    db, self._chat_id, "", request.payload.get("model")
                )


            # Обрабатываем сообщения с тулкалами
            # processed_messages = await tool_manager.process_with_tools(
            #     messages, TOOL_CALLS_MODEL
            # )

            # Извлекаем аттачменты из результатов тулкалов
            attachments = self._extract_attachments(messages)

            # Очищаем сообщения от метаданных для финального запроса
            clean_messages = self._clean_messages_for_final_request(messages)

            # Выполняем основную логику - генерим финальный ответ с учетом результат туллкалов
            result = await self._execute(request, clean_messages, assistant_message.id, attachments)

            # Обновляем сообщение с результатом
            async for db in get_session():
                await HistoryManager.update_assistant_message_with_tools(
                    db, assistant_message.id, result.content, messages, attachments
                )

            # Обновляем статистику юзера
            await self._update_usage(request.user_id)

            logger.info(f"Чат-запрос {request.id} выполнен")
            return True


    @abstractmethod
    async def _execute(self, request: Request, messages: list, message_id: UUID, attachments: list = None) -> HandlerResponse:
        """Основная логика обработчика. Должна быть реализована в наследниках."""
        pass
