from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Запрос логина."""
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    """Запрос регистрации."""
    email: EmailStr
    password: str
    nickname: str


class UserInfo(BaseModel):
    """Информация о пользователе."""
    id: str
    nickname: str
    email: str


class AuthResponse(BaseModel):
    """Ответ авторизации."""
    access_token: str
    user: UserInfo
