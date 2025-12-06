from uuid import UUID
from fastapi import APIRouter, HTTPException, Query

from app.api.deps import CurrentUser, DBSession
from .manager import ChatsRouterManager
from .schemas import *


router = APIRouter(prefix="/chats", tags=["Chats"])


@router.get("", response_model=PaginatedChatsResponse)
async def get_chats(
    user: CurrentUser,
    db: DBSession,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Items per page"),
    sort: SortOrder = Query(SortOrder.NEW, description="Sort order")
) -> PaginatedChatsResponse:
    """Получает список чатов для текущего пользователя с пагинацией и сортировкой."""
    return await ChatsRouterManager.get_user_chats(user, db, page, size, sort)


@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat_by_id(user: CurrentUser, db: DBSession, chat_id: UUID) -> ChatResponse:
    """Получает чат по ID."""
    if not (chat := await ChatsRouterManager.get_chat_by_id(user, db, chat_id)):
        raise HTTPException(404, "Чат не найден")
    return chat


@router.get("/{chat_id}/messages", response_model=ChatWithMessagesResponse)
async def get_chat_messages(user: CurrentUser, db: DBSession, chat_id: UUID) -> ChatWithMessagesResponse:
    """Получает сообщения чата."""
    if not (chat := await ChatsRouterManager.get_chat_messages(user, db, chat_id)):
        raise HTTPException(404, "Чат не найден")
    return chat


@router.post("/new", response_model=ChatResponse, status_code=201)
async def create_chat(user: CurrentUser, db: DBSession, request: CreateChatRequest) -> ChatResponse:
    """Создает новый чат."""
    return await ChatsRouterManager.create_chat(user, db, request)


@router.delete("/{chat_id}", status_code=204)
async def delete_chat(user: CurrentUser, db: DBSession, chat_id: UUID) -> None:
    """Удаляет чат."""
    if not await ChatsRouterManager.delete_chat(user, db, chat_id):
        raise HTTPException(404, f"Чат {chat_id} не найден")
