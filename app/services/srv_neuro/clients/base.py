# fmt: off
# isort: off
import httpx
import openai

from loguru import logger
from abc import ABC, abstractmethod
from contextlib import asynccontextmanager
from typing import Dict, List, AsyncGenerator, Optional

from app.settings import SETTINGS


class BaseClient(ABC):
    """Базовый клиент нейросетевых API."""
    _instances: Dict[str, "BaseClient"] = {}

    def __new__(cls):
        if cls.__name__ not in cls._instances:
            cls._instances[cls.__name__] = super().__new__(cls)
        return cls._instances[cls.__name__]


    def __init__(self, base_url: str, api_key: str, proxy: bool = False) -> None:
        """Инициализация клиента."""
        if hasattr(self, "_initialized") and self._initialized:
            return

        self._client = openai.AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
            timeout=SETTINGS.MAX_TIMEOUT,
            http_client=httpx.AsyncClient(
                proxy=SETTINGS.PROXY_HTTP if proxy else None,
                trust_env=False
            ),
        )
        self._initialized = True


    @asynccontextmanager
    async def handle_api_errors(self):
        """Контекст менеджер для обработки ошибок API."""
        try:
            yield
        except openai.APITimeoutError as e:
            logger.error(f"API timeout: {e}")
            raise
        except openai.RateLimitError as e:
            logger.error(f"Rate limit exceeded: {e}")
            raise
        except openai.APIConnectionError as e:
            logger.error(f"API connection error: {e}")
            raise
        except openai.AuthenticationError as e:
            logger.error(f"Authentication error: {e}")
            raise
        except openai.BadRequestError as e:
            logger.error(f"Bad request: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise


    def update_api_key(self, new_api_key: str) -> None:
        """Обновляет API ключ в существующем клиенте."""
        self._client.api_key = new_api_key


    def get_total_tokens(self, response) -> int:
        """Получает общее количество токенов из ответа OpenAI SDK."""
        if hasattr(response, 'usage') and response.usage:
            return response.usage.total_tokens
        return 0


    @abstractmethod
    async def chat_completion(
        self, messages: List[Dict], model: str, **kwargs
    ) -> Dict:
        """Создает завершение чата."""
        pass


    @abstractmethod
    async def chat_completion_stream(
        self, messages: List[Dict], model: str, **kwargs
    ) -> AsyncGenerator[Dict, None]:
        """Создает стриминговое завершение чата."""
        pass


    async def close(self) -> None:
        """Закрывает HTTP клиент."""
        if hasattr(self, '_client') and self._client.http_client:
            await self._client.http_client.aclose()
