# fmt: off
# isort: off
import os
import sys
import asyncio
import tomllib

from sqlalchemy import pool
from alembic import context
from dotenv import load_dotenv
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

load_dotenv()
sys.path.append(".")

from app.storage import Base
target_metadata = Base.metadata

# Загружаем конфигурацию
config = context.config
with open("pyproject.toml", "rb") as f:
    alembic_config = tomllib.load(f).get("tool", {}).get("alembic", {})

for key, value in alembic_config.items():
    if key != "sqlalchemy_url":
        config.set_main_option(key, str(value))

postgres_url = os.getenv("POSTGRES_URL")
if not postgres_url:
    raise ValueError("POSTGRES_URL environment variable not set")
config.set_main_option("sqlalchemy.url", postgres_url)


def run_migrations(connection: Connection | None = None) -> None:
    """Запуск миграций для online/offline режимов"""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        literal_binds=connection is None,
        compare_type=connection is not None,
        render_as_batch=connection is not None,
        dialect_opts={"paramstyle": "named"} if connection is None else None,
        url=config.get_main_option("sqlalchemy.url") if connection is None else None,
    )

    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations()
else:
    if not (db_config := config.get_section(config.config_ini_section)):
        raise ValueError(f"Alembic config section '{config.config_ini_section}' not found")

    engine = async_engine_from_config(
        db_config, prefix="sqlalchemy.", poolclass=pool.NullPool
    )

    async def run_async() -> None:
        async with engine.connect() as conn:
            await conn.run_sync(run_migrations)
    asyncio.run(run_async())
