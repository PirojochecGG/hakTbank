# fmt: off
# isort: off
import asyncio
import ipaddress

from loguru import logger
from typing import Optional
from uuid import UUID, uuid4
from yookassa import Configuration, Payment

from app.settings import SETTINGS
from ...objects import *


class YookassaManager:
    """Менеджер для работы с Юкассой."""

    # Инициализация конфигурации при загрузке модуля
    Configuration.account_id = SETTINGS.YOOKASSA_SHOP_ID
    Configuration.secret_key = SETTINGS.YOOKASSA_SECRET_KEY


    # Разрешенные IP-адреса Юкассы
    ALLOWED_IPS = [
        "185.71.76.0/27", "185.71.77.0/27", "77.75.153.0/25",
        "77.75.156.11/32", "77.75.156.35/32", "77.75.154.128/25",
        "2a02:5180::/32"
    ]


    @classmethod
    def is_valid_ip(cls, client_ip: str) -> bool:
        """Проверяет, что IP-адрес входит в разрешенный список Юкассы."""
        try:
            return any(
                ipaddress.ip_address(client_ip) in ipaddress.ip_network(allowed_ip, strict=False)
                for allowed_ip in cls.ALLOWED_IPS
            )
        except ValueError:
            return False


    @classmethod
    async def check_payment(cls, payment_id: str) -> Optional[str]:
        """Получает актуальный статус платежа через API."""
        def _get_payment():
            payment = Payment.find_one(payment_id)
            return payment.status if payment.status in ["succeeded", "canceled", "failed"] else None
        try:
            return await asyncio.to_thread(_get_payment)
        except Exception as e:
            logger.error(f"Ошибка получения статуса платежа {payment_id}: {e}")
            return None


    @staticmethod
    async def create_payment(amount: int, user_id: UUID, tariff_id: UUID, tariff_description: str, user_email: str) -> Optional[PaymentResponse]:
        """Создает платеж в Юкассе."""
        def _create_payment():
            return Payment.create({
                "save_payment_method": True, "capture": True,
                "amount": {"value": str(amount), "currency": "RUB"},
                "confirmation": {"type": "redirect", "return_url": "studgptapp://payment/success"},
                "description": f"Покупка тарифа: {tariff_description}",
                "receipt": {
                    "customer": {
                        "email": user_email
                    },
                    "items": [{
                        "description": tariff_description,
                        "quantity": "1",
                        "amount": {
                            "value": str(amount),
                            "currency": "RUB"
                        },
                        "vat_code": "1"
                    }]
                },
                "metadata": {"user_id": str(user_id), "tariff_id": str(tariff_id), "payment_type": "payment"}
            }, uuid4())

        try:
            payment = await asyncio.to_thread(_create_payment)
            return PaymentResponse(
                payment_id=payment.id,
                confirmation_url=payment.confirmation.confirmation_url,
                status=payment.status,
                amount=amount
            )
        except Exception as e:
            logger.error(f"Ошибка создания платежа: {e}")
            return None


    @staticmethod
    async def create_recurring_payment(amount: int, payment_method_id: str, user_id: UUID, tariff_id: UUID, user_email: str, tariff_description: str) -> Optional[PaymentResponse]:
        """Создает рекурентный платеж."""
        def _create_recurring():
            return Payment.create({
                "amount": {"value": str(amount), "currency": "RUB"},
                "payment_method_id": payment_method_id, "capture": True,
                "description": f"Автопродление тарифа: {tariff_description}",
                "receipt": {
                    "customer": {
                        "email": user_email
                    },
                    "items": [{
                        "description": tariff_description,
                        "quantity": "1",
                        "amount": {
                            "value": str(amount),
                            "currency": "RUB"
                        },
                        "vat_code": "1"
                    }]
                },
                "metadata": {"user_id": str(user_id), "tariff_id": str(tariff_id), "payment_type": "renewal"}
            }, uuid4())

        try:
            payment = await asyncio.to_thread(_create_recurring)
            return PaymentResponse(
                payment_id=payment.id,
                status=payment.status,
                amount=amount
            )
        except Exception as e:
            logger.error(f"Ошибка создания рекурентного платежа: {e}")
            return None


    @classmethod
    async def parse_webhook(cls, webhook_data: dict, client_ip: str = None) -> Optional[YookassaWebhook]:
        """Парсит и валидирует вебхук от Юкассы."""
        try:
            # Проверка IP-адреса
            if client_ip and not cls.is_valid_ip(client_ip):
                logger.warning(f"Вебхук с недопустимого IP: {client_ip}")
                return None

            # Получаем платеж из вебхука
            payment = webhook_data.get("object", {})
            if not (payment_id := payment.get("id")):
                return None

            # Проверяем актуальный статус через API
            if not (status := await cls.check_payment(payment_id)):
                return None

            return YookassaWebhook(
                payment_id=payment_id,
                metadata=payment.get("metadata"),
                amount=int(float(payment["amount"]["value"])),
                status=(
                    PaymentStatus.SUCCEEDED if status == "succeeded" else
                    PaymentStatus.CANCELED
                )
            )

        except Exception as e:
            logger.error(f"Ошибка парсинга вебхука юкасы: {e}")
            return None
