from uuid import UUID
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.storage.models import Chat, Message
from .objects import *


class ChatManager:
    """Менеджер для работы с чатами."""

    @staticmethod
    async def create_chat(db: AsyncSession, user_id: UUID, title: str) -> ChatInfo:
        """Создает новый чат."""
        db.add(chat := Chat(user_id=user_id, title=title))
        await db.commit()

        return ChatInfo(
            id=chat.id,
            title=chat.title,
            last_message_at=chat.last_message_at,
            created_at=chat.created_at,
            message_count=0,
        )

    @staticmethod
    async def get_chat(
        db: AsyncSession, chat_id: UUID, user_id: UUID
    ) -> Optional[ChatInfo]:
        """Получает чат по ID."""
        if not (
            chat := await db.scalar(
                select(Chat).where(Chat.id == chat_id, Chat.user_id == user_id)
            )
        ):
            return None

        message_count = (
            await db.scalar(
                select(func.count(Message.id)).where(Message.chat_id == chat_id)
            )
            or 0
        )

        return ChatInfo(
            id=chat.id,
            title=chat.title,
            last_message_at=chat.last_message_at,
            created_at=chat.created_at,
            message_count=message_count,
        )

    @staticmethod
    async def get_user_chats(
        db: AsyncSession, user_id: UUID, limit: int = 50
    ) -> list[ChatInfo]:
        """Получает чаты пользователя."""
        chats = await db.scalars(
            select(Chat)
            .where(Chat.user_id == user_id)
            .order_by(desc(Chat.last_message_at), desc(Chat.created_at))
            .limit(limit)
        )

        result = []
        for chat in chats:
            message_count = (
                await db.scalar(
                    select(func.count(Message.id)).where(Message.chat_id == chat.id)
                )
                or 0
            )

            result.append(
                ChatInfo(
                    id=chat.id,
                    title=chat.title,
                    last_message_at=chat.last_message_at,
                    created_at=chat.created_at,
                    message_count=message_count,
                )
            )

        return result

    @staticmethod
    async def update_chat_title(
        db: AsyncSession, chat_id: UUID, user_id: UUID, title: str
    ) -> Optional[ChatInfo]:
        """Обновляет название чата."""
        if not (
            chat := await db.scalar(
                select(Chat).where(Chat.id == chat_id, Chat.user_id == user_id)
            )
        ):
            return None

        chat.title = title
        await db.flush()

        message_count = (
            await db.scalar(
                select(func.count(Message.id)).where(Message.chat_id == chat_id)
            )
            or 0
        )

        return ChatInfo(
            id=chat.id,
            title=chat.title,
            last_message_at=chat.last_message_at,
            created_at=chat.created_at,
            message_count=message_count,
        )

    @staticmethod
    async def get_chat_with_messages(
        db: AsyncSession, chat_id: UUID, user_id: UUID
    ) -> Optional[ChatWithMessages]:
        """Получает чат со всеми сообщениями."""
        if not (
            chat := await db.scalar(
                select(Chat)
                .options(selectinload(Chat.messages))
                .where(Chat.id == chat_id, Chat.user_id == user_id)
            )
        ):
            return None

        messages = [
            MessageInfo(
                id=msg.id, role=msg.role, content=msg.content, created_at=msg.created_at
            )
            for msg in sorted(chat.messages, key=lambda x: x.created_at)
        ]

        return ChatWithMessages(
            id=chat.id, title=chat.title, messages=messages, created_at=chat.created_at
        )

    @staticmethod
    async def add_message(
        db: AsyncSession, chat_id: UUID, message_request: CreateMessageRequest
    ) -> MessageInfo:
        """Добавляет сообщение в чат."""
        db.add(
            message := Message(
                chat_id=chat_id,
                role=message_request.role,
                content=message_request.content,
            )
        )

        if chat := await db.scalar(select(Chat).where(Chat.id == chat_id)):
            chat.last_message_at = datetime.now(timezone.utc)

        await db.flush()

        return MessageInfo(
            id=message.id,
            role=message.role,
            content=message.content,
            created_at=message.created_at,
        )

    @staticmethod
    async def delete_chat(db: AsyncSession, chat_id: UUID, user_id: UUID) -> bool:
        """Удаляет чат."""
        if not (
            chat := await db.scalar(
                select(Chat).where(Chat.id == chat_id, Chat.user_id == user_id)
            )
        ):
            return False

        await db.delete(chat)
        return True
