from enum import Enum


class FeedbackType(str, Enum):
    """Типы фидбека для сообщений."""

    LIKE = "like"
    DISLIKE = "dislike"
