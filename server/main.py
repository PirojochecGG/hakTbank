import uvicorn

from app.logger import setup_logger
from app.settings import SETTINGS


if __name__ == "__main__":
    setup_logger()
    uvicorn.run(
        "app.api.server:create_app",
        log_level=SETTINGS.LOG_LEVEL.lower(),
        host=SETTINGS.API_HOST,
        port=SETTINGS.API_PORT,
        factory=True,
        reload=True,
    )
