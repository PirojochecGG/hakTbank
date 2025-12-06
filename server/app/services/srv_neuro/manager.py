# fmt: off
# isort: off
from loguru import logger
from typing import Optional, Dict, Type

from app.storage import RequestType, Request
from .handlers.base import BaseHandler
from .handlers.chat import ChatHandler


class NeuroManager:
    """Менеджер для работы с нейросетевыми запросами."""

    _HANDLERS: Dict[RequestType, Type[BaseHandler]] = {
        RequestType.TEXT: ChatHandler,
    }

    def __init__(self) -> None:
        """Инициализация менеджера."""
        from app.services import get_service
        self._queue_service = get_service.queue


    async def start_execute(self) -> None:
        """Запуск обработки очереди запросов."""
        await self._queue_service.start_processing(self._proc_req)


    def _get_handler(self, req_type: str) -> Optional[BaseHandler]:
        """Получение обработчика по типу запроса."""
        try:
            handler_cls = self._HANDLERS.get(RequestType(req_type))
            if handler_cls:
                return handler_cls()

        except ValueError:
            pass

        return None


    async def _proc_req(self, request: Request) -> None:
        """Обработка запроса из очереди."""
        if not request or not request.payload:
            raise ValueError("Получен пустой запрос")

        if not (req_type := request.payload.get("type")):
            raise ValueError("Тип запроса не указан")

        await self._handle_req(req_type, request)


    async def _handle_req(self, req_type: str, request: Request) -> None:
        """Обработка запроса через соответствующий обработчик."""
        if not (handler := self._get_handler(req_type)):
            raise ValueError(f"Неизвестный тип запроса: {req_type}")

        logger.info(f"Обработка запроса {request.id} типа {req_type}")
        await handler.process(request)
