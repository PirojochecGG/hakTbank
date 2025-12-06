# fmt: off
# isort: off
import time
import httpx
import base64
import asyncio

from google.genai import types, Client
from typing import Dict, List, AsyncGenerator, Any

from ..utils.keys import APIKeyManager
from app.settings import SETTINGS
from .base import BaseClient


class GeminiClient(BaseClient):
    def __init__(self):
        if hasattr(self, "_initialized") and self._initialized:
            return

        self.limits = httpx.Limits(
            max_keepalive_connections=10,
            keepalive_expiry=360, max_connections=20
        )
        self._initialized = True

    def _create_client(self, api_key: str) -> Client:
        """Создает новый изолированный клиент для конкретного ключа"""
        return Client(
            api_key=api_key,
            http_options=types.HttpOptions(
                client_args={"transport": httpx.HTTPTransport(
                    proxy=SETTINGS.PROXY_HTTP, retries=3, limits=self.limits,
                    verify=False
                )},
                async_client_args={"transport": httpx.AsyncHTTPTransport(
                    proxy=SETTINGS.PROXY_HTTP, retries=3, limits=self.limits,
                    verify=False
                )},
                timeout=30000
            )
        )


    def _build_tools(self, **kwargs) -> List[Dict]:
        """Создает список инструментов."""
        return [
            {tool_name: {}} for tool_name in [
                "google_search",
                "url_context",
                "google_maps",
                "code_execution"
            ]
            if kwargs.get(tool_name)
        ]


    def _build_tool_config(self, **kwargs) -> types.ToolConfig:
        """Создает конфигурацию инструментов."""
        lat, lng = kwargs.get("latitude"), kwargs.get("longitude")
        if lat and lng:
            return types.ToolConfig(
                retrieval_config=types.RetrievalConfig(
                    lat_lng=types.LatLng(latitude=lat, longitude=lng)
                )
            )
        return None


    def _get_config(self, **kwargs) -> types.GenerateContentConfig:
        """Получаем конфиг для генерации ответа."""
        return types.GenerateContentConfig(
            tools=self._build_tools(**kwargs) or None,
            temperature=kwargs.get("temperature", 0.7),
            max_output_tokens=kwargs.get("max_tokens", 4096),
            tool_config=self._build_tool_config(**kwargs),
            top_p=kwargs.get("top_p", 0.9)
        )


    def _extract_sources(self, response: Any) -> List[Dict[str, str]]:
        """Извлекает источники из grounding_metadata."""
        try:
            candidate = response.candidates[0]
            chunks = candidate.grounding_metadata.grounding_chunks
            return [
                {"title": chunk.web.title, "url": chunk.web.uri}
                for chunk in chunks if chunk.web
            ]
        except (AttributeError, IndexError):
            return []


    async def _fetch_image(self, url: str) -> str:
        """Загружаем изображение по URL."""
        async with httpx.AsyncClient() as client:
            return base64.b64encode((await client.get(url)).content).decode()


    async def _load_images(self, urls: List[str]) -> Dict[str, str]:
        return dict(zip(urls, await asyncio.gather(*[self._fetch_image(url) for url in urls]))) if urls else {}


    def _extract_image_urls(self, messages: List[Dict]) -> List[str]:
        return [item["image_url"]["url"] for msg in messages if isinstance(msg["content"], list)
                for item in msg["content"] if item.get("type") == "image_url" and not item["image_url"]["url"].startswith("data:")]


    async def _convert(self, messages: List[Dict]) -> List[types.Content]:
        """Конвертирует OpenAI формат в Gemini формат."""
        return [self._convert_message(msg, await self._load_images(self._extract_image_urls(messages))) for msg in messages]


    def _convert_message(self, msg: Dict, image_data: Dict[str, str]) -> types.Content:
        """Форматируем сообщения из OpenAI в Gemini."""
        content = msg["content"]
        parts = (
            [types.Part(text=f"System: {content}" if msg["role"] == "system" else content)]
            if isinstance(content, str) else
            [
                types.Part(text=item["text"]) if item["type"] == "text" else
                types.Part(inline_data=types.Blob(
                    mime_type="image/jpeg",
                    data=item["image_url"]["url"].split(",")[1] if item["image_url"]["url"].startswith("data:")
                    else image_data[item["image_url"]["url"]]
                ))
                for item in content
            ]
        )
        return types.Content(
            role="model" if msg["role"] == "assistant" else "user",
            parts=parts
        )


    def _format(self, response: Any, model: str):
        """Форматируем ответ в OpenaiSDK формат."""
        try:
            content = response.candidates[0].content.parts[0].text or "No response from API Google"
        except (AttributeError, IndexError):
            content = "No response from API Google"

        return type('Response', (), {
            'choices': [type('Choice', (), {
                'message': type('Message', (), {
                    'content': content,
                    'role': 'assistant'
                })()
            })()],
            'usage': type('Usage', (), {
                'prompt_tokens': getattr(getattr(response, 'usage_metadata', None), 'prompt_token_count', 0) or 0,
                'completion_tokens': getattr(getattr(response, 'usage_metadata', None), 'candidates_token_count', 0) or 0,
                'total_tokens': (getattr(getattr(response, 'usage_metadata', None), 'prompt_token_count', 0) or 0) +
                               (getattr(getattr(response, 'usage_metadata', None), 'candidates_token_count', 0) or 0)
            })(),
            'sources': self._extract_sources(response),
            '_raw_response': response
        })()


    async def chat_completion(self, messages: List[Dict], model: str, **kwargs) -> Dict:
        """Создает завершение чата."""
        async def _request(api_key: str):
            async with self.handle_api_errors():
                client = self._create_client(api_key)
                response = await client.aio.models.generate_content(
                    model=model, contents=await self._convert(messages),
                    config=self._get_config(**kwargs)
                )
                return self._format(response, model)
        return await APIKeyManager.try_request(SETTINGS.GEMINI_API_KEY, _request)


    async def chat_completion_stream(self, messages: List[Dict], model: str, **kwargs) -> AsyncGenerator[Dict, None]:
        """Создает стриминговое завершение чата."""
        async def _request(api_key: str):
            async with self.handle_api_errors():
                client = self._create_client(api_key)
                return await client.aio.models.generate_content_stream(
                    model=model, contents=await self._convert(messages), config=self._get_config(**kwargs)
                )
        response = await APIKeyManager.try_request(SETTINGS.GEMINI_API_KEY, _request)
        async for chunk in response:
            if chunk.text:
                yield {
                    "text": chunk.text,
                    "model": model,
                    "chunk": {
                        "id": f"chatcmpl-{hash(chunk.text)}",
                        "object": "chat.completion.chunk",
                        "created": int(time.time()),
                        "model": model,
                        "choices": [
                            {
                                "index": 0,
                                "delta": {"content": chunk.text},
                                "finish_reason": None
                            }
                        ]
                    }
                }


    async def file_analysis(self, file_url: str, prompt: str, model: str) -> Dict:
        """Анализирует файл по URL (до 20MB)"""
        async with httpx.AsyncClient() as http_client:
            file_data = (await http_client.get(file_url)).content

        async def _request(api_key: str):
            async with self.handle_api_errors():
                client = self._create_client(api_key)
                response = await client.aio.models.generate_content(
                    model=model, contents=[
                        types.Part.from_bytes(
                            data=file_data,
                            mime_type="application/pdf"
                        ),
                        types.Part(text=prompt)
                    ]
                )
                return self._format(response, model)
        return await APIKeyManager.try_request(SETTINGS.GEMINI_API_KEY, _request)


    async def audio_analysis(self, audio_url: str, prompt: str, model: str) -> Dict:
        """Анализирует аудио по URL"""
        async with httpx.AsyncClient() as http_client:
            audio_data = (await http_client.get(audio_url)).content

        mime_type = {
            'wav': 'audio/wav', 'mp3': 'audio/mp3', 'aiff': 'audio/aiff',
            'aac': 'audio/aac', 'ogg': 'audio/ogg', 'flac': 'audio/flac'
        }.get(audio_url.lower().split('.')[-1], 'audio/mp3')

        async def _request(api_key: str):
            async with self.handle_api_errors():
                client = self._create_client(api_key)
                response = await client.aio.models.generate_content(
                    model=model, contents=[
                        prompt, types.Part.from_bytes(
                            data=audio_data,
                            mime_type=mime_type
                        )
                    ]
                )
                return self._format(response, model)
        return await APIKeyManager.try_request(SETTINGS.GEMINI_API_KEY, _request)
