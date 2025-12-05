# fmt: off
# isort: off
from uuid import UUID
from loguru import logger
from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone, timedelta

from app.storage.models import Subscription, Tariff
from .objects import SubscriptionInfo, LimitsInfo


class SubManager:
    """Менеджер для работы с подписками."""

    @staticmethod
    def calculate_bonus_days(sub: Subscription, now: datetime) -> int:
        """Рассчитывает бонусные дни от оставшейся платной подписки."""
        if not sub.tariff or sub.tariff.sys_name in ("FREE"):
            return 0
        if not sub.expire_date or sub.expire_date <= now:
            return 0
        return (sub.expire_date - now).days // 2


    @staticmethod
    async def get_user_subscription(db: AsyncSession, user_id: UUID) -> Optional[SubscriptionInfo]:
        """Получает активную подписку пользователя."""
        if not (subscription := await db.scalar(
            select(Subscription).options(selectinload(Subscription.tariff))
            .where(Subscription.user_id == user_id, Subscription.active == True)
        )): return None

        return SubscriptionInfo(
            id=subscription.id, tariff_name=subscription.tariff.name,
            req_max=subscription.req_max, req_used=subscription.req_used,
            expire_date=subscription.expire_date, payment_id=subscription.payment_id
        )


    @staticmethod
    async def get_user_limits(db: AsyncSession, user_id: UUID) -> Optional[LimitsInfo]:
        """Получает лимиты пользователя."""
        if not (subscription := await db.scalar(
            select(Subscription).where(Subscription.user_id == user_id, Subscription.active == True)
        )): return None

        return LimitsInfo(
            req_max=subscription.req_max, req_used=subscription.req_used,
            req_remaining=max(0, subscription.req_max - subscription.req_used),
            expire_date=subscription.expire_date
        )

    @staticmethod
    async def off_auto_renewal(db: AsyncSession, user_id: UUID) -> bool:
        """Отменяет автопродление подписки (сбрасывает payment_id)."""
        if not (subscription := await db.scalar(
            select(Subscription).where(Subscription.user_id == user_id, Subscription.active == True)
        )):
            return False
        subscription.payment_id = None
        logger.info(f"🍿 Auto-renewal disabled for user {user_id}")
        await db.commit()
        return True


    @staticmethod
    async def update_subscription(
        db: AsyncSession, user_id: UUID, tariff_id: UUID, payment_method_id: str = None
    ) -> Optional[SubscriptionInfo]:
        """Обновляет подписку пользователя."""
        if not (tariff := await db.scalar(select(Tariff).where(Tariff.id == tariff_id))):
            return None

        now = datetime.now(timezone.utc)
        expire_date = now + timedelta(days=tariff.expire_days)

        if not (sub := await db.scalar(
            select(Subscription).options(selectinload(Subscription.tariff))
            .where(Subscription.user_id == user_id, Subscription.active == True)
        )):
            db.add(sub := Subscription(
                user_id=user_id, tariff_id=tariff_id,
                req_max=tariff.quota, expire_date=expire_date,
                payment_id=payment_method_id
            ))
        else:
            if bonus_days := SubManager.calculate_bonus_days(sub, now):
                expire_date += timedelta(days=bonus_days)
                logger.info(f"🎁 Bonus {bonus_days} days added from remaining subscription")

            if payment_method_id:
                sub.payment_id = payment_method_id
            sub.expire_date = expire_date
            sub.req_max = tariff.quota
            sub.tariff_id = tariff_id
            sub.req_used = 0

        await db.commit()
        await db.refresh(sub)

        logger.info(f"🍿 Subscription updated for user {user_id}: tariff={tariff.sys_name}, expire={expire_date}")
        return SubscriptionInfo(
            id=sub.id, tariff_name=tariff.name,
            req_max=sub.req_max, req_used=sub.req_used,
            expire_date=sub.expire_date, payment_id=sub.payment_id
        )
