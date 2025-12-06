from uuid import UUID
from loguru import logger
from typing import Optional
from sqlalchemy import select, func, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.storage.models import Chat, Message, User
from app.services import get_service
from .schemas import *


class ChatsRouterManager:
    """Менеджер роутера чатов."""

    @staticmethod
    async def get_user_chats(
        user: User, db: AsyncSession, page: int, size: int, sort: SortOrder
    ) -> PaginatedChatsResponse:
        """Получает пагинированный список чатов пользователя."""
        order_by = {
            SortOrder.NEW: desc(Chat.last_message_at),
            SortOrder.OLD: asc(Chat.last_message_at),
            SortOrder.CREATED_NEW: desc(Chat.created_at),
            SortOrder.CREATED_OLD: asc(Chat.created_at)
        }[sort]

        total = await db.scalar(
            select(func.count(Chat.id)).where(Chat.user_id == user.id)
        ) or 0

        chats = await db.scalars(
            select(Chat)
            .where(Chat.user_id == user.id)
            .order_by(order_by, desc(Chat.created_at))
            .offset((page - 1) * size)
            .limit(size)
        )

        chat_responses = []
        for chat in chats:
            last_message = None
            if last_msg := await db.scalar(
                select(Message).where(Message.chat_id == chat.id)
                .order_by(desc(Message.created_at)).limit(1)
            ):
                last_message = LastMessageResponse(
                    id=last_msg.id,
                    role=last_msg.role,
                    content=last_msg.content,
                    created_at=last_msg.created_at
                )
            
            chat_responses.append(ChatResponse(
                id=chat.id,
                title=chat.title,
                last_message_at=chat.last_message_at,
                created_at=chat.created_at,
                last_message=last_message
            ))

        return PaginatedChatsResponse(
            items=chat_responses,
            total=total,
            page=page,
            size=size,
            pages=(total + size - 1) // size
        )

    @staticmethod
    async def get_chat_by_id(user: User, db: AsyncSession, chat_id: UUID) -> Optional[ChatResponse]:
        """Получает чат по ID."""
        if not (chat_info := await get_service.chat.get_chat(db, chat_id, user.id)):
            return None

        last_message = None
        if last_msg := await db.scalar(
            select(Message).where(Message.chat_id == chat_id)
            .order_by(desc(Message.created_at)).limit(1)
        ):
            last_message = LastMessageResponse(
                id=last_msg.id,
                role=last_msg.role,
                content=last_msg.content,
                created_at=last_msg.created_at
            )

        return ChatResponse(
            id=chat_info.id,
            title=chat_info.title,
            last_message_at=chat_info.last_message_at,
            created_at=chat_info.created_at,
            last_message=last_message
        )

    @staticmethod
    async def get_chat_messages(user: User, db: AsyncSession, chat_id: UUID) -> Optional[ChatWithMessagesResponse]:
        """Получает сообщения чата."""
        if not (chat_with_messages := await get_service.chat.get_chat_with_messages(db, chat_id, user.id)):
            return None

        messages = [
            MessageResponse(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                created_at=msg.created_at
            )
            for msg in chat_with_messages.messages
        ]

        return ChatWithMessagesResponse(
            id=chat_with_messages.id,
            title=chat_with_messages.title,
            messages=messages,
            created_at=chat_with_messages.created_at
        )

    @staticmethod
    async def create_chat(user: User, db: AsyncSession, request: CreateChatRequest) -> ChatResponse:
        """Создает новый чат."""
        chat_info = await get_service.chat.create_chat(db, user.id, request.title)
        logger.info(f"💬 Create new chat: {chat_info.id} for user: {user.id}")

        await db.commit()
        return ChatResponse(
            id=chat_info.id,
            title=chat_info.title,
            last_message_at=chat_info.last_message_at,
            created_at=chat_info.created_at
        )

    @staticmethod
    async def delete_chat(user: User, db: AsyncSession, chat_id: UUID) -> bool:
        """Удаляет чат."""
        if result := await get_service.chat.delete_chat(db, chat_id, user.id):
            logger.info(f"💬 Delete existing chat: {chat_id} for user: {user.id}")
            await db.commit()
        return result
