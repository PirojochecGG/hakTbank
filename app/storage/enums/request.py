from enum import Enum


class RequestStatus(str, Enum):
    """Статусы запросов."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
