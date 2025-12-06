import jwt
import bcrypt

from uuid import UUID
from sqlalchemy import select
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone

from app.storage.models import User
from app.settings import SETTINGS
from .objects import JWTPayload


def _now() -> datetime:
    """Текущее UTC время."""
    return datetime.now(timezone.utc)


class AuthManager:
    """Менеджер для работы с JWT авторизацией."""

    @staticmethod
    def hash_password(password: str) -> str:
        """Хеширует пароль."""
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Проверяет пароль."""
        return bcrypt.checkpw(password.encode(), password_hash.encode())

    @staticmethod
    def create_access_token(user_id: UUID) -> str:
        """Создает access токен на 30 дней."""
        return jwt.encode(
            {
                "user_id": str(user_id),
                "exp": _now() + timedelta(days=30),
                "iat": _now(),
            },
            SETTINGS.JWT_SECRET,
            algorithm="HS256",
        )

    @staticmethod
    def verify_token(token: str) -> Optional[JWTPayload]:
        """Проверяет и декодирует JWT токен."""
        try:
            payload = jwt.decode(token, SETTINGS.JWT_SECRET, algorithms=["HS256"])
            return JWTPayload(**payload)
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None

    @staticmethod
    async def get_user_by_token(db: AsyncSession, token: str) -> Optional[User]:
        """Получает пользователя по access токену."""
        if not (payload := AuthManager.verify_token(token)):
            return None
        return await db.scalar(select(User).where(User.id == UUID(payload.user_id)))
