# fmt: off
from fastapi.responses import StreamingResponse
from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DBSession
from .manager import LLMRouterManager
from app.storage import Subscription
from .schemas import *


router = APIRouter(prefix="/message", tags=["Message"])


@router.post("/new", response_model=ChatResponse)
async def chat_completion(
    request_data: ChatRequest, user: CurrentUser, db: DBSession
):
    """Отправка сообщения в чат с AI моделью."""
    if not await Subscription.check_user_limits(db, user.id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Лимиты исчерпаны или подписка неактивна")

    # TODO: Расскоменить позже
    # if not await user.has_model_access(db, request_data.model):
    #     raise HTTPException(status.HTTP_403_FORBIDDEN, "Нет доступа к данной модели")

    if request_data.stream:
        return StreamingResponse(
            LLMRouterManager.chat_stream(request_data, user, db),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    return await LLMRouterManager.chat_completion(
        request_data, user, db
    )
