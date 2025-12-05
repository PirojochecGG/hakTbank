# fmt: off
# isort: off
import json
import asyncio

from typing import Any, Dict, List
from ..clients import get_client
from . import tool_registry


class ToolManager:
    async def _execute_tool_call(self, call) -> Dict[str, Any]:
        """Выполняет один tool call и возвращает результат с метаданными"""
        try:
            args = json.loads(call.function.arguments or '{}')
            result = await tool_registry.execute_tool(call.function.name, **args)

            metadata = {
                "tool_name": call.function.name,
                "arguments": args,
                "result": result
            } if tool_registry.get_tool(call.function.name) else None

            return {
                "role": "tool",
                "tool_call_id": call.id,
                "name": call.function.name,
                "content": json.dumps(result, ensure_ascii=False),
                "metadata": metadata
            }

        except Exception as e:
            return {
                "role": "tool",
                "tool_call_id": call.id,
                "name": call.function.name,
                "content": f"Ошибка выполнения toolсall: {e}",
                "metadata": None
            }


    async def process_with_tools(self, msgs: List[Dict[str, Any]], model: str = "gemini-1.5-flash") -> List[Dict[str, Any]]:
        response = await get_client("OpenaiLLM").chat_completion(
            model=model, messages=msgs, tools=tool_registry.get_openai_schemas() or None, tool_choice="auto"
        )

        print(f"\n\nTOOL CALLS: {response.choices[0].message.tool_calls}\n\n")
        if not (tool_calls := response.choices[0].message.tool_calls):
            return msgs

        # Выполняем все tool calls параллельно
        results = await asyncio.gather(*[
            self._execute_tool_call(call)
            for call in tool_calls
        ])

        # Добавляем tool messages с метаданными
        for result in results:
            tool_msg = {k: v for k, v in result.items() if k != "metadata"}
            if result["metadata"]: tool_msg["tool_metadata"] = [result["metadata"]]
            msgs.append(tool_msg)

        return msgs


tool_manager = ToolManager()
