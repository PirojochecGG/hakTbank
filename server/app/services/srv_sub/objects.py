# fmt: off
# isort: off
from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SubscriptionInfo(BaseModel):
    """Информация о подписке."""
    id: UUID
    tariff_name: str
    req_max: int
    req_used: int
    payment_id: Optional[str] = None
    expire_date: Optional[datetime]


class LimitsInfo(BaseModel):
    """Информация о лимитах."""
    req_max: int
    req_used: int
    req_remaining: int
    expire_date: Optional[datetime]


class UpdateSubscriptionRequest(BaseModel):
    """Запрос на обновление подписки."""
    tariff_id: UUID