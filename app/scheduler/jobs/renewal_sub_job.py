# fmt: off
# isort: off
from loguru import logger
from typing import Any, Dict
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.storage import get_session, Subscription, Tariff, Transaction
from app.services.srv_payment import PaymentManager, PaymentProvider
from app.services import get_service
from .base import BaseJob


class Job(BaseJob):
    """Обработка автоплатежей для истекших подписок."""

    @property
    def job_id(self) -> str:
        return "renewal_sub_job"

    @property
    def trigger_type(self) -> str:
        return "cron"

    @property
    def trigger_args(self) -> Dict[str, Any]:
        return {"hour": 20, "minute": 0}


    async def _reset_to_free(self, session, sub: Subscription, tariff_id: str, reason: str) -> None:
        """Сбрасывает подписку на FREE тариф."""
        await get_service.sub.update_subscription(session, sub.user_id, tariff_id)
        logger.info(f"🔄 User {sub.user_id}: {reason} → FREE")


    async def _get_renewal_tariff(self, db, last_success: Transaction) -> str | None:
        """Получает tariff_id для продления по sys_name из транзакции."""
        if not (tariff := await db.scalar(
            select(Tariff).where(Tariff.sys_name == last_success.product)
        )):
            return None
        return tariff.id


    async def execute(self) -> None:
        """Обрабатывает истекшие подписки: автоплатежи или сброс на FREE."""
        async for db in get_session():
            expired_subs = await Subscription.get_expired(db)
            def_tariff = await Tariff.get_default(db)

            user_ids = set(
                [s.user_id for s in expired_subs]
            )

            logger.info(f"🔄 Found {len(user_ids)} users for renewal sub")
            for user_id in user_ids:
                try:
                    # ---- Получаем активную подписку пользователя ----
                    if not (sub := await db.scalar(
                        select(Subscription)
                        .options(selectinload(Subscription.tariff))
                        .where(
                            Subscription.user_id == user_id,
                            Subscription.active == True
                        )
                    )): continue


                    # ---- Проверяем флаг автопродления ----
                    if not sub.payment_id:
                        await self._reset_to_free(db, sub, def_tariff.id, "no renewal")

                        # ---- Пытаемся продлить подписку автоплатежом ----
                        if payment := await PaymentManager.create_recurring_payment(
                            db, user_id, sub.tariff_id, sub.payment_id, PaymentProvider.YOOKASSA
                        ):
                            logger.info(f"🔄 User {user_id}: renewal created with status {payment.status}")

                            if payment.status in {"canceled", "failed"}:
                                await self._reset_to_free(db, sub, def_tariff.id, f"renewal {payment.status}")
                        else:
                            await self._reset_to_free(db, sub, def_tariff.id, "renewal failed")

                except Exception as e:
                    logger.error(f"🔄 Error for renewal sub user {user_id}: {e}")
                    continue
