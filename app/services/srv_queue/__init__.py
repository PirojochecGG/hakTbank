# fmt: off
# isort: off
from uuid import UUID
from loguru import logger
from typing import Any, Dict, Optional, Callable, Awaitable

from app.storage import RequestPriority, Request
from .manager import QueueManager
from .objects import QueueStats


class QueueService:
    """Фасад сервиса очереди."""

    def __init__(self, manager: Optional[QueueManager] = None):
        """Инициализация сервиса очереди."""
        self._manager = manager or QueueManager()
        logger.info("🚀 QueueService инициализирован")

    async def add_request(
        self, db, user_id: UUID, payload: Dict[str, Any],
        priority: RequestPriority = RequestPriority.GENERAL,
    ) -> UUID:
        """Добавляет запрос в очередь."""
        return await self._manager.enqueue(db, user_id, payload, priority)

    async def start_processing(self, handler: Callable[[Request], Awaitable[bool]]) -> None:
        """Запускает обработку очереди."""
        await self._manager.process_queue(handler)

    async def mark_completed(self, db, request_id: UUID) -> bool:
        """Отмечает запрос как выполненный."""
        return await self._manager.complete_request(db, request_id)

    async def mark_failed(self, db, request_id: UUID, error: str) -> bool:
        """Отмечает запрос как неудачный."""
        return await self._manager.fail_request(db, request_id, error)

    async def get_statistics(self, db) -> QueueStats:
        """Получает статистику очереди."""
        return await self._manager.get_queue_stats(db)

    async def cleanup_completed(self, db, days: int = 7) -> int:
        """Удаляет старые завершенные запросы."""
        return await self._manager.cleanup_completed(db, days)
