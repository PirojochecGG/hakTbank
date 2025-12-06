# fmt: off
from uuid import UUID
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.storage.models import User, Tariff, Transaction, Subscription
from .providers.yookassa.manager import YookassaManager
from .objects import *


def get_tariff_level(sys_name: str) -> int:
    """Определяет уровень тарифа."""
    if "ADVANCED" in sys_name:
        return 3
    if "START" in sys_name:
        return 2
    return 0


def get_tariff_duration(sys_name: str) -> int:
    """Определяет длительность тарифа."""
    if "HALF_YEARLY" in sys_name:
        return 2
    if "YEARLY" in sys_name:
        return 3
    if "MONTHLY" in sys_name:
        return 1
    return 0


class PaymentManager:
    """Менеджер для работы с платежами через ЮКассу."""

    @staticmethod
    async def create_payment(
        db: AsyncSession, user_id: UUID, request: CreatePaymentRequest
    ) -> Optional[PaymentResponse]:
        """Создает платеж в ЮКассе."""
        if not (
            tariff := await db.scalar(
                select(Tariff).where(Tariff.id == request.tariff_id)
            )
        ):
            return None

        user = await db.scalar(select(User).where(User.id == user_id))
        if not user or not user.email:
            return None

        return await YookassaManager.create_payment(
            amount=tariff.price,
            user_id=user_id,
            tariff_id=request.tariff_id,
            tariff_description=tariff.description,
            user_email=user.email,
        )

    @staticmethod
    async def create_recurring_payment(
        db: AsyncSession, user_id: UUID, tariff_id: UUID, payment_id: str
    ) -> Optional[PaymentResponse]:
        """Создает рекурентный платеж."""
        tariff = await db.scalar(select(Tariff).where(Tariff.id == tariff_id))
        user = await db.scalar(select(User).where(User.id == user_id))

        if not tariff or not user or not user.email:
            return None

        if not (
            result := await YookassaManager.create_recurring_payment(
                user_id=user_id,
                user_email=user.email,
                amount=tariff.price,
                payment_method_id=payment_id,
                tariff_id=tariff_id,
                tariff_description=tariff.description,
            )
        ):
            db.add(
                Transaction(
                    status="failed",
                    user_id=user_id,
                    amount=tariff.price,
                    payment_id=payment_id,
                    payment_type="renewal",
                    product=tariff.sys_name,
                    meta_data={
                        "user_id": str(user_id),
                        "tariff_id": str(tariff_id)
                    },
                )
            )
            await db.commit()
        return result

    @staticmethod
    async def process_webhook(
        db: AsyncSession, webhook_data: dict, client_ip: str = None
    ) -> bool:
        """Обрабатывает вебхук от ЮКассы."""
        from app.services import get_service

        parsed_data = await YookassaManager.parse_webhook(webhook_data, client_ip)
        if not parsed_data:
            return False

        metadata = parsed_data.metadata or {}
        user_id = UUID(metadata.get("user_id"))
        tariff_id = UUID(metadata.get("tariff_id"))
        tariff = await db.scalar(select(Tariff).where(Tariff.id == tariff_id))

        db.add(
            Transaction(
                user_id=user_id,
                product=tariff.sys_name,
                amount=parsed_data.amount,
                status=parsed_data.status.value,
                payment_id=parsed_data.payment_id,
                payment_type=metadata.get("payment_type"),
                meta_data=metadata,
            )
        )

        if parsed_data.status == PaymentStatus.SUCCEEDED:
            payment_method_id = (webhook_data.get("object", {}).get("payment_method", {}).get("id"))
            await get_service.sub.update_subscription(db, user_id, tariff_id, payment_method_id)

        await db.commit()
        return True

    @staticmethod
    async def can_purchase_tariffs(
        db: AsyncSession, user_id: UUID, tariffs: list[Tariff]
    ) -> dict[UUID, bool]:
        """Проверяет возможность покупки тарифов."""
        if not (
            cur_sub := await db.scalar(
                select(Subscription)
                .join(Tariff)
                .where(Subscription.user_id == user_id, Subscription.active == True)
            )
        ):
            return {t.id: True for t in tariffs}

        if not (
            cur_tariff := await db.scalar(
                select(Tariff).where(Tariff.id == cur_sub.tariff_id)
            )
        ):
            return {t.id: True for t in tariffs}

        cur_level = get_tariff_level(cur_tariff.sys_name)
        cur_duration = get_tariff_duration(cur_tariff.sys_name)

        result = {}
        for t in tariffs:
            target_level = get_tariff_level(t.sys_name)
            result[t.id] = target_level > cur_level or (
                target_level == cur_level
                and get_tariff_duration(t.sys_name) > cur_duration
            )
        return result
