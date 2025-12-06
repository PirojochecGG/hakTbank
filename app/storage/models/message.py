# fmt: off
# isort: off
from uuid import UUID
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..enums import MessageRole
from .base import Base

if TYPE_CHECKING:
    from .chat import Chat


class Message(Base):
    """Модель сообщения в чате."""
    __tablename__ = "messages"

    chat_id: Mapped[UUID]        = mapped_column(ForeignKey("chats.id"), nullable=False, index=True)
    model:    Mapped[str] = mapped_column(String(100), default="deepseek", nullable=False)
    role:    Mapped[MessageRole] = mapped_column(String(20), nullable=False)
    content: Mapped[str]         = mapped_column(Text, nullable=False)
    attachments: Mapped[Optional[dict]] = mapped_column(JSON)
    status:   Mapped[str] = mapped_column(String(50), default="generating", nullable=False)

    # Отношения
    chat: Mapped["Chat"] = relationship(back_populates="messages")
