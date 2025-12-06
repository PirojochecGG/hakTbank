# fmt: off
# isort: off
from fastapi import APIRouter, Request

from .manager import PaymentRouterManager
from app.api.deps import CurrentUser, DBSession
from .schemas import *


router = APIRouter(prefix="/payment", tags=["Payment"])


@router.get("/tariffs", response_model=TariffsResponse)
async def get_tariffs(user: CurrentUser, db: DBSession) -> TariffsResponse:
    """Получение всех тарифов с проверкой возможности покупки."""
    return await PaymentRouterManager.get_tariffs(db, user)


@router.post("/yookassa/create", response_model=PaymentResponse)
async def create_yookassa_payment(
    request: CreatePaymentRequest, user: CurrentUser, db: DBSession
) -> PaymentResponse:
    """Создание платежа в Юкассе."""
    return await PaymentRouterManager.create_yookassa_payment(user, request, db)


@router.post("/yookassa/webhook")
async def yookassa_webhook(request: Request, db: DBSession) -> dict:
    """Вебхук от Юкассы."""
    client_ip = request.client.host.split(':')[0] if request.client and request.client.host else None
    return await PaymentRouterManager.yookassa_webhook(await request.json(), db, client_ip)
