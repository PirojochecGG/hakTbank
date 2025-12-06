from fastapi import APIRouter

from .manager import AuthRouterManager
from app.api.deps import DBSession
from .schemas import *

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, db: DBSession):
    """Логин по email и паролю."""
    return await AuthRouterManager.login(request, db)


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest, db: DBSession):
    """Регистрация пользователя."""
    return await AuthRouterManager.register(request, db)
