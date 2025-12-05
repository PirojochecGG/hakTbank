# fmt: off
# isort: off
import os
import asyncio
import platform

from loguru import logger

from app.services import container
from app.api.server import start_server
from app.scheduler import start_scheduler
from app.scheduler import shutdown_scheduler
from app.services import get_service
from app.logger import setup_logger



async def main() -> None:
    os.system("cls" if platform.system() == "Windows" else "clear")

    try:
        setup_logger()
        await container.initialize()
        await start_scheduler()

        _, pending = await asyncio.wait([
            asyncio.create_task(start_server()),
            ], return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()
        await asyncio.gather(*pending, return_exceptions=True)

    except Exception as e:
        logger.opt(exception=True).error(f"Произошла ошибка: {e}")
        raise

    finally:
        await shutdown_scheduler()
        await container.shutdown()


if __name__ == "__main__":
    try:
        asyncio.run(main())

    except (KeyboardInterrupt, SystemExit) as e:
        logger.info(f"Получен сигнал {e.__class__.__name__}...")

    except Exception as e:
        logger.opt(exception=True).critical(f"Критическая ошибка: {e}")
        raise
