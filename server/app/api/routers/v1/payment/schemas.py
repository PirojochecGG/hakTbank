# fmt: off
# isort: off
from uuid import UUID
from pydantic import BaseModel


class CreatePaymentRequest(BaseModel):
    """Запрос на создание платежа."""
    tariff_id: UUID


class PaymentResponse(BaseModel):
    """Ответ с данными платежа."""
    amount: int
    confirmation_url: str
    currency: str = "RUB"


class TariffResponse(BaseModel):
    """Ответ с информацией о тарифе."""
    id: UUID
    name: str
    sys_name: str
    description: str
    quota: int
    price: int
    expire_days: int
    can_purchase: bool


class TariffsResponse(BaseModel):
    """Ответ со списком тарифов."""
    tariffs: list[TariffResponse]
