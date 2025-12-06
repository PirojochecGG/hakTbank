# fmt: off
# isort: off
from typing import Dict
from pydantic import BaseModel


class QueueStats(BaseModel):
    """Статистика очереди."""
    pending: Dict[str, int]
    processing: int
    completed: int
    failed: int