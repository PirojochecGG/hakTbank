from fastapi import APIRouter

from .auth import router as auth_router
from .user import router as user_router
from .subs import router as subs_router
from .chats import router as chats_router
from .payment import router as paymt_router
from .llm import router as llm_router

from .purchases import router as purchases_router


router_v1 = APIRouter(prefix="/v1")
router_v1.include_router(auth_router)
router_v1.include_router(user_router)
router_v1.include_router(subs_router)
router_v1.include_router(chats_router)
router_v1.include_router(paymt_router)
router_v1.include_router(purchases_router)
router_v1.include_router(llm_router)


__all__ = ["router_v1"]
