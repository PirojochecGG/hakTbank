# fmt: off
# isort: off
import random

from loguru   import logger
from pydantic import SecretStr
from typing   import Callable, List, Union, Any, Awaitable



class APIKeyManager:
    """Менеджер API ключей."""

    @staticmethod
    def _parse_keys(key_val: Union[SecretStr, str]) -> List[str]:
        """Парсинг строки с ключами.

        Args:
            key_val: Строка с ключами или SecretStr

        Returns:
            Список ключей
        """
        if isinstance(key_val, SecretStr):
            keys_str = key_val.get_secret_value()
        else:
            keys_str = str(key_val)
        return [key.strip() for key in keys_str.split(",") if key.strip()]


    @staticmethod
    def get_random_api_key(key_val: Union[SecretStr, str]) -> str:
        """Выбор случайного API ключа.

        Args:
            key_val: Строка с ключами или SecretStr

        Returns:
            Случайный ключ

        Raises:
            ValueError: Если ключи не найдены
        """
        if not (keys := APIKeyManager._parse_keys(key_val)):
            raise ValueError("No API keys found")
        return random.choice(keys)


    @staticmethod
    async def try_request(
        key_val: Union[SecretStr, str],
        request_func: Callable[[str], Awaitable[Any]],
        max_retries: int = 3
    ) -> Any:
        """Выполнение запроса с автоматической сменой ключей при ошибке.

        Args:
            key_val: Строка с ключами или SecretStr
            request_func: Асинхронная функция для выполнения запроса, принимает ключ
            max_retries: Максимальное количество попыток

        Returns:
            Результат успешного запроса

        Raises:
            Exception: Если все ключи не сработали
        """
        if not (keys := APIKeyManager._parse_keys(key_val)):
            raise ValueError("No API keys found")

        used_keys = set()
        for _ in range(min(max_retries, len(keys))):
            if not (available_keys := [k for k in keys if k not in used_keys]):
                break

            key = random.choice(available_keys)
            used_keys.add(key)
            try:
                return await request_func(key)
            except Exception as e:
                logger.warning(f"API key failed: {key[:8]}...{key[-4:]} - {str(e)}")
                continue
        raise Exception("All API keys failed")
