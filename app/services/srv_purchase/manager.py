from uuid import UUID
from typing import Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.storage.models import Purchase, User
from app.storage.enums import PurchaseStatus
from .objects import *


class PurchaseManager:
    """Менеджер для работы с покупками."""

    @staticmethod
    async def create_purchase(
        db: AsyncSession, user_id: UUID, chat_id: UUID, request: CreatePurchaseRequest
    ) -> PurchaseInfo:
        """Создает новую покупку."""
        db.add(purchase := Purchase(
            user_id=user_id,
            chat_id=chat_id,
            name=request.name,
            price=request.price,
            category=request.category,
            picture=request.picture,
            url=request.url
        ))
        await db.flush()

        return PurchaseInfo(
            id=purchase.id,
            user_id=purchase.user_id,
            chat_id=purchase.chat_id,
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
    async def get_chat_purchases(
        db: AsyncSession, chat_id: UUID, user_id: UUID
    ) -> list[PurchaseInfo]:
        """Получает покупки чата."""
        purchases = await db.scalars(
            select(Purchase).where(
                and_(
                    Purchase.chat_id == chat_id,
                    Purchase.user_id == user_id,
                    Purchase.status != PurchaseStatus.CANCELLED
                )
            ).order_by(Purchase.created_at.desc())
        )

        return [
            PurchaseInfo(
                id=p.id,
                user_id=p.user_id,
                chat_id=p.chat_id,
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
        db: AsyncSession, purchase_id: UUID, user_id: UUID,
        status: Optional[PurchaseStatus] = None,
        notify_excluded: Optional[bool] = None
    ) -> Optional[PurchaseInfo]:
        """Обновляет статус покупки."""
        if not (purchase := await db.scalar(
            select(Purchase).where(
                and_(Purchase.id == purchase_id, Purchase.user_id == user_id)
            )
        )):
            return None

        if status is not None:
            purchase.status = status
        if notify_excluded is not None:
            purchase.notify_excluded = notify_excluded

        await db.flush()

        return PurchaseInfo(
            id=purchase.id,
            user_id=purchase.user_id,
            chat_id=purchase.chat_id,
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
    def calculate_cooling(user: User, price: int, category: str) -> CoolingAnalysis:
        """Рассчитывает период охлаждения покупки."""
        # Проверка blacklist
        if category.lower() in [c.lower() for c in user.blacklist]:
            return CoolingAnalysis(
                is_blacklisted=True,
                cooling_days=0,
                savings_days=0,
                total_days=0,
                available_date=None,
                recommendation="❌ Покупка из запрещенной категории. Рекомендуем отказаться."
            )

        # Расчет дней охлаждения по диапазонам
        cooling_days = 0
        for price_threshold in sorted(user.cooling_ranges.keys(), key=int):
            if price >= int(price_threshold):
                cooling_days = user.cooling_ranges[price_threshold]

        # Расчет дней накопления
        savings_days = 0
        if user.monthly_savings > 0 and user.current_savings < price:
            needed = price - user.current_savings
            # Оставляем минимум половину накоплений после покупки
            safe_amount = user.current_savings // 2
            if safe_amount < price:
                needed = price - safe_amount
                savings_days = (needed * 30) // user.monthly_savings

        total_days = max(cooling_days, savings_days)
        available_date = datetime.now(timezone.utc) + timedelta(days=total_days) if total_days > 0 else None

        if total_days == 0:
            recommendation = "✅ Можно совершить покупку сейчас"
        elif total_days <= 7:
            recommendation = f"⏳ Рекомендуем подождать {total_days} дней"
        else:
            recommendation = f"⏳ Рекомендуем подождать {total_days} дней ({total_days // 7} недель)"

        return CoolingAnalysis(
            is_blacklisted=False,
            cooling_days=cooling_days,
            savings_days=savings_days,
            total_days=total_days,
            available_date=available_date,
            recommendation=recommendation
        )
