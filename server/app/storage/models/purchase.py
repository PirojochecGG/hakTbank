# fmt: off
# isort: off
from uuid import UUID
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..enums import PurchaseStatus
from .base import Base

if TYPE_CHECKING:
    from .user import User
    from .chat import Chat


class Purchase(Base):
    """Модель желаемой покупки."""
    __tablename__ = "purchases"

    user_id:         Mapped[UUID]               = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    chat_id:         Mapped[UUID]               = mapped_column(ForeignKey("chats.id"), nullable=False, index=True, doc="Чат в котором добавлена покупка")
    name:            Mapped[str]                = mapped_column(String(500), nullable=False)
    url:             Mapped[Optional[str]]      = mapped_column(String(1000))
    price:           Mapped[int]                = mapped_column(Integer, nullable=False, doc="Цена в рублях")
    picture:         Mapped[Optional[str]]      = mapped_column(String(1000), doc="URL картинки товара")
    category:        Mapped[str]                = mapped_column(String(200), nullable=False)
    status:          Mapped[PurchaseStatus]     = mapped_column(String(20), default=PurchaseStatus.PENDING, nullable=False, index=True)
    cooling_days:    Mapped[int]                = mapped_column(Integer, default=0, doc="Рекомендованный срок охлаждения")
    notify_excluded: Mapped[bool]               = mapped_column(Boolean, default=False, doc="Исключить из уведомлений")
    available_date:  Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), doc="Дата когда покупка станет комфортной")

    # Отношения
    user: Mapped["User"] = relationship(back_populates="purchases")
    chat: Mapped["Chat"] = relationship(back_populates="purchases")
