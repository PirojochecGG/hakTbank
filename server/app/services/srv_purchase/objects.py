# fmt: off
from uuid import UUID
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from app.storage.enums import PurchaseStatus


class PurchaseInfo(BaseModel):
    """Информация о покупке."""

    id: UUID
    user_id: UUID
    chat_id: UUID
    name: str
    price: int
    category: str
    picture: Optional[str]
    url: Optional[str]
    status: PurchaseStatus
    cooling_days: int
    available_date: Optional[datetime]
    notify_excluded: bool
    created_at: datetime


class CreatePurchaseRequest(BaseModel):
    """Запрос на создание покупки."""

    name: str
    price: int
    category: str
    picture: Optional[str] = None
    url: Optional[str] = None


class CoolingAnalysis(BaseModel):
    """Результат анализа охлаждения."""

    is_blacklisted: bool
    cooling_days: int
    savings_days: int
    total_days: int
    available_date: Optional[datetime]
    recommendation: str
