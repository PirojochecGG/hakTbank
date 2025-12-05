from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.storage.models import User
from .schemas import *


class UserRouterManager:
    """Менеджер логики роутера пользователя."""

    @staticmethod
    async def get_profile(user: User) -> UserProfileResponse:
        """Получение профиля пользователя."""
        return UserProfileResponse(
            nickname=user.nickname,
            email=user.email,
            monthly_savings=user.monthly_savings,
            monthly_salary=user.monthly_salary,
            current_savings=user.current_savings,
            blacklist=user.blacklist,
            cooling_ranges=user.cooling_ranges,
            notify_frequency=user.notify_frequency,
            notify_channel=user.notify_channel
        )

    @staticmethod
    async def update_profile(user: User, request: UpdateProfileRequest, db: AsyncSession) -> UserProfileResponse:
        """Обновление профиля пользователя."""
        if request.monthly_savings is not None:
            user.monthly_savings = request.monthly_savings
        if request.monthly_salary is not None:
            user.monthly_salary = request.monthly_salary
        if request.current_savings is not None:
            user.current_savings = request.current_savings
        if request.blacklist is not None:
            user.blacklist = request.blacklist
        if request.cooling_ranges is not None:
            user.cooling_ranges = request.cooling_ranges
        if request.notify_frequency is not None:
            user.notify_frequency = request.notify_frequency
        if request.notify_channel is not None:
            user.notify_channel = request.notify_channel

        await db.commit()
        await db.refresh(user)
        
        return await UserRouterManager.get_profile(user)
