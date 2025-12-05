# fmt: off
# isort: off
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated


from app.storage import get_session, User



# security = HTTPBearer()

#AuthUser = Annotated[User, Depends(get_current_user)]
DBSession = Annotated[AsyncSession, Depends(get_session)]


__all__ = [
   # "AuthUser",
    "DBSession"
]
