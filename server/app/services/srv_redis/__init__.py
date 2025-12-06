# fmt: off
# isort: off
from loguru import logger
from .manager import RedisManager


class RedisService:
    """Сервис для работы с Redis."""

    def __init__(self, manager: RedisManager):
        self.manager = manager
        logger.info("🔴 Redis сервис инициализирован")

    async def publish(self, request_id, data) -> None:
        """Публикует данные в канал."""
        return await self.manager.publish(request_id, data)

    async def publish_chunk(self, request_id, chunk: str) -> None:
        """Публикует чанк в Redis канал."""
        return await self.manager.publish_chunk(request_id, chunk)

    async def publish_message_start(self, request_id, message_data: dict) -> None:
        """Публикует начало сообщения."""
        return await self.manager.publish_message_start(request_id, message_data)

    async def publish_done(self, request_id, message_data: dict) -> None:
        """Публикует завершение сообщения."""
        return await self.manager.publish_done(request_id, message_data)

    def subscribe_to_stream(self, request_id):
        """Подписывается на стрим сообщений."""
        return self.manager.subscribe_to_stream(request_id)

    async def get_result(self, request_id):
        """Получает результат обработки."""
        return await self.manager.get_result(request_id)

    async def set_result(self, request_id, result: dict) -> None:
        """Сохраняет результат обработки."""
        return await self.manager.set_result(request_id, result)

    async def set_error(self, request_id, message: str, status_code: int, is_stream: bool) -> None:
        """Отправляет ошибку клиенту."""
        return await self.manager.set_error(request_id, message, status_code, is_stream)

    async def close(self) -> None:
        """Закрывает соединение с Redis."""
        return await self.manager.close()
