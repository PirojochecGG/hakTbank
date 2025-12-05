from uuid import UUID
from enum import Enum
from typing import Optional
from pydantic import BaseModel


class PaymentStatus(str, Enum):
    """Статусы платежей."""
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    CANCELED = "canceled"


class CreatePaymentRequest(BaseModel):
    """Запрос на создание платежа."""
    tariff_id: UUID


class PaymentResponse(BaseModel):
    """Ответ с данными платежа."""
    payment_id: str
    amount: int
    currency: str = "RUB"
    confirmation_url: str
    status: str


class YookassaWebhook(BaseModel):
    """Данные вебхука ЮКассы."""
    payment_id: str
    status: PaymentStatus
    amount: int
    metadata: Optional[dict] = None
