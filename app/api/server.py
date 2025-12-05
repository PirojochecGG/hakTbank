# fmt: off
import uvicorn

from typing import Any
from fastapi import FastAPI
from fastapi.middleware import cors
from fastapi.responses import JSONResponse
from scalar_fastapi import get_scalar_api_reference

from app.api.exceptions import setup_exception_handlers
from app.api.routers import main_router
from app.settings import SETTINGS


def create_app() -> FastAPI:
    """Создает FastAPI приложение"""
    app = FastAPI(
        version="0.1.0", title="TBank API",
        description="Сервис для работы с TBank",
        swagger_ui_parameters={"persistAuthorization": True},
    )

    app.openapi_components = {
        "securitySchemes": {
            "Bearer": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
            },
        }
    }

    app.add_middleware(
        cors.CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=False
    )

    # Подключение всех роутеров
    app.include_router(main_router)

    # Обработчики исключений
    setup_exception_handlers(app)

    @app.get("/health", tags=["Health"])
    async def health_check() -> JSONResponse:
        """Проверка работоспособности сервера"""
        return JSONResponse(content={"status": "ok"})

    @app.get("/", tags=["Root"])
    async def root() -> JSONResponse:
        """Дефолтный роутер"""
        return JSONResponse(content={"message": "TBank API"})

    @app.get("/scalar", include_in_schema=False)
    async def scalar_html() -> Any:
        """Ссылка на документацию API в Scalar UI"""
        return get_scalar_api_reference(title=app.title, openapi_url=app.openapi_url)

    return app


async def start_server() -> None:
    """Запуск FastAPI сервера"""
    await uvicorn.Server(
        uvicorn.Config(
            app=create_app(),
            reload=False,
            loop="uvloop",
            http="httptools",
            host=SETTINGS.API_HOST,
            port=SETTINGS.API_PORT,
            log_level=SETTINGS.LOG_LEVEL.lower()
        )
    ).serve()
