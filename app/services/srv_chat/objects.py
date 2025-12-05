from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

from app.storage.enums import MessageRole


class ChatInfo(BaseModel):
    """Информация о чате."""
    id: UUID
    title: str
    last_message_at: Optional[datetime]
    created_at: datetime
    message_count: int = 0


class MessageInfo(BaseModel):
    """Информация о сообщении."""
    id: UUID
    role: MessageRole
    content: str
    created_at: datetime


class CreateMessageRequest(BaseModel):
    """Запрос на создание сообщения."""
    role: MessageRole
    content: str


class ChatWithMessages(BaseModel):
    """Чат с сообщениями."""
    id: UUID
    title: str
    messages: list[MessageInfo]
    created_at: datetime
