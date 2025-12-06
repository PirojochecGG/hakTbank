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
            logger.info(f"Начало обработки запроса {request.id} от пользователя {request.user_id}")

            # Получаем или создаем чат
            await self._get_or_create_chat(request)
            logger.info(f"Чат {self._chat_id} готов к работе")

            async for db in get_session():
                # Добавляем сообщение пользователя
                await HistoryManager.add_user_message(
                    db, self._chat_id, request.payload.get("text"),
                    request.payload.get("model"), request.payload.get("attachments")
                )
                logger.info(f"Сообщение пользователя добавлено в чат {self._chat_id}")

                # Получаем историю сообщений с системным промптом
                messages = await HistoryManager.get_chat_history(db, self._chat_id, request.user_id)
                logger.info(f"Загружено {len(messages)} сообщений из истории (включая системный промпт)")

                # Создаем пустое сообщение ассистента заранее
                assistant_message = await HistoryManager.add_assistant_message(
                    db, self._chat_id, "", request.payload.get("model")
                )
                logger.info(f"Создано сообщение ассистента {assistant_message.id}")

            # Обрабатываем сообщения с тулкалами
            processed_messages = await tool_manager.process_with_tools(
                messages, TOOL_CALLS_MODEL,
                user_id=str(request.user_id),
                chat_id=str(self._chat_id)
            )

            # Извлекаем аттачменты из результатов тулкалов
            if (attachments := self._extract_attachments(processed_messages)):
                logger.info(f"Извлечено {len(attachments)} аттачментов")

            # Очищаем сообщения от метаданных для финального запроса
            clean_messages = self._clean_messages_for_final_request(processed_messages)
            logger.info(f"Сообщения очищены, отправляем {len(clean_messages)} сообщений в нейросеть")

            # Выполняем основную логику - генерим финальный ответ с учетом результат туллкалов
            result = await self._execute(request, clean_messages, assistant_message.id, attachments)
            logger.info(f"Получен ответ от нейросети, длина: {len(result.content)} символов")

            # Обновляем сообщение с результатом
            async for db in get_session():
                await HistoryManager.update_assistant_message_with_tools(
                    db, assistant_message.id, result.content, processed_messages, attachments
                )
            logger.info(f"Сообщение ассистента {assistant_message.id} обновлено")

            # Обновляем статистику юзера
            await self._update_usage(request.user_id)

            logger.info(f"Чат-запрос {request.id} успешно выполнен")
            return True


    @abstractmethod
    async def _execute(self, request: Request, messages: list, message_id: UUID, attachments: list = None) -> HandlerResponse:
        """Основная логика обработчика. Должна быть реализована в наследниках."""
        pass
