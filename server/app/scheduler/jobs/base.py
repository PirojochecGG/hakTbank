# fmt: off
# isort: off
import time

from abc    import ABC
from typing import Any
from typing import Dict
from loguru import logger
from typing import Optional
from abc    import abstractmethod


class BaseJob(ABC):
    """Базовый класс для задач планировщика."""

    def __init__(self):
        self.start_time: Optional[float] = None
        self.metrics: Dict[str, Any] = {}

    @property
    @abstractmethod
    def job_id(self) -> str:
        """Уникальный идентификатор задачи."""
        pass

    @property
    @abstractmethod
    def trigger_type(self) -> str:
        """Тип триггера: cron, interval, date."""
        pass

    @property
    @abstractmethod
    def trigger_args(self) -> Dict[str, Any]:
        """Аргументы триггера."""
        pass

    @abstractmethod
    async def execute(self) -> None:
        """Основная логика выполнения задачи."""
        pass

    async def run(self) -> None:
        """Обёртка для безопасного выполнения задачи с метриками."""
        self.start_time = time.time()
        self.metrics = {"start_time": self.start_time}

        try:
            logger.info(f"Запуск задачи '{self.job_id}'")
            await self.execute()

            execution_time = time.time() - self.start_time
            self.metrics["execution_time"] = execution_time
            self.metrics["status"] = "success"

            logger.info(f"Задача '{self.job_id}' выполнена за {execution_time:.2f}с")

        except Exception as exc:
            execution_time = time.time() - self.start_time if self.start_time else 0
            self.metrics["execution_time"] = execution_time
            self.metrics["status"] = "error"
            self.metrics["error"] = str(exc)

            logger.error(
                f"Ошибка в задаче '{self.job_id}' (время выполнения: {execution_time:.2f}с): {exc}",
                exc_info=True,
            )
