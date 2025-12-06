# fmt: off
# isort: off
from typing import Any
from typing import Dict
from loguru import logger

from .base import BaseJob
from app.storage import get_session, Subscription


class Job(BaseJob):
    """Сброс запросов юзеров в 00:00."""

    @property
    def job_id(self) -> str:
        return "reset_user_requests_job"

    @property
    def trigger_type(self) -> str:
        return "cron"

    @property
    def trigger_args(self) -> Dict[str, Any]:
        return {"hour": 0, "minute": 0}

    async def execute(self) -> None:
        """Сбрасывает статистику всех пользователей."""
        async for session in get_session():
            reset_count = await Subscription.reset_requests(session)
            logger.info(f"Сброшена статистика запросов для {reset_count} пользователей")