# fmt: off
# isort: off
from typing import List
from pydantic import BaseModel

class ModelResponse(BaseModel):
    """Схема ответа для модели."""
    name: str
    model_id: str
    description: str
    available: bool


class ModelsListResponse(BaseModel):
    """Схема ответа со списком моделей."""
    models: List[ModelResponse]
