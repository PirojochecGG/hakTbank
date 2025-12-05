# fmt: off
# isort: off
from uuid import UUID
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..enums import MessageRole
from .base import Base

if TYPE_CHECKING:
    from .chat import Chat


class Message(Base):
    """Модель сообщения в чате."""
    __tablename__ = "messages"

    chat_id: Mapped[UUID]        = mapped_column(ForeignKey("chats.id"), nullable=False, index=True)
    role:    Mapped[MessageRole] = mapped_column(String(20), nullable=False)
    content: Mapped[str]         = mapped_column(Text, nullable=False)

    # Отношения
    chat: Mapped["Chat"] = relationship(back_populates="messages")
