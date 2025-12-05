from typing import Any, Dict
from pydantic import BaseModel
from abc import ABC, abstractmethod


class ToolSchema(BaseModel):
    """Схема OpenAI тулкала"""

    type: str = "function"
    function: Dict[str, Any]


class BaseTool(ABC):
    """Базовый класс для всех тулкалов"""

    def __init__(self):
        self.name = self.get_name()
        self.description = self.get_description()

    @abstractmethod
    def get_name(self) -> str:
        """Возвращает имя тулкала"""
        pass

    @abstractmethod
    def get_description(self) -> str:
        """Возвращает описание тулкала"""
        pass

    @abstractmethod
    def get_parameters(self) -> Dict[str, Any]:
        """Возвращает параметры тулкала в формате JSON Schema"""
        pass

    @abstractmethod
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """Выполняет логику тулкала"""
        pass

    def to_openai_schema(self) -> ToolSchema:
        """Конвертирует в схему OpenAI"""
        return ToolSchema(
            function={
                "name": self.name,
                "description": self.description,
                "parameters": self.get_parameters(),
            }
        )
