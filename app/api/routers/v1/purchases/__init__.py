from uuid import UUID
from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, DBSession
from .manager import PurchasesRouterManager
from .schemas import *


router = APIRouter(prefix="/purchases", tags=["Purchases"])


@router.post("/chat/{chat_id}", response_model=PurchaseResponse, status_code=201)
async def create_purchase(
    chat_id: UUID,
    request: CreatePurchaseRequest,
    user: CurrentUser,
    db: DBSession
) -> PurchaseResponse:
    """Создает новую покупку в чате с анализом охлаждения."""
    return await PurchasesRouterManager.create_purchase(user, db, chat_id, request)


@router.get("/chat/{chat_id}", response_model=list[PurchaseResponse])
async def get_chat_purchases(
    chat_id: UUID,
    user: CurrentUser,
    db: DBSession
) -> list[PurchaseResponse]:
    """Получает все покупки чата."""
    return await PurchasesRouterManager.get_chat_purchases(user, db, chat_id)


@router.patch("/{purchase_id}", response_model=PurchaseResponse)
async def update_purchase_status(
    purchase_id: UUID,
    request: UpdatePurchaseStatusRequest,
    user: CurrentUser,
    db: DBSession
) -> PurchaseResponse:
    """Обновляет статус покупки."""
    if not (purchase := await PurchasesRouterManager.update_purchase_status(
        user, db, purchase_id, request
    )):
        raise HTTPException(404, "Покупка не найдена")
    return purchase


@router.post("/analyze", response_model=AnalyzePurchaseResponse)
async def analyze_purchase(
    request: AnalyzePurchaseRequest,
    user: CurrentUser
) -> AnalyzePurchaseResponse:
    """Анализирует покупку без сохранения."""
    return PurchasesRouterManager.analyze_purchase(user, request)


@router.delete("/chat/{chat_id}/{purchase_id}", status_code=204)
async def delete_purchase(
    chat_id: UUID,
    purchase_id: UUID,
    user: CurrentUser,
    db: DBSession
) -> None:
    """Удаляет покупку из чата."""
    if not await PurchasesRouterManager.delete_purchase(user, db, chat_id, purchase_id):
        raise HTTPException(404, "Покупка не найдена")
    return None
