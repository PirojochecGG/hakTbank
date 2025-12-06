# fmt: off
# isort: off
from sqlalchemy import select
from typing import TYPE_CHECKING, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import String, Integer, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .subscription import Subscription


class Tariff(Base):
    """Модель тарифного плана."""
    __tablename__ = "tariffs"

    name:         Mapped[str] = mapped_column(String(255), nullable=False)
    sys_name:     Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description:  Mapped[str] = mapped_column(Text, nullable=False)
    quota:        Mapped[int] = mapped_column(Integer, default=0)
    price:        Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    expire_days:  Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    permissions:  Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)
    is_hidden:    Mapped[bool] = mapped_column(default=False)

    # Отношения
    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="tariff", cascade="all, delete-orphan"
    )

    @classmethod
    async def get_default(cls, session: AsyncSession) -> Optional["Tariff"]:
        """Получает тариф по умолчанию."""
        return (await session.execute(
            select(cls).where(cls.sys_name == "FREE"))
        ).scalar_one_or_none()
