# fmt: off
# isort: off
from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SubscriptionResponse(BaseModel):
    """Ответ с информацией о подписке."""
    id: UUID
    tariff_name: str
    req_max: int
    req_used: int
    is_recurrent: bool
    expire_date: Optional[datetime]


class LimitsResponse(BaseModel):
    """Ответ с лимитами пользователя."""
    req_max: int
    req_used: int
    req_remaining: int
    expire_date: Optional[datetime]


class UpdateSubscriptionRequest(BaseModel):
    """Запрос на обновление подписки."""
    tariff_id: UUID
