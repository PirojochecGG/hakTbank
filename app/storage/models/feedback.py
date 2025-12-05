# fmt: off
# isort: off
from uuid import UUID
from sqlalchemy import String, ForeignKey, Text
from typing import TYPE_CHECKING, Optional
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..enums import FeedbackType
from .base import Base

if TYPE_CHECKING:
    from .purchase import Purchase
    from .user import User


class PurchaseFeedback(Base):
    """Модель фидбека по покупке (ответ на опрос)."""
    __tablename__ = "feedbacks"

    purchase_id: Mapped[UUID]         = mapped_column(ForeignKey("purchases.id"), nullable=False, index=True)
    user_id:     Mapped[UUID]         = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    type:        Mapped[FeedbackType] = mapped_column(String(20), nullable=False)
    comment:     Mapped[Optional[str]]= mapped_column(Text)

    # Отношения
    purchase: Mapped["Purchase"] = relationship()
    user: Mapped["User"] = relationship()
