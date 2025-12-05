# fmt: off
# isort: off
from typing import Any, Dict, List, Optional

from .tools.base import BaseTool


class ToolRegistry:
    """Реестр всех тулкалов"""

    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
        self._register_all_tools()

    def _register_all_tools(self):
        """Регистрирует все доступные тулкалы"""
        print("reg")

    def register(self, tool: BaseTool) -> None:
        """Регистрирует тулкал"""
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> Optional[BaseTool]:
        """Получает тулкал по имени"""
        return self._tools.get(name)

    def get_all_tools(self) -> List[BaseTool]:
        """Возвращает все зарегистрированные тулкалы"""
        return list(self._tools.values())

    def get_openai_schemas(self) -> List[Dict[str, Any]]:
        """Возвращает схемы всех тулкалов для OpenAI"""
        return [tool.to_openai_schema().model_dump() for tool in self._tools.values()]

    async def execute_tool(self, name: str, **kwargs) -> Dict[str, Any]:
        """Выполняет тулкал по имени"""
        tool = self.get_tool(name)
        if not tool:
            raise ValueError(f"Тулкал '{name}' не найден")
        return await tool.execute(**kwargs)


tool_registry = ToolRegistry()

__all__ = [
    "BaseTool",
    "ToolRegistry",
    "tool_registry",
    "WeatherTool",
    "ImageGenerationTool"
]
