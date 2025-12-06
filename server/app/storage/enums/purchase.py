from enum import Enum


class PurchaseStatus(str, Enum):
    """Статусы покупки."""
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
