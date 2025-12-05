# fmt: off
# isort: off
from fastapi import APIRouter

from .auth import router as auths_router


router_v1 = APIRouter(prefix="/v1")


router_v1 = APIRouter()
router_v1.include_router(auths_router)


__all__ = ["router_v1"]
