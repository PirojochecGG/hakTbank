from enum import Enum


class MessageRole(str, Enum):
    """Роли сообщений в чате."""

    ASSISTANT = "assistant"
    SYSTEM = "system"
    USER = "user"
    TOOL = "tool"
