# fmt: off
# isort: off
from typing import Dict, List, AsyncGenerator

from app.settings import SETTINGS
from .base import BaseClient


class OpenaiClient(BaseClient):
    """Клиент для OpenaiLLM API."""

    def __init__(self):
        """Инициализация клиента."""
        super().__init__(
            base_url=SETTINGS.OPENAI_API_URL,
            api_key=SETTINGS.OPENAI_API_KEY,
            proxy=False
        )


    async def chat_completion(self, messages: List[Dict], model: str, **kwargs) -> Dict:
        """Создает завершение чата."""
        async with self.handle_api_errors():
            return await self._client.chat.completions.create(
                messages=messages, model=model, stream=False, **kwargs
            )


    async def chat_completion_stream(
        self, messages: List[Dict], model: str, **kwargs
    ) -> AsyncGenerator[Dict, None]:
        """Создает стриминговое завершение чата."""
        async with self.handle_api_errors():
            stream = await self._client.chat.completions.create(
                messages=messages,
                model=model,
                stream=True,
                **kwargs
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield {
                        "text": chunk.choices[0].delta.content,
                        "model": model,
                        "chunk": chunk
                    }
