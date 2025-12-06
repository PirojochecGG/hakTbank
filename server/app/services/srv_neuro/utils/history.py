# fmt: off
# isort: off
from uuid import UUID
from typing import List, Dict
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.storage import MessageRole, Message, Chat, User
from ..config import BASE_SYSTEM_PROMPT


class HistoryManager:
    """Менеджер истории сообщений чата."""

    @staticmethod
    async def get_system_prompt(db: AsyncSession, chat_id: UUID, user_id: UUID) -> str:
        """Получает системный промпт с контекстом пользователя и покупок."""
        from app.services import get_service

        if not (user := await db.get(User, user_id)):
            return BASE_SYSTEM_PROMPT

        purchases = await get_service.purchase.get_chat_purchases(db, chat_id, user_id)
        
        # Формируем профиль
        profile = f"""\n\n=== ПРОФИЛЬ ===
ЗП: {user.monthly_salary:,}₽/мес | Откладывает: {user.monthly_savings:,}₽/мес | Накопления: {user.current_savings:,}₽
Запрещено: {', '.join(user.blacklist) or 'нет'}"""
        
        # Добавляем диапазоны охлаждения
        if user.cooling_ranges:
            ranges = '\n'.join(f"{r['min_amount']:,}-{r['max_amount']:,}₽ → {r['days']}д" for r in user.cooling_ranges)
            profile += f"\nОхлаждение:\n{ranges}"
        else:
            profile += "\nОхлаждение: не настроено"
        
        # Добавляем покупки
        if purchases:
            items = []
            for p in purchases:
                emoji = {"pending": "⏳", "purchased": "✅", "cancelled": "❌"}.get(p.status, "")
                date = p.available_date.strftime('%d.%m.%Y') if p.available_date else 'сейчас'
                items.append(f"{emoji} {p.name} | {p.price:,}₽ | {p.category} | {p.cooling_days}д | {date}")
            purchases_text = f"\n\n=== ПОКУПКИ ({len(purchases)}) ===\n" + '\n'.join(items)
        else:
            purchases_text = "\n\n=== ПОКУПКИ ===\nПусто"
        
        return BASE_SYSTEM_PROMPT + profile + purchases_text


    @staticmethod
    def _move_assistant_attachments(msg, formatted_messages) -> None:
        """Переносит аттачменты ассистента в предыдущее сообщение пользователя."""
        if not (msg.role == MessageRole.ASSISTANT and msg.attachments and
                formatted_messages and formatted_messages[-1]["role"] == "user"):
            return

        images = [att for att in msg.attachments if att.get("type") == "image"]
        audios = [att for att in msg.attachments if att.get("type") == "audio"]

        if not images and not audios:
            return

        user_msg = formatted_messages[-1]
        if isinstance(user_msg["content"], str):
            user_msg["content"] = [{"type": "text", "text": user_msg["content"]}]

        user_msg["content"] += [{"type": "image_url", "image_url": {"url": img["url"]}} for img in images]
        user_msg["content"] += [{"type": "audio_url", "audio_url": {"url": audio["url"]}} for audio in audios]


    @staticmethod
    def _format_message_content(msg) -> Dict:
        """Форматирует сообщение для нейросети."""
        if msg.role == MessageRole.ASSISTANT:
            return {"role": msg.role, "content": msg.content}

        attachments = msg.attachments or []
        images = [att for att in attachments  if att.get("type") == "image"]
        files  = [att  for att in attachments if att.get("type") == "file"]
        videos = [att for att in attachments  if att.get("type") == "video"]
        audios = [att for att in attachments  if att.get("type") == "audio"]

        if not images and not files and not videos and not audios:
            return {"role": msg.role, "content": msg.content}

        content = [{"type": "text", "text": msg.content}]
        content += [{"type": "image_url", "image_url": {"url": img["url"]}} for img in images]
        content += [{"type": "file_url",  "file_url":  {"url": file["url"]}} for file in files]
        content += [{"type": "video_url", "video_url": {"url": video["url"]}} for video in videos]
        content += [{"type": "audio_url", "audio_url": {"url": audio["url"]}} for audio in audios]

        return {"role": msg.role, "content": content}


    @staticmethod
    async def get_chat_history(db: AsyncSession, chat_id: UUID, user_id: UUID, limit: int = 10) -> List[Dict]:
        """Получает последние сообщения чата в формате для нейросети."""
        messages = (await db.execute(
            select(Message).where(Message.chat_id == chat_id)
            .order_by(desc(Message.created_at)).limit(limit)
        )).scalars().all()

        formatted_messages = []
        for msg in reversed(messages):
            HistoryManager._move_assistant_attachments(msg, formatted_messages)
            formatted_messages.append(HistoryManager._format_message_content(msg))

        if system_prompt := await HistoryManager.get_system_prompt(db, chat_id, user_id):
            formatted_messages.insert(0, {"role": "system", "content": system_prompt})
        return formatted_messages


    @staticmethod
    async def add_user_message(db: AsyncSession, chat_id: UUID, content: str, model: str, attachments: list = None) -> None:
        """Добавляет сообщение пользователя в чат."""
        db.add(
            msg := Message(
                chat_id=chat_id,
                content=content,
                role=MessageRole.USER,
                attachments=attachments,
                status="completed",
                model=model
            )
        )
        if chat := await db.get(Chat, chat_id):
            chat.last_message_at = msg.created_at
        await db.commit()


    @staticmethod
    async def add_assistant_message(db: AsyncSession, chat_id: UUID, content: str, model: str) -> Message:
        """Добавляет ответ ассистента в чат."""
        db.add(
            msg := Message(
                chat_id=chat_id,
                content=content,
                role=MessageRole.ASSISTANT,
                status="generating" if not content else "completed",
                model=model
            )
        )
        if chat := await db.get(Chat, chat_id):
            chat.last_message_at = msg.created_at
        await db.commit()
        await db.refresh(msg)
        return msg


    @staticmethod
    async def update_assistant_message_with_tools(db, msg_id: UUID, content: str, msgs: list, attachments: list = None) -> None:
        """Обновляет сообщение с автоматическим извлечением метаданных тулкалов."""
        if message := await db.get(Message, msg_id):
            message.content, message.status = content, "completed"
            if attachments: message.attachments = attachments

            # Извлекаем метаданные всех тулкалов
            if (all_tools := [tool for msg in msgs if (tools := msg.get("tool_metadata"))
                for tool in tools
            ]):
                message.tool_ids = [tool["tool_name"] for tool in all_tools]
                message.meta_data = {"tools": all_tools}
            await db.commit()
