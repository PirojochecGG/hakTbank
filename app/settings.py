# fmt: off
# isort: off
from os import environ

from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict


class Settings(BaseSettings):
    """Основные настройки приложения."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8",
        extra="ignore", case_sensitive=False
    )

    # === API ===
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8080

    PROXY_HTTP: str

    POSTGRES_URL: str

    REDIS_URL: str = "redis://localhost:6379"

    JWT_SECRET: str = "your-secret-key-change-in-production"

    YOOKASSA_SECRET_KEY: str
    YOOKASSA_SHOP_ID: str

    GEMINI_API_KEY: str
    NEBIUS_API_KEY: str
    OPENAI_API_KEY: str
    OPENAI_API_URL: str

    LOG_SERVICE_NAME: str = "hack-t-bank"
    LOG_LEVEL: str = "INFO"
    LOKI_PASSWORD: str
    LOKI_LOGIN: str
    LOKI_URL: str


SETTINGS = Settings()
