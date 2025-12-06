from pydantic import BaseModel


class JWTPayload(BaseModel):
    """Payload JWT токена."""
    user_id: str
    exp: int
    iat: int
