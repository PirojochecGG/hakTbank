# fmt: off
# isort: off
from fastapi import APIRouter

from app.api.deps import CurrentUser, DBSession
from .schemas import *


router = APIRouter(prefix="/llm", tags=["LLM"])


@router.get("/models", response_model=ModelsListResponse)
async def get_available_models(db: DBSession, user: CurrentUser) -> ModelsListResponse:
    """Получает доступные модели в зависимости от типа подписки."""
    models = await user.get_available_models(db)
    return ModelsListResponse(models=[
        ModelResponse(**model) for model in models
    ])
