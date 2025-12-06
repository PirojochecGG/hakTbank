# fmt: off
# isort: off
from uuid import UUID
from datetime import datetime

from app.storage.models import Request
from ..objects import HandlerResponse
from ..clients import get_client
from .base import BaseHandler


class ChatHandler(BaseHandler):
    """Обработчик чат-запросов."""

    async def _execute(self, req: Request, msgs: list, message_id: UUID, attachments: list = None) -> HandlerResponse:
        from app.services import get_service
        return await (self._stream if req.payload.get("stream") else self._sync)(req, self._chat_id, msgs, message_id, get_service, attachments)


    async def _stream(self, req, chat_id, msgs, message_id, svc, attachments=None):
        """Стриминг."""
        model = req.payload.get("model")
        await svc.redis.publish_message_start(req.id, {
            "message_id": str(message_id),
            "chat_id": str(chat_id),
            "role": "assistant",
            "model": model,
            "attachments": attachments,
            "created_at": datetime.now().isoformat(),
            "status": "generating"
        })

        content = ""
        async for chunk in get_client("NebiusLLM").chat_completion_stream(
            messages=msgs, model="Qwen/Qwen3-30B-A3B-Thinking-2507"
        ):
            if text := chunk.get("text"):
                await svc.redis.publish_chunk(req.id, text)
                content += text

        await svc.redis.publish_done(req.id, {
            "status": "completed"
        })

        return HandlerResponse(
            chat_id=chat_id,
            model=model,
            content=content,
            attachments=attachments
        )


    async def _sync(self, req, chat_id, msgs, message_id, svc, attachments=None):
        """Обычный запрос."""
        print(f"ChatHandler messages: ------------------ {msgs}")

        model = req.payload.get("model")
        content = (await get_client("GeminiLLM").chat_completion(
            messages=msgs, model=model)
        ).choices[0].message.content or ""

        await svc.redis.set_result(req.id, {
            "id": str(message_id),
            "chat_id": str(chat_id),
            "role": "assistant",
            "content": content,
            "attachments": attachments,
            "created_at": datetime.now().isoformat(),
            "status": "completed",
        })

        return HandlerResponse(
            chat_id=chat_id,
            model=model,
            content=content,
            attachments=attachments
        )
