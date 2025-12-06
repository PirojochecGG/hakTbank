# fmt: off
# isort: off
from fastapi import APIRouter

from .manager import SubscriptionRouterManager
from app.api.deps import CurrentUser, DBSession
from app.settings import SETTINGS
from .schemas import *


router = APIRouter(prefix="/subscription", tags=["Subscription"])


@router.get("/", response_model=SubscriptionResponse)
async def get_subscription(user: CurrentUser, db: DBSession) -> SubscriptionResponse:
    """Получение информации о подписке пользователя."""
    return await SubscriptionRouterManager.get_subscription(user, db)


@router.get("/limits", response_model=LimitsResponse)
async def get_limits(user: CurrentUser, db: DBSession) -> LimitsResponse:
    """Получение текущих лимитов пользователя."""
    return await SubscriptionRouterManager.get_limits(user, db)


@router.post("/off")
async def cancel_auto_renewal(user: CurrentUser, db: DBSession) -> dict:
    """Отключение автопродления подписки."""
    return await SubscriptionRouterManager.off_auto_renewal(user, db)


# if SETTINGS.IS_DEV:
@router.post("/update", response_model=SubscriptionResponse)
async def update_subscription(
    request: UpdateSubscriptionRequest, user: CurrentUser, db: DBSession
) -> SubscriptionResponse:
    """Обновление подписки пользователя."""
    return await SubscriptionRouterManager.update_subscription(user, request, db)
