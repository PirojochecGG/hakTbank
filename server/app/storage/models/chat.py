# fmt: off
# isort: off
from uuid import UUID
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .user import User
    from .message import Message
    from .purchase import Purchase


class Chat(Base):
    """Модель чата с пользователем."""
    __tablename__ = "chats"

    user_id:         Mapped[UUID]               = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title:           Mapped[str]                = mapped_column(String(500), default="Новый чат", nullable=False)
    last_message_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Отношения
    user: Mapped["User"] = relationship(back_populates="chats")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="chat", cascade="all, delete-orphan"
    )
    purchases: Mapped[list["Purchase"]] = relationship(
        back_populates="chat", cascade="all, delete-orphan"
    )
