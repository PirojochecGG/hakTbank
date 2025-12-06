from uuid import UUID
from loguru import logger
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from .manager import ChatManager
from .objects import *


class ChatService:
    """Фасад сервиса чатов."""

    def __init__(self, manager: Optional[ChatManager] = None):
        self._manager = manager or ChatManager()
        logger.info("💬 ChatService инициализирован")

    async def create_chat(self, db: AsyncSession, user_id: UUID, title: str) -> ChatInfo:
        """Создает новый чат."""
        return await self._manager.create_chat(db, user_id, title)

    async def get_chat(self, db: AsyncSession, chat_id: UUID, user_id: UUID) -> Optional[ChatInfo]:
        """Получает чат по ID."""
        return await self._manager.get_chat(db, chat_id, user_id)

    async def get_user_chats(self, db: AsyncSession, user_id: UUID, limit: int = 50) -> list[ChatInfo]:
        """Получает чаты пользователя."""
        return await self._manager.get_user_chats(db, user_id, limit)

    async def update_chat_title(self, db: AsyncSession, chat_id: UUID, user_id: UUID, title: str) -> Optional[ChatInfo]:
        """Обновляет название чата."""
        return await self._manager.update_chat_title(db, chat_id, user_id, title)

    async def get_chat_with_messages(self, db: AsyncSession, chat_id: UUID, user_id: UUID) -> Optional[ChatWithMessages]:
        """Получает чат со всеми сообщениями."""
        return await self._manager.get_chat_with_messages(db, chat_id, user_id)

    async def delete_chat(self, db: AsyncSession, chat_id: UUID, user_id: UUID) -> bool:
        """Удаляет чат."""
        return await self._manager.delete_chat(db, chat_id, user_id)

    async def add_message(self, db: AsyncSession, chat_id: UUID, message: CreateMessageRequest) -> MessageInfo:
        """Добавляет сообщение в чат."""
        return await self._manager.add_message(db, chat_id, message)
