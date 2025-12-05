# fmt: off
# isort: off
from uuid import UUID
from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy import String, Integer, ForeignKey, JSON, select, desc, and_, func

from .base import Base

if TYPE_CHECKING:
    from .user import User


class Transaction(Base):
    """Модель транзакции платежа."""
    __tablename__ = "transactions"

    user_id:      Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    amount:       Mapped[int] = mapped_column(Integer, nullable=False)
    currency:     Mapped[str] = mapped_column(String(10), default="RUB")
    provider:     Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    payment_id:   Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    payment_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    product:      Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status:       Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    meta_data:    Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Отношения
    user: Mapped["User"] = relationship(back_populates="transactions")


    @classmethod
    async def last_success_payment(cls, session: AsyncSession, user_id: UUID, provider: str) -> Optional["Transaction"]:
        """Получает последний успешный платеж пользователя через указанного провайдера."""
        return await session.scalar(
            select(cls).where(
                cls.user_id == user_id,
                cls.status == "succeeded",
                cls.provider == provider
            ).order_by(desc(cls.created_at)).limit(1)
        )


    @classmethod
    async def get_failed_renewals(cls, session: AsyncSession) -> list["Transaction"]:
        """Получает неуспешные renewal платежи за вчера."""
        yesterday = datetime.now().date() - timedelta(days=1)
        return (await session.execute(
            select(cls).where(
                and_(
                    cls.payment_type == "renewal",
                    cls.status != "succeeded",
                    func.date(cls.created_at) == yesterday
                )
            )
        )).scalars().all()


    @classmethod
    async def get_last_7_transactions(cls, session: AsyncSession, user_id: UUID, provider: str) -> list["Transaction"]:
        """Получает последние 7 транзакций пользователя для провайдера."""
        return (await session.execute(
            select(cls).where(
                and_(
                    cls.user_id == user_id,
                    cls.provider == provider
                )
            ).order_by(desc(cls.created_at)).limit(7)
        )).scalars().all()
