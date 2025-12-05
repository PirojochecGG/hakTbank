# fmt: off
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated
from fastapi import Depends

from app.storage import get_session
from .auth import get_current_user
from app.storage.models import User


CurrentUser = Annotated[User, Depends(get_current_user)]
DBSession = Annotated[AsyncSession, Depends(get_session)]


__all__ = [
    "CurrentUser",
    "DBSession"
]
