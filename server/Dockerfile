FROM python:3.12-slim

# Установка необходимых зависимостей
RUN apt-get update && apt-get install -y \
    build-essential \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Установка uv
RUN pip install uv

WORKDIR /src

# Копируем файлы конфигурации
COPY pyproject.toml pyproject.toml ./

# Устанавливаем зависимости через uv
RUN uv sync --no-dev

# Копируем весь проект
COPY . /src

EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Запуск миграций и приложения
CMD ["sh", "-c", "uv run alembic upgrade head && uv run python -m app"]
