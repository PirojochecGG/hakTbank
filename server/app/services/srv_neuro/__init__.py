# fmt: off
# isort: off
from loguru import logger
from typing import Optional

from .manager import NeuroManager
from .objects import *


class NeuroService:
    """Фасад сервиса ."""

    def __init__(self, manager: Optional[NeuroManager] = None):
        """Инициализация сервиса очереди."""
        self._manager = manager or NeuroManager()
        logger.info("🤖 NeuroService инициализирован")

    async def start_execute(self) -> None:
        """Запуск обработки очереди запросов."""
        await self._manager.start_execute()
