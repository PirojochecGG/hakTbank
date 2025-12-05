# fmt: off
# isort: off
from typing import TYPE_CHECKING, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone
from sqlalchemy import String, Integer, JSON, select
from sqlalchemy.orm import Mapped, mapped_column, relationship, selectinload

from ..enums import AIModel
from .base import Base

if TYPE_CHECKING:
    from .subscription import Subscription
    from .transaction import Transaction
    from .requests import Request
    from .chat import Chat
    from .purchase import Purchase


class User(Base):
    """Модель пользователя - финансовый профиль."""
    __tablename__ = "users"

    email:            Mapped[str]           = mapped_column(String(255), unique=True, index=True, nullable=False)
    nickname:         Mapped[str]           = mapped_column(String(100), unique=True, index=True, nullable=False)
    password_hash:    Mapped[str]           = mapped_column(String(255), nullable=False)
    monthly_savings:  Mapped[int]           = mapped_column(Integer, default=0, doc="Сумма откладываемая в месяц (рубли)")
    monthly_salary:   Mapped[Optional[int]] = mapped_column(Integer, doc="Месячная зарплата (рубли)")
    current_savings:  Mapped[int]           = mapped_column(Integer, default=0, doc="Текущие накопления (рубли)")
    blacklist:        Mapped[list[str]]     = mapped_column(JSON, default=list, doc="Запрещенные категории")
    cooling_ranges:   Mapped[dict]          = mapped_column(JSON, default=dict, doc="Диапазоны охлаждения {price: days}")
    notify_frequency: Mapped[str]           = mapped_column(String(20), default="weekly", doc="Частота уведомлений")
    notify_channel:   Mapped[str]           = mapped_column(String(50), default="app", doc="Канал уведомлений")
    meta:             Mapped[Optional[dict]]= mapped_column(JSON)

    # Отношения
    requests: Mapped[list["Request"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    chats: Mapped[list["Chat"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    purchases: Mapped[list["Purchase"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    async def get_available_models(self, session: AsyncSession) -> list[dict]:
        """Возвращает доступные модели для пользователя."""
        return AIModel.get_available_models(await self.is_premium(session))


    async def has_model_access(self, session: AsyncSession, model_id: str) -> bool:
        """Проверяет доступ к модели."""
        return AIModel.has_access(model_id, await self.is_premium(session))


    @classmethod
    async def create_new(cls, session: AsyncSession, **kwargs) -> "User":
        """Создает пользователя с бесплатной подпиской."""
        from .tariff import Tariff
        from .subscription import Subscription

        session.add(user := cls(**kwargs))
        await session.flush()

        if not (tariff := await Tariff.get_default(session)):
            raise ValueError("Бесплатный тариф не найден")

        session.add(Subscription(
            user_id=user.id, tariff_id=tariff.id, req_max=tariff.quota,
            expire_date=datetime.now(timezone.utc) + timedelta(days=tariff.expire_days)
        ))
        return user


    async def is_premium(self, session: AsyncSession) -> bool:
        """Проверяет, есть ли у пользователя активная платная подписка."""
        from .subscription import Subscription

        if not (user_with_subs := await session.scalar(
            select(User)
            .options(
                selectinload(User.subscriptions)
                .selectinload(Subscription.tariff)
            )
            .where(User.id == self.id)
        )): return False

        if not user_with_subs.subscriptions:
            return False

        current_sub = max(
            user_with_subs.subscriptions,
            key=lambda s: s.created_at
        )
        return (
            current_sub.active and
            current_sub.tariff.sys_name != "FREE"
        )
