# fmt: off
# isort: off
import json

from uuid import UUID
from datetime import datetime
from typing import Any, AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine

from app.settings import SETTINGS

from .models import *
from .enums  import *


engine = create_async_engine(
    SETTINGS.POSTGRES_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    max_overflow=10,
    pool_timeout=30,
    pool_size=20,
    echo=False,
)

async_session_factory = async_sessionmaker(
    engine, expire_on_commit=False
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency для получения сессии БД."""
    async with async_session_factory() as session:
        yield session


class JSONEncoder(json.JSONEncoder):
    """JSON энкодер с поддержкой UUID и datetime."""

    def default(self, o: Any) -> Any:
        if isinstance(o, UUID):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)


__all__ = [
    "get_session",
    "JSONEncoder",
    "async_session_factory",
    *models.__all__,
    *enums.__all__,
]
