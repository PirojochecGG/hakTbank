# fmt: off
# isort: off
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.services.srv_payment.objects import CreatePaymentRequest as ServiceRequest
from app.storage import User, Tariff
from app.services import get_service
from .schemas import *


class PaymentRouterManager:
    """Менеджер логики роутера платежей."""

    @staticmethod
    async def create_yookassa_payment(
        user: User, request: CreatePaymentRequest, db: AsyncSession
    ) -> PaymentResponse:
        """Создание платежа в Юкассе."""
        if not (tariff := await db.scalar(select(Tariff).where(Tariff.id == request.tariff_id))):
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Тариф не найден")

        can_purchase = await get_service.payment.can_purchase_tariffs(db, user.id, [tariff])
        if not can_purchase.get(tariff.id, False):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Невозможно купить этот тариф")

        service_request = ServiceRequest(tariff_id=request.tariff_id)
        if not (payment := await get_service.payment.create_payment(db, user.id, service_request)):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Не удалось создать платеж")

        return PaymentResponse(
            confirmation_url=payment.confirmation_url,
            amount=payment.amount, currency=payment.currency
        )


    @staticmethod
    async def yookassa_webhook(webhook_data: dict, db: AsyncSession, client_ip: str = None) -> dict:
        """Обработка вебхука от Юкассы."""
        success = await get_service.payment.process_webhook(
            db, webhook_data, client_ip
        )
        return {"status": "ok" if success else "error"}


    @staticmethod
    async def get_tariffs(db: AsyncSession, user: User) -> TariffsResponse:
        """Получение всех тарифов с проверкой возможности покупки."""
        tariffs = (await db.execute(select(Tariff).where(Tariff.is_hidden == False))).scalars().all()
        can_purchase_map = await get_service.payment.can_purchase_tariffs(db, user.id, tariffs)

        return TariffsResponse(
            tariffs=[TariffResponse(
                id=t.id, name=t.name, sys_name=t.sys_name,
                description=t.description, quota=t.quota,
                price=t.price, expire_days=t.expire_days,
                can_purchase=can_purchase_map.get(t.id, False)
            ) for t in tariffs]
        )
