# fmt: off
import json
import asyncio

from uuid import UUID
from sqlalchemy import select
from typing import AsyncGenerator
from fastapi import HTTPException, status

from app.storage import MessageFeedback, Message, RequestPriority
from app.api.deps import CurrentUser, DBSession
from app.services import get_service
from app.settings import SETTINGS
from .schemas import *


class LLMRouterManager:
    """Менеджер для LLM роутера."""

    @staticmethod
    def _build_payload(request_data: ChatRequest) -> dict:
        return {
            "stream": request_data.stream,
            "text": request_data.text,
            "type": "text_completion",
            "model": request_data.model,
            "agent_id": request_data.agent_id,
            "chat_id": str(request_data.chat_id) if request_data.chat_id else None,
            **({"attachments": [att.model_dump() for att in request_data.attachments]}
               if request_data.attachments else {})
        }


    @staticmethod
    async def _add_request(request_data: ChatRequest, user: CurrentUser, db: DBSession):
        return await get_service.queue.add_request(
            db=db, user_id=user.id, payload=LLMRouterManager._build_payload(request_data),
            priority=RequestPriority.PREMIUM if await user.is_premium(db) else RequestPriority.GENERAL
        )


    @staticmethod
    async def chat_completion(request_data: ChatRequest, user: CurrentUser, db: DBSession) -> ChatResponse:
        request_id = await LLMRouterManager._add_request(request_data, user, db)
        for _ in range(SETTINGS.MAX_TIMEOUT + 15):
            if result := await get_service.redis.get_result(request_id):
                if result.get("error"):
                    raise HTTPException(
                        status_code=result.get("status_code", 500),
                        detail=result.get("message", "Internal server error")
                    )
                return ChatResponse(**result)
            await asyncio.sleep(5)
        raise HTTPException(status.HTTP_408_REQUEST_TIMEOUT, "Таймаут обработки")


    @staticmethod
    async def chat_stream(request_data: ChatRequest, user: CurrentUser, db: DBSession) -> AsyncGenerator[str, None]:
        request_id = await LLMRouterManager._add_request(request_data, user, db)
        async for chunk in get_service.redis.subscribe_to_stream(request_id):
            try:
                yield chunk
                if json.loads(chunk.replace("data: ", "").strip()).get("error"):
                    return
            except Exception:
                pass


    @staticmethod
    async def create_or_update_feedback(
        message_id: UUID, request: FeedbackRequest, user: CurrentUser, db: DBSession
    ) -> FeedbackResponse:
        if not await db.get(Message, message_id):
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Сообщение не найдено")

        stmt = select(MessageFeedback).where(
            MessageFeedback.message_id == message_id,
            MessageFeedback.user_id == user.id
        )
        if (feedback := (await db.execute(stmt)).scalar_one_or_none()):
            feedback.type = request.type
            feedback.comment = request.comment
        else:
            feedback = MessageFeedback(
                message_id=message_id, user_id=user.id,
                type=request.type, comment=request.comment
            )
            db.add(feedback)

        await db.commit()
        await db.refresh(feedback)
        return FeedbackResponse(
            id=feedback.id, message_id=feedback.message_id,
            type=feedback.type, comment=feedback.comment,
            created_at=feedback.created_at.isoformat()
        )
