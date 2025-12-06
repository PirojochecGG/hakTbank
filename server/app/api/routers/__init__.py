# fmt: off
# isort: off
from fastapi import APIRouter
from .v1.router_v1 import router_v1

main_router = APIRouter()
main_router.include_router(router_v1)

__all__ = ["main_router"]
