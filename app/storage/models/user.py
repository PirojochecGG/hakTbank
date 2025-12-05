# fmt: off
# isort: off
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

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
