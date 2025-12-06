# fmt: off
# isort: off
from typing import Any, Dict
from loguru import logger

from app.storage import get_session, Request
from .base import BaseJob


class Job(BaseJob):
    """Очистка старых запросов в 03:00."""

    @property
    def job_id(self) -> str:
        return "clean_db_job"

    @property
    def trigger_type(self) -> str:
        return "cron"

    @property
    def trigger_args(self) -> Dict[str, Any]:
        return {"hour": 3, "minute": 0}

    async def execute(self) -> None:
        """Удаляет запросы и статистику старше 7 дней."""
        async for db in get_session():
            del_req = await Request.cleanup_old_requests(db)
            logger.info(f"Удалено {del_req} старых запросов и {del_stat} старых записей статистики")
