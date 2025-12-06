from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.storage.models import User
from app.services import get_service
from app.storage import get_session


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: AsyncSession = Depends(get_session),
) -> User:
    """Получение текущего пользователя по токену."""
    if not (
        user := await get_service.auth.get_user_by_token(db, credentials.credentials)
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный токен доступа")
    return user
