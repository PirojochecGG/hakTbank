# fmt: off
from loguru import logger
from sqlalchemy import select
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.services import get_service
from app.storage.models import User
from .schemas import *


class AuthRouterManager:
    """Менеджер логики роутера авторизации."""

    @staticmethod
    async def login(request: LoginRequest, db: AsyncSession) -> AuthResponse:
        """Логин по email/password."""
        user = await db.scalar(select(User).where(User.email == request.email))
        if not user or not get_service.auth.verify_password(request.password, user.password_hash):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный email или пароль")

        access_token = get_service.auth.create_access_token(user.id)
        logger.info(f"👋 User {user.nickname} ({user.email}) logged in")

        return AuthResponse(
            access_token=access_token,
            user=UserInfo(id=str(user.id), nickname=user.nickname, email=user.email)
        )

    @staticmethod
    async def register(request: RegisterRequest, db: AsyncSession) -> AuthResponse:
        """Регистрация нового пользователя."""
        if await db.scalar(select(User).where(User.email == request.email)):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Пользователь с таким email уже существует")

        if await db.scalar(select(User).where(User.nickname == request.nickname)):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Пользователь с таким nickname уже существует")

        password_hash = get_service.auth.hash_password(request.password)
        user = await User.create_new(
            db,
            email=request.email,
            nickname=request.nickname,
            password_hash=password_hash
        )

        access_token = get_service.auth.create_access_token(user.id)
        await db.commit()

        logger.info(f"✨ New user registered: {user.nickname} ({user.email})")
        return AuthResponse(
            access_token=access_token,
            user=UserInfo(id=str(user.id), nickname=user.nickname, email=user.email)
        )
