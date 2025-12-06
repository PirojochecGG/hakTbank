# fmt: off
from loguru import logger
from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException
from starlette.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.exception_handlers import (
    request_validation_exception_handler,
    http_exception_handler
)


def setup_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError):
        logger.error(f"Validation error: {exc}")
        return await request_validation_exception_handler(request, exc)

    @app.exception_handler(HTTPException)
    async def http_handler(request: Request, exc: HTTPException):
        logger.error(f"HTTP error: {exc}")
        return await http_exception_handler(request, exc)

    @app.exception_handler(TimeoutError)
    async def timeout_handler(request: Request, exc: TimeoutError):
        logger.error(f"Timeout error: {exc}")
        return JSONResponse(status_code=408, content={"message": "Request timeout"})

    @app.exception_handler(Exception)
    async def general_handler(request: Request, exc: Exception):
        logger.error(f"General error: {exc}")
        return JSONResponse(status_code=500, content={"message": f"Something went wrong: {exc}"})
