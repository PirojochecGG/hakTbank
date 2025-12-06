# fmt: off
# isort: off
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.services import get_service
from app.storage.models import User
from .schemas import *


class SubscriptionRouterManager:
    """Менеджер логики роутера подписок."""

    @staticmethod
    async def get_subscription(user: User, db: AsyncSession) -> SubscriptionResponse:
        """Получение подписки пользователя."""
        if not (subscription := await get_service.sub.get_user_subscription(db, user.id)):
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Подписка не найдена")

        return SubscriptionResponse(
            id=subscription.id, tariff_name=subscription.tariff_name,
            req_max=subscription.req_max, req_used=subscription.req_used,
            expire_date=subscription.expire_date, is_recurrent=bool(subscription.payment_id)
        )


    @staticmethod
    async def get_limits(user: User, db: AsyncSession) -> LimitsResponse:
        """Получение лимитов пользователя."""
        if not (limits := await get_service.sub.get_user_limits(db, user.id)):
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Лимиты не найдены")

        return LimitsResponse(
            req_max=limits.req_max, req_used=limits.req_used,
            req_remaining=limits.req_remaining, expire_date=limits.expire_date
        )


    @staticmethod
    async def off_auto_renewal(user: User, db: AsyncSession) -> dict:
        """Отмена автопродления подписки."""
        if not await get_service.sub.off_auto_renewal(db, user.id):
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Активная подписка не найдена")
        return {"status": "success"}


    @staticmethod
    async def update_subscription(user: User, request: UpdateSubscriptionRequest, db: AsyncSession) -> SubscriptionResponse:
        """Обновление подписки пользователя."""
        if not (subscription := await get_service.sub.update_subscription(db, user.id, request.tariff_id)):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Не удалось обновить подписку")

        return SubscriptionResponse(
            id=subscription.id, tariff_name=subscription.tariff_name,
            req_max=subscription.req_max, req_used=subscription.req_used,
            expire_date=subscription.expire_date, is_recurrent=bool(subscription.payment_id)
        )