# fmt: off
# isort: off
import json

from uuid import UUID
from loguru import logger
import redis.asyncio as redis
from typing import Optional, AsyncGenerator, Union

from app.settings import SETTINGS


class RedisManager:
    """Менеджер для работы с Redis."""

    def __init__(self):
        self._client: Optional[redis.Redis] = None

    @property
    async def client(self) -> redis.Redis:
        """Клиент Redis (ленивая инициализация)."""
        if not self._client:
            self._client = redis.from_url(SETTINGS.REDIS_URL)
        return self._client


    async def publish(self, request_id: UUID, data: Union[str, dict]) -> None:
        """Публикует данные в канал."""
        payload = json.dumps(data, ensure_ascii=False) if isinstance(data, dict) else str(data)
        await (await self.client).publish(f"stream:{request_id}", payload)


    async def publish_chunk(self, request_id: UUID, chunk: str) -> None:
        await self.publish(request_id, json.dumps(chunk, ensure_ascii=False))


    async def publish_message_start(self, request_id: UUID, message_data: dict) -> None:
        await self.publish(request_id, message_data)


    async def publish_done(self, request_id: UUID, message_data: dict) -> None:
        await self.publish(request_id, message_data)
        await (await self.client).expire(f"stream:{request_id}", 120)


    async def subscribe_to_stream(self, request_id: UUID) -> AsyncGenerator[str, None]:
        """Подписывается на стрим."""
        pubsub = (await self.client).pubsub()
        try:
            await pubsub.subscribe(f"stream:{request_id}")
            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                data = message["data"].decode("utf-8") if isinstance(message["data"], bytes) else str(message["data"])
                yield f"data: {data}\n\n"
                try:
                    if json.loads(data).get("status") == "completed":
                        break
                except (json.JSONDecodeError, TypeError, AttributeError):
                    pass

        except Exception as e:
            logger.error(f"Redis стрим ошибка: {e}")
            yield f"data: {{\"error\": \"Stream error\"}}\n\n"

        finally:
            await pubsub.unsubscribe(f"stream:{request_id}")
            await pubsub.close()


    async def get_result(self, request_id: UUID) -> Optional[dict]:
        """Получает результат."""
        if result := await (await self.client).get(f"result:{request_id}"):
            return json.loads(result.decode("utf-8"))
        return None


    async def set_result(self, request_id: UUID, result: dict) -> None:
        """Сохраняет результат."""
        await (await self.client).setex(f"result:{request_id}", 120, json.dumps(result, ensure_ascii=False))


    async def set_error(self, request_id: UUID, message: str, status_code: int, is_stream: bool) -> None:
        """Отправляет ошибку клиенту."""
        error_data = {"error": True, "message": message, "status_code": status_code}
        await (self.publish if is_stream else self.set_result)(request_id, error_data)


    async def close(self) -> None:
        """Закрывает соединение."""
        if self._client:
            await self._client.close()
            self._client = None
