# fmt: off
# isort: off
from typing import Optional, Dict, Any
from pydantic import BaseModel


class YookassaAmount(BaseModel):
    """Сумма платежа Юкассы."""
    value: str
    currency: str = "RUB"


class YookassaConfirmation(BaseModel):
    """Подтверждение платежа Юкассы."""
    type: str = "redirect"


class YookassaPaymentRequest(BaseModel):
    """Запрос на создание платежа в Юкассе."""
    amount: YookassaAmount
    confirmation: YookassaConfirmation
    capture: bool = True
    save_payment_method: bool = True
    metadata: Optional[Dict[str, Any]] = None


class YookassaPaymentResponse(BaseModel):
    """Ответ Юкассы на создание платежа."""
    id: str
    status: str
    amount: YookassaAmount
    confirmation: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None


class YookassaWebhook(BaseModel):
    """Вебхук от Юкассы."""
    type: str
    event: str
    object: Dict[str, Any]
