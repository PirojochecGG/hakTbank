# fmt: off
# isort: off
import asyncio
import pkgutil
import importlib

from typing import Dict
from pytz import timezone
from loguru import logger
from datetime import datetime
from .jobs.base import BaseJob

from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.executors.asyncio import AsyncIOExecutor
from sqlalchemy import create_engine, text
import app.scheduler.jobs as jobs_package
from app.settings import SETTINGS


# Создаем отдельный синхронный engine для планировщика
sync_engine = create_engine(
    SETTINGS.POSTGRES_URL.replace("postgresql+asyncpg://", "postgresql://"),
    pool_pre_ping=True, pool_recycle=3600,
)

scheduler = AsyncIOScheduler(
    executors={"default": AsyncIOExecutor()},
    jobstores={
        "default": SQLAlchemyJobStore(
            engine=sync_engine,
            tablename="jobs"
        )
    },
    job_defaults={
        "coalesce": True,
        "max_instances": 1,
        "misfire_grace_time": None,
    },
    timezone=timezone("Europe/Moscow"),
)


async def _load_job_modules() -> Dict[str, BaseJob]:
    """Загружает все модули задач и возвращает словарь экземпляров."""
    jobs = {}

    for _, name, _ in pkgutil.iter_modules(jobs_package.__path__):
        if name == "base":
            continue
        try:
            mod = importlib.import_module(f"{jobs_package.__name__}.{name}")
            cls = getattr(mod, "Job", None)

            if cls and issubclass(cls, BaseJob):
                job = cls(); jobs[job.job_id] = job
            else:
                logger.warning(f"Пропуск модуля '{name}': отсутствует Job класс наследник BaseJob")
        except Exception as e:
            logger.opt(exception=True).error(f"Не удалось загрузить задачу из модуля '{name}': {e}")
    return jobs


async def _execute_missed_job(job_id: str, job: BaseJob) -> None:
    """Выполняет пропущенную задачу."""
    try:
        await job.run()
    except Exception as e:
        logger.opt(exception=True).error(f"Ошибка выполнения пропущенной задачи: '{job_id}': {e}")


async def _process_job(job_id: str, job: BaseJob, existing: set, engine, now: datetime) -> None:
    """Обрабатывает одну задачу: выполняет если пропущена и регистрирует."""
    if job_id in existing:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT next_run_time FROM jobs WHERE id = :id"), {"id": job_id}).fetchone()
            if result and result[0] and datetime.fromtimestamp(result[0], tz=scheduler.timezone) < now:
                await _execute_missed_job(job_id, job)

    try:
        scheduler.add_job(
            job.run, trigger=job.trigger_type,
            id=job.job_id, replace_existing=True, coalesce=True,
            misfire_grace_time=None, **job.trigger_args,
        )
        logger.info(f"Задача '{job_id}' добавлена (trigger: {job.trigger_type})")
    except Exception as e:
        logger.opt(exception=True).error(f"Ошибка при добавлении задачи '{job_id}': {e}")


async def start_scheduler() -> None:
    """Запускает планировщик."""
    logger.info("Загрузка/проверка и регистрация задач планировщика...")
    if not scheduler.running:
        try:
            scheduler.start()
            logger.info("Планировщик задач запущен")
        except Exception as e:
            logger.opt(exception=True).error(f"Ошибка при запуске планировщика: {e}")
            return

    jobs = await _load_job_modules()
    existing = {job.id for job in scheduler.get_jobs()}
    now = datetime.now(scheduler.timezone)

    tasks = [
        _process_job(job_id, job, existing, sync_engine, now)
        for job_id, job in jobs.items()
    ]
    await asyncio.gather(*tasks, return_exceptions=True)


async def shutdown_scheduler() -> None:
    """Останавливает планировщик."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Планировщик задач остановлен")


__all__ = [
    "start_scheduler",
    "shutdown_scheduler",
]
