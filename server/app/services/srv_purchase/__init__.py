from uuid import UUID
from loguru import logger
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from .manager import PurchaseManager
from .objects import *
from app.storage.models import User


class PurchaseService:
    """Фасад сервиса покупок."""

    def __init__(self, manager: Optional[PurchaseManager] = None):
        self._manager = manager or PurchaseManager()
        logger.info("🛒 PurchaseService инициализирован")

    async def create_purchase(
        self, db: AsyncSession, user_id: UUID, chat_id: UUID, request: CreatePurchaseRequest
    ) -> PurchaseInfo:
        """Создает новую покупку."""
        return await self._manager.create_purchase(db, user_id, chat_id, request)

    async def get_chat_purchases(self, db: AsyncSession, chat_id: UUID, user_id: UUID) -> list[PurchaseInfo]:
        """Получает покупки чата."""
        return await self._manager.get_chat_purchases(db, chat_id, user_id)

    async def update_purchase_status(
        self, db: AsyncSession, purchase_id: UUID, user_id: UUID,
        status: Optional["PurchaseStatus"] = None,
        notify_excluded: Optional[bool] = None
    ) -> Optional[PurchaseInfo]:
        """Обновляет статус покупки."""
        return await self._manager.update_purchase_status(
            db, purchase_id, user_id, status, notify_excluded
        )

    def calculate_cooling(self, user: User, price: int, category: str) -> CoolingAnalysis:
        """Рассчитывает период охлаждения покупки."""
        return self._manager.calculate_cooling(user, price, category)

    async def delete_purchase(self, db: AsyncSession, chat_id: UUID, purchase_id: UUID, user_id: UUID) -> bool:
        """Удаляет покупку из чата."""
        return await self._manager.delete_purchase(db, chat_id, purchase_id, user_id)
