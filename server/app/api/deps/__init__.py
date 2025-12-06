# fmt: off
from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.storage import get_session, User
from .auth import get_current_user


CurrentUser = Annotated[User, Depends(get_current_user)]
DBSession = Annotated[AsyncSession, Depends(get_session)]


__all__ = [
    "CurrentUser",
    "DBSession"
]
