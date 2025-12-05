from fastapi import APIRouter

from .manager import UserRouterManager
from app.api.deps import CurrentUser, DBSession
from .schemas import *

router = APIRouter(prefix="/user", tags=["User"])


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(user: CurrentUser):
    """Получение профиля пользователя."""
    return await UserRouterManager.get_profile(user)


@router.patch("/profile", response_model=UserProfileResponse)
async def update_profile(request: UpdateProfileRequest, user: CurrentUser, db: DBSession):
    """Обновление профиля пользователя."""
    return await UserRouterManager.update_profile(user, request, db)
