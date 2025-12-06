# fmt: off
# isort: off
from uuid import UUID
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class HandlerResponse(BaseModel):
    """Ответ от обработчика нейросетевых запросов."""

    content: str = Field(..., description="Содержимое ответа")
    model: str = Field(default="gemini-1.5-flash", description="Модель, использованная для генерации")
    chat_id: UUID = Field(..., description="ID чата")
    attachments: Optional[List[Dict[str, str]]] = Field(default=None, description="Аттачменты")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Дополнительные метаданные")


class ChatRequest(BaseModel):
    """Запрос для чат-обработчика."""

    text: str = Field(..., description="Текст сообщения пользователя")
    chat_id: Optional[UUID] = Field(default=None, description="ID существующего чата")
    agent_id: str = Field(default="1", description="ID агента/системного промпта")
    model: str = Field(default="gemini-1.5-flash", description="Модель для генерации")
