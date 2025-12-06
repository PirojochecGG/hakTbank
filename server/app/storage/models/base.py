# fmt: off
# isort: off
from uuid import UUID, uuid4
from datetime import datetime
from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# TODO: Переропределить расположение колонок
# чтобы id было первым а временные поля последними

class Base(DeclarativeBase):
    """Базовый класс для всех моделей."""

    __abstract__ = True

    id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # НЕ работает :(
    # def __init_subclass__(cls, **kwargs):
    #     super().__init_subclass__(**kwargs)
    #     # Переопределяем порядок колонок
    #     if hasattr(cls, '__annotations__'):
    #         timestamp_fields = ['created_at', 'updated_at']
    #         other_fields = [k for k in cls.__annotations__.keys() if k not in timestamp_fields and k != 'id']
    #         cls.__annotations__ = {k: cls.__annotations__[k] for k in ['id'] + other_fields + timestamp_fields if k in cls.__annotations__}
