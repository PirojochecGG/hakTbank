# fmt: off
# isort: off
from uuid import UUID
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy import Integer, Boolean, DateTime, ForeignKey, String, update, select, and_


from .base import Base

if TYPE_CHECKING:
    from .user import User
    from .tariff import Tariff


class Subscription(Base):
    """Модель подписки пользователя."""
    __tablename__ = "subscriptions"

    user_id:     Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    tariff_id:   Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("tariffs.id"), nullable=False, index=True)
    payment_id:  Mapped[Optional[str]] = mapped_column(String(255), nullable=True, doc="ID метода платежа для автоплатежей в юкасе")
    req_max:     Mapped[int]  = mapped_column(Integer, default=0, doc="Максимум запросов")
    req_used:    Mapped[int]  = mapped_column(Integer, default=0, doc="Использовано вопросов")
    expire_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    active:      Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    # Отношения
    user: Mapped["User"] = relationship(back_populates="subscriptions")
    tariff: Mapped["Tariff"] = relationship(back_populates="subscriptions")


    @classmethod
    async def reset_requests(cls, session: AsyncSession) -> int:
        """Сбрасывает req_used на 0 для всех активных подписок."""
        result = await session.execute(
            update(cls).where(cls.active == True).values(req_used=0)
        ); await session.commit()
        return result.rowcount


    @classmethod
    async def check_user_limits(cls, session: AsyncSession, user_id: UUID) -> bool:
        """Проверяет лимиты пользователя по его ID."""
        result = await session.execute(
            select(cls).where(
                and_(
                    cls.user_id == user_id,
                    cls.active == True,
                )
            )
        )
        subscription = result.scalar_one_or_none()
        if not subscription or (subscription.req_max > 0 and subscription.req_used >= subscription.req_max):
            return False
        return True


    @classmethod
    async def increment_usage(cls, session: AsyncSession, user_id: UUID) -> bool:
        """Увеличивает счетчик использованных запросов для пользователя."""
        result = await session.execute(
            update(cls)
            .where(
                and_(
                    cls.user_id == user_id,
                    cls.active == True,
                )
            )
            .values(req_used=cls.req_used + 1)
        )
        await session.commit()
        return result.rowcount > 0


    @classmethod
    async def get_expired(cls, session: AsyncSession) -> list["Subscription"]:
        """Получает все истекшие подписки."""
        result = await session.execute(
            select(cls).where(
                and_(
                    cls.active == True,
                    cls.expire_date <= datetime.now()
                )
            )
        )
        return list(result.scalars().all())
