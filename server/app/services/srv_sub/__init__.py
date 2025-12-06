# fmt: off
# isort: off
from uuid import UUID
from loguru import logger
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from .manager import SubManager
from .objects import SubscriptionInfo, LimitsInfo


class SubService:
    """Фасад сервиса подписок."""

    def __init__(self, manager: Optional[SubManager] = None):
        """Инициализация сервиса подписок."""
        self._manager = manager or SubManager()
        logger.info("🍿 SubService инициализирован")

    async def get_user_subscription(self, db: AsyncSession, user_id: UUID) -> Optional[SubscriptionInfo]:
        """Получает подписку пользователя."""
        return await self._manager.get_user_subscription(db, user_id)

    async def get_user_limits(self, db: AsyncSession, user_id: UUID) -> Optional[LimitsInfo]:
        """Получает лимиты пользователя."""
        return await self._manager.get_user_limits(db, user_id)

    async def off_auto_renewal(self, db: AsyncSession, user_id: UUID) -> bool:
        """Отменяет автопродление подписки (сбрасывает payment_id)."""
        return await self._manager.off_auto_renewal(db, user_id)

    async def update_subscription(
        self, db: AsyncSession, user_id: UUID, tariff_id: UUID, payment_method_id: str = None
    ) -> Optional[SubscriptionInfo]:
        """Обновляет подписку пользователя."""
        return await self._manager.update_subscription(db, user_id, tariff_id, payment_method_id)
