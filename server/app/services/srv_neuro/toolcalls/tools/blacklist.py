# fmt: off
# isort: off
from uuid import UUID
from loguru import logger
from typing import Any, Dict
from sqlalchemy.orm.attributes import flag_modified

from app.storage import get_session, User
from .. import BaseTool


class AddToBlacklistTool(BaseTool):
    """Тулкал для добавления категории в черный список"""

    def get_name(self) -> str:
        return "add_to_blacklist"

    def get_description(self) -> str:
        return "Добавляет категорию товаров в черный список запрещенных покупок"

    def get_parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "Категория товаров для добавления в черный список (например: видеоигры, техника, алкоголь)"
                }
            },
            "required": ["category"]
        }

    async def execute(self, category: str, user_id: str, **kwargs) -> Dict[str, Any]:
        """Добавляет категорию в blacklist пользователя"""
        try:
            async for db in get_session():
                if not (user := await db.get(User, UUID(user_id))):
                    return {"success": False, "error": "Пользователь не найден"}

                category_lower = category.lower().strip()
                if category_lower in [c.lower() for c in user.blacklist]:
                    return {
                        "success": False,
                        "message": f"Категория '{category}' уже в черном списке"
                    }

                user.blacklist.append(category)
                flag_modified(user, 'blacklist')
                await db.commit()

                return {
                    "success": True,
                    "category": category,
                    "blacklist": user.blacklist,
                    "message": f"✅ Категория '{category}' добавлена в черный список. Теперь запрещено: {', '.join(user.blacklist)}"
                }

        except Exception as e:
            logger.error(f"Ошибка добавления в blacklist: {e}")
            return {"success": False, "error": str(e)}
