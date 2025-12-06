# fmt: off
# isort: off
from uuid import UUID
from typing import Any, Dict
from loguru import logger

from app.storage import get_session, User
from .. import BaseTool


class UpdateSavingsTool(BaseTool):
    """Тулкал для обновления текущих накоплений пользователя"""

    def get_name(self) -> str:
        return "update_savings"

    def get_description(self) -> str:
        return "Обновляет текущие накопления пользователя для более точного расчета периода охлаждения"

    def get_parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "amount": {
                    "type": "integer",
                    "description": "Текущая сумма накоплений в рублях"
                }
            },
            "required": ["amount"]
        }

    async def execute(self, amount: int, user_id: str, **kwargs) -> Dict[str, Any]:
        """Обновляет накопления пользователя"""
        try:
            if amount < 0:
                return {"success": False, "error": "Сумма не может быть отрицательной"}

            async for db in get_session():
                if not (user := await db.get(User, UUID(user_id))):
                    return {"success": False, "error": "Пользователь не найден"}

                old_amount = user.current_savings
                user.current_savings = amount
                await db.flush()
                await db.commit()

                return {
                    "success": True,
                    "old_amount": old_amount,
                    "new_amount": amount,
                    "message": f"✅ Накопления обновлены: {old_amount:,}₽ → {amount:,}₽"
                }

        except Exception as e:
            logger.error(f"Ошибка обновления накоплений: {e}")
            return {"success": False, "error": str(e)}
