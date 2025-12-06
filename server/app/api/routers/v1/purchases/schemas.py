from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

from app.storage.enums import PurchaseStatus


class CreatePurchaseRequest(BaseModel):
    """Запрос на создание покупки."""
    name: str = Field(..., max_length=500)
    price: int = Field(..., gt=0, description="Цена в рублях")
    category: str = Field(..., max_length=200)
    picture: Optional[str] = Field(None, max_length=1000)
    url: Optional[str] = Field(None, max_length=1000)


class PurchaseResponse(BaseModel):
    """Ответ с информацией о покупке."""
    id: UUID
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


class UpdatePurchaseStatusRequest(BaseModel):
    """Запрос на обновление статуса покупки."""
    status: Optional[PurchaseStatus] = None
    notify_excluded: Optional[bool] = None


class AnalyzePurchaseRequest(BaseModel):
    """Запрос на анализ покупки."""
    price: int = Field(..., gt=0, description="Цена в рублях")
    category: str = Field(..., max_length=200)


class AnalyzePurchaseResponse(BaseModel):
    """Результат анализа покупки."""
    is_blacklisted: bool
    cooling_days: int
    savings_days: int
    total_days: int
    available_date: Optional[datetime]
    recommendation: str
