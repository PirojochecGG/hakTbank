# fmt: off
# isort: off
from .base import BaseClient
from .openai import OpenaiClient
from .nebius  import NebiusClient
from .gemini import GeminiClient

_CLIENTS = {
    "OpenaiLLM":   OpenaiClient,
    "NebiusLLM":   NebiusClient,
    "GeminiLLM": GeminiClient,
}

def get_client(name: str) -> BaseClient:
    """Получает клиент по имени."""
    if name not in _CLIENTS:
        raise ValueError(f"Клиент '{name}' не найден")
    return _CLIENTS[name]()
