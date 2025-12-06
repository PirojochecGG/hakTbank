# fmt: off
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, Field, model_validator

from app.storage import FeedbackType


class ChatRequest(BaseModel):
    """Запрос для чата с нейросетью."""

    text: str
    chat_id: Optional[UUID] = None
    model: str = "gemini-2.5-flash-lite"
    stream: bool = False


class ChatResponse(BaseModel):
    """Ответ чата."""

    id: UUID
    chat_id: UUID
    role: str = "assistant"
    content: str
    created_at: str
    status: str
    #attachments: Optional[List[Dict[str, Any]]] = None


class FeedbackRequest(BaseModel):
    """Запрос для создания/обновления фидбека."""

    type: FeedbackType
    comment: Optional[str] = Field(default=None, max_length=1000)

    @model_validator(mode='after')
    def validate_comment(self):
        if self.type == FeedbackType.DISLIKE and not self.comment:
            raise ValueError("Комментарий обязателен для дизлайка")
        return self


class FeedbackResponse(BaseModel):
    """Ответ с фидбеком."""

    id: UUID
    message_id: UUID
    type: FeedbackType
    comment: Optional[str] = None
    created_at: str
