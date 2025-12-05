# fmt: off
# isort: off
from loguru import logger
from typing import Dict, Any

from app.services.srv_auth import AuthService
from app.services.srv_auth import AuthManager
from app.services.srv_chat import ChatService
from app.services.srv_chat import ChatManager
from app.services.srv_redis import RedisService
from app.services.srv_redis import RedisManager
from app.services.srv_purchase import PurchaseService
from app.services.srv_purchase import PurchaseManager


class ServiceContainer:
    """Контейнер сервисов."""

    def __init__(self):
        self._services: Dict[str, Any] = {}
        self._initialized = False

    def register(self, name: str, service: Any) -> None:
        self._services[name] = service

    def get(self, name: str) -> Any:
        return self._services[name]

    async def initialize(self) -> None:
        if self._initialized:
            return

        logger.info("Инициализация сервисов...")
        self.register("auth", AuthService(AuthManager()))
        self.register("chat", ChatService(ChatManager()))
        self.register("redis", RedisService(RedisManager()))
        self.register("purchase", PurchaseService(PurchaseManager()))

        self._initialized = True
        logger.info("✅ Сервисы инициализированы")

    async def shutdown(self) -> None:
        for _, service in self._services.items():
            if hasattr(service, 'close'):
                await service.close()
        self._services.clear()
        self._initialized = False
        logger.info("✅ Сервисы закрыты")


container = ServiceContainer()


class Services:
    @property
    def auth(self) -> "AuthService":
        return container.get("auth")

    @property
    def chat(self) -> "ChatService":
        return container.get("chat")

    @property
    def purchase(self) -> "PurchaseService":
        return container.get("purchase")

    @property
    def redis(self) -> "RedisService":
        return container.get("redis")


get_service = Services()
