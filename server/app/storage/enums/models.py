# fmt: off
from enum import Enum
from dataclasses import dataclass


@dataclass
class ModelInfo:
    name: str
    description: str
    model_id: str
    premium_only: bool = False


class AIModel(Enum):
    GEMINI   = ModelInfo("Gemini",   "Google Gemini", "gemini-1.5-flash")
    GPT_4    = ModelInfo("GPT-4",    "OpenAI GPT-4",  "gpt-4",       True)
    GPT_5    = ModelInfo("GPT-5",    "OpenAI GPT-5",  "gpt-5",        True)
    DEEPSEEK = ModelInfo("DeepSeek", "DeepSeek AI",   "deepseek-chat", True)

    @classmethod
    def get_available_models(cls, is_premium: bool) -> list[dict]:
        """Возвращает доступные модели для пользователя."""
        return [
            {
                "name": model.value.name,
                "description": model.value.description,
                "model_id": model.value.model_id,
                "available": not model.value.premium_only or is_premium
            }
            for model in cls
        ]

    @classmethod
    def has_access(cls, model_id: str, is_premium: bool) -> bool:
        """Проверяет доступ к модели."""
        for model in cls:
            if model.value.model_id == model_id:
                return not model.value.premium_only or is_premium
        return False
