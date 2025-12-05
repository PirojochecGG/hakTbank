# fmt: off
from pydantic import BaseModel, Field, field_validator
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


class UpdateProfileRequest(BaseModel):
    """Обновление профиля."""
    monthly_savings: Optional[int] = Field(None, ge=0, description="Сумма откладываемая в месяц (копейки)")
    monthly_salary: Optional[int] = Field(None, ge=0, description="Месячная зарплата (копейки)")
    current_savings: Optional[int] = Field(None, ge=0, description="Текущие накопления (копейки)")
    blacklist: Optional[list[str]] = Field(None, max_length=100, description="Запрещенные категории")
    cooling_ranges: Optional[dict[int, int]] = Field(None, description="Диапазоны охлаждения {price: days}")
    notify_frequency: Optional[Literal["daily", "weekly", "monthly"]] = None
    notify_channel: Optional[Literal["app", "email", "tg"]] = None

    @field_validator("cooling_ranges")
    @classmethod
    def validate_cooling_ranges(cls, v):
        if v is not None:
            for price, days in v.items():
                if not isinstance(price, int) or price < 0:
                    raise ValueError("Цена должна быть положительным числом")
                if not isinstance(days, int) or days < 0:
                    raise ValueError("Количество дней должно быть положительным числом")
        return v
