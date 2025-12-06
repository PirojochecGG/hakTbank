from uuid import UUID
from loguru import logger
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from .manager import PaymentManager
from .objects import *


class PaymentService:
    """Фасад сервиса платежей через ЮКассу."""

    def __init__(self, manager: Optional[PaymentManager] = None):
        self._manager = manager or PaymentManager()
        logger.info("💳 PaymentService инициализирован")

    async def create_payment(
        self, db: AsyncSession, user_id: UUID, request: CreatePaymentRequest
    ) -> Optional[PaymentResponse]:
        """Создает платеж в ЮКассе."""
        return await self._manager.create_payment(db, user_id, request)

    async def create_recurring_payment(
        self, db: AsyncSession, user_id: UUID, tariff_id: UUID, payment_id: str
    ) -> Optional[PaymentResponse]:
        """Создает рекурентный платеж."""
        return await self._manager.create_recurring_payment(db, user_id, tariff_id, payment_id)

    async def process_webhook(
        self, db: AsyncSession, webhook_data: dict, client_ip: str = None
    ) -> bool:
        """Обрабатывает вебхук от ЮКассы."""
        return await self._manager.process_webhook(db, webhook_data, client_ip)

    async def can_purchase_tariffs(self, db: AsyncSession, user_id: UUID, tariffs: list) -> dict[UUID, bool]:
        """Проверяет возможность покупки тарифов."""
        return await self._manager.can_purchase_tariffs(db, user_id, tariffs)
