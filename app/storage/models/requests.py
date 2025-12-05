# fmt: off
# isort: off
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import JSON, DateTime, ForeignKey, Text, delete

from ..enums import RequestStatus
from .base import Base

if TYPE_CHECKING:
    from .user import User


class Request(Base):
    """Модель запроса к AI (например, для парсинга товара или анкеты)."""
    __tablename__ = "requests"

    user_id:      Mapped[UUID]               = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    status:       Mapped[RequestStatus]      = mapped_column(default=RequestStatus.PENDING, nullable=False, index=True)
    payload:      Mapped[Dict[str, Any]]     = mapped_column(JSON, default=dict, nullable=False)
    attempts:     Mapped[int]                = mapped_column(default=0, nullable=False)
    max_attempts: Mapped[int]                = mapped_column(default=3, nullable=False)
    locked_at:    Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), index=True)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    error:        Mapped[Optional[str]]      = mapped_column(Text)

    # Отношения
    user: Mapped["User"] = relationship(back_populates="requests")

    @classmethod
    async def cleanup_old_requests(cls, session: AsyncSession, days: int = 7) -> int:
        """Удаляет запросы старше указанного количества дней."""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        result = await session.execute(delete(cls).where(cls.created_at < cutoff_date))
        await session.commit()
        return result.rowcount
