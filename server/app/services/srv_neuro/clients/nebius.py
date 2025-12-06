# fmt: off
# isort: off
from typing import Dict, List, AsyncGenerator

from app.settings import SETTINGS
from .base import BaseClient


class NebiusClient(BaseClient):
    """Клиент для Nebius API."""

    def __init__(self):
        """Инициализация клиента."""
        super().__init__(
            base_url="https://api.tokenfactory.nebius.com/v1/",
            api_key=SETTINGS.NEBIUS_API_KEY,
            proxy=True
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


    async def generate_image(
        self,  prompt: str,  model: str = "black-forest-labs/flux-schnell",
        width: int = 1024, height: int = 1024,
        **kwargs
    ) -> Dict:
        """Генерирует изображение по промпту."""
        async with self.handle_api_errors():
            return await self._client.images.generate(
                model=model,
                prompt=prompt,
                response_format="b64_json",
                extra_body={
                    "num_inference_steps": 4,
                    "response_extension": "png",
                    "width": width,
                    "height": height,
                    "seed": -1,
                    **kwargs
                }
            )
