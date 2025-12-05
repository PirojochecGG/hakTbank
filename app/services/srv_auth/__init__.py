from uuid import UUID
from loguru import logger
from typing import Optional

from .manager import AuthManager
from app.storage.models import User
from .objects import JWTPayload


class AuthService:
    """Фасад сервиса авторизации."""

    def __init__(self, manager: Optional[AuthManager] = None):
        self._manager = manager or AuthManager()
        logger.info("🔐 AuthService инициализирован")

    def hash_password(self, password: str) -> str:
        """Хеширует пароль."""
        return self._manager.hash_password(password)

    def verify_password(self, password: str, password_hash: str) -> bool:
        """Проверяет пароль."""
        return self._manager.verify_password(password, password_hash)

    def create_access_token(self, user_id: UUID) -> str:
        """Создает access токен."""
        return self._manager.create_access_token(user_id)

    def verify_token(self, token: str) -> Optional[JWTPayload]:
        """Проверяет JWT токен."""
        return self._manager.verify_token(token)

    async def get_user_by_token(self, db, token: str) -> Optional[User]:
        """Получает пользователя по токену."""
        return await self._manager.get_user_by_token(db, token)
