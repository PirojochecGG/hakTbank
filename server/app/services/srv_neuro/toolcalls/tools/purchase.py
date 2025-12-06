# fmt: off
# isort: off
from uuid import UUID
from typing import Any, Dict
from loguru import logger

from app.services.srv_purchase.objects import CreatePurchaseRequest
from app.storage import get_session
from .. import BaseTool


class AddPurchaseTool(BaseTool):
    """Тулкал для добавления покупки в чат"""

    def get_name(self) -> str:
        return "add_purchase"

    def get_description(self) -> str:
        return "Добавляет товар в список желаемых покупок. Используй когда пользователь хочет добавить товар с названием, ценой и категорией. Автоматически рассчитывает период охлаждения."

    def get_parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Название товара"
                },
                "price": {
                    "type": "integer",
                    "description": "Цена товара в рублях"
                },
                "category": {
                    "type": "string",
                    "description": "Категория товара. Примеры: электроника, одежда, техника, дом и сад, растения"
                },
                "url": {
                    "type": "string",
                    "description": "Ссылка на товар (опционально)"
                }
            },
            "required": ["name", "price", "category"]
        }

    async def execute(self, name: str, price: int, category: str, user_id: str, chat_id: str, url: str = None, **kwargs) -> Dict[str, Any]:
        """Добавляет покупку в чат"""
        from app.services import get_service
        try:
            logger.info(f"AddPurchase: {name}, {price}, {category}, user={user_id}, chat={chat_id}")
            async for db in get_session():
                purchase = await get_service.purchase.create_purchase(
                    db, UUID(user_id), UUID(chat_id),
                    CreatePurchaseRequest(
                        name=name,
                        price=price,
                        category=category,
                        url=url
                    )
                )
                await db.commit()
                return {
                    "success": True,
                    "purchase_id": str(purchase.id),
                    "name": purchase.name,
                    "price": purchase.price,
                    "category": purchase.category,
                    "cooling_days": purchase.cooling_days,
                    "available_date": purchase.available_date.strftime('%d.%m.%Y') if purchase.available_date else "сейчас",
                    "message": f"✅ Товар '{name}' добавлен. Рекомендуемый период охлаждения: {purchase.cooling_days} дней"
                }

        except Exception as e:
            logger.error(f"Ошибка добавления покупки: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
