FROM python:3.12-slim

# Установка uv и Redis
RUN apt-get update && apt-get install -y redis-server && rm -rf /var/lib/apt/lists/*
RUN pip install uv

WORKDIR /src

# Копируем файлы конфигурации uv
COPY pyproject.toml ./

# Устанавливаем зависимости через uv
RUN uv sync

COPY . /src

EXPOSE 8080

CMD ["sh", "-c", "redis-server --daemonize yes --maxmemory 1gb --maxmemory-policy allkeys-lru --save '' && sleep 2 && uv run alembic upgrade head && uv run python -m app"]
