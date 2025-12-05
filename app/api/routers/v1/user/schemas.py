# fmt: off
from pydantic import BaseModel, Field
from typing import Optional, Literal


class UserProfileResponse(BaseModel):
    """Профиль пользователя."""
    nickname: str
    email: str
    monthly_savings: int
    monthly_salary: Optional[int]
    current_savings: int
    blacklist: list[str]
    cooling_ranges: dict
    notify_frequency: str
    notify_channel: str


class CoolingRange(BaseModel):
    """Диапазон охлаждения."""
    min_amount: int = Field(ge=0)
    max_amount: int = Field(ge=0)
    days: int = Field(ge=0)


class UpdateProfileRequest(BaseModel):
    """Обновление профиля."""
    monthly_savings: Optional[int] = Field(None, ge=0, description="Сумма откладываемая в месяц (рубли)")
    monthly_salary: Optional[int] = Field(None, ge=0, description="Месячная зарплата (рубли)")
    current_savings: Optional[int] = Field(None, ge=0, description="Текущие накопления (рубли)")
    blacklist: Optional[list[str]] = Field(None, max_length=100, description="Запрещенные категории")
    cooling_ranges: Optional[list[CoolingRange]] = Field(None, description="Диапазоны охлаждения")
    notify_frequency: Optional[Literal["daily", "weekly", "monthly"]] = None
    notify_channel: Optional[Literal["app", "email", "tg"]] = None
