from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

from app.storage.enums import MessageRole


class SortOrder(str, Enum):
    """Порядок сортировки чатов."""
    NEW = "new"
    OLD = "old"
    CREATED_NEW = "created_new"
    CREATED_OLD = "created_old"


class LastMessageResponse(BaseModel):
    """Последнее сообщение в чате."""
    id: UUID
    role: MessageRole
    content: str
    created_at: datetime


class ChatResponse(BaseModel):
    """Ответ с информацией о чате."""
    id: UUID
    title: str
    last_message_at: Optional[datetime]
    created_at: datetime
    last_message: Optional[LastMessageResponse] = None


class PaginatedChatsResponse(BaseModel):
    """Пагинированный список чатов."""
    items: list[ChatResponse]
    total: int
    page: int
    size: int
    pages: int


class CreateChatRequest(BaseModel):
    """Запрос на создание чата."""
    title: str = Field(default="Новый чат", max_length=500)


class MessageResponse(BaseModel):
    """Ответ с сообщением."""
    id: UUID
    role: MessageRole
    content: str
    created_at: datetime


class ChatWithMessagesResponse(BaseModel):
    """Чат с сообщениями."""
    id: UUID
    title: str
    messages: list[MessageResponse]
    created_at: datetime
