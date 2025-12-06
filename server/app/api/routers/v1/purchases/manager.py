from uuid import UUID
from loguru import logger
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.storage.models import User
from app.services import get_service
from .schemas import *


class PurchasesRouterManager:
    """Менеджер роутера покупок."""

    @staticmethod
    async def create_purchase(
        user: User, db: AsyncSession, chat_id: UUID, request: CreatePurchaseRequest
    ) -> PurchaseResponse:
        """Создает новую покупку с анализом охлаждения."""
        # Анализируем покупку
        analysis = get_service.purchase.calculate_cooling(user, request.price, request.category)
        
        # Создаем покупку
        purchase = await get_service.purchase.create_purchase(
            db, user.id, chat_id, request
        )
        
        # Обновляем данные охлаждения
        if purchase_updated := await get_service.purchase.update_purchase_status(
            db, purchase.id, user.id
        ):
            purchase_updated.cooling_days = analysis.total_days
            purchase_updated.available_date = analysis.available_date
            await db.commit()
            
            logger.info(f"🛒 Created purchase {purchase.id} in chat {chat_id} for user {user.id}")
            
            return PurchaseResponse(
                id=purchase_updated.id,
                name=purchase_updated.name,
                price=purchase_updated.price,
                category=purchase_updated.category,
                picture=purchase_updated.picture,
                url=purchase_updated.url,
                status=purchase_updated.status,
                cooling_days=analysis.total_days,
                available_date=analysis.available_date,
                notify_excluded=purchase_updated.notify_excluded,
                created_at=purchase_updated.created_at
            )
        
        return PurchaseResponse(
            id=purchase.id,
            name=purchase.name,
            price=purchase.price,
            category=purchase.category,
            picture=purchase.picture,
            url=purchase.url,
            status=purchase.status,
            cooling_days=analysis.total_days,
            available_date=analysis.available_date,
            notify_excluded=purchase.notify_excluded,
            created_at=purchase.created_at
        )

    @staticmethod
    async def get_chat_purchases(
        user: User, db: AsyncSession, chat_id: UUID
    ) -> list[PurchaseResponse]:
        """Получает покупки чата."""
        purchases = await get_service.purchase.get_chat_purchases(db, chat_id, user.id)
        
        return [
            PurchaseResponse(
                id=p.id,
                name=p.name,
                price=p.price,
                category=p.category,
                picture=p.picture,
                url=p.url,
                status=p.status,
                cooling_days=p.cooling_days,
                available_date=p.available_date,
                notify_excluded=p.notify_excluded,
                created_at=p.created_at
            )
            for p in purchases
        ]

    @staticmethod
    async def update_purchase_status(
        user: User, db: AsyncSession, purchase_id: UUID, request: UpdatePurchaseStatusRequest
    ) -> Optional[PurchaseResponse]:
        """Обновляет статус покупки."""
        if not (purchase := await get_service.purchase.update_purchase_status(
            db, purchase_id, user.id,
            request.status, request.notify_excluded
        )):
            return None
        
        await db.commit()
        logger.info(f"🛒 Updated purchase {purchase_id} status for user {user.id}")
        
        return PurchaseResponse(
            id=purchase.id,
            name=purchase.name,
            price=purchase.price,
            category=purchase.category,
            picture=purchase.picture,
            url=purchase.url,
            status=purchase.status,
            cooling_days=purchase.cooling_days,
            available_date=purchase.available_date,
            notify_excluded=purchase.notify_excluded,
            created_at=purchase.created_at
        )

    @staticmethod
    def analyze_purchase(user: User, request: AnalyzePurchaseRequest) -> AnalyzePurchaseResponse:
        """Анализирует покупку без сохранения."""
        analysis = get_service.purchase.calculate_cooling(user, request.price, request.category)
        
        return AnalyzePurchaseResponse(
            is_blacklisted=analysis.is_blacklisted,
            cooling_days=analysis.cooling_days,
            savings_days=analysis.savings_days,
            total_days=analysis.total_days,
            available_date=analysis.available_date,
            recommendation=analysis.recommendation
        )

    @staticmethod
    async def delete_purchase(user: User, db: AsyncSession, chat_id: UUID, purchase_id: UUID) -> bool:
        """Удаляет покупку из чата."""
        if await get_service.purchase.delete_purchase(db, chat_id, purchase_id, user.id):
            await db.commit()
            logger.info(f"🗑️ Deleted purchase {purchase_id} from chat {chat_id} for user {user.id}")
            return True
        return False
