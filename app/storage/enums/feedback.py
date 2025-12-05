from enum import Enum


class FeedbackType(str, Enum):
    """Типы фидбека по покупке."""

    STILL_WANT = "still_want"      # Все еще хочу
    NOT_NEEDED = "not_needed"      # Больше не нужно
    COMPLETED = "completed"        # Купил