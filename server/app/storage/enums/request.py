from enum import Enum


class RequestStatus(str, Enum):
    """Статусы запросов в очереди."""

    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class RequestPriority(str, Enum):
    """Приоритеты запросов."""

    GENERAL = "GENERAL"
    PREMIUM = "PREMIUM"


class RequestType(str, Enum):
    """Типы запросов к нейросетевым моделям."""

    TEXT = "text_completion"
