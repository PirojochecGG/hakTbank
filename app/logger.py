# fmt: off
# isort: off
import os
import sys
import time
import logging
import logging_loki

from queue import Queue
from loguru import logger
from threading import Thread
from datetime import datetime

from .settings import SETTINGS


# Формат логирования
LOG_FORMAT = "<level>{level: <8}</level> | [<cyan>{module}</cyan>] - {message}"


class BatchLokiHandler:
    def __init__(self, loki_handler):
        self.queue = Queue()
        self.loki_handler = loki_handler
        self._level_mapping = {
            "TRACE":    logging.DEBUG,
            "DEBUG":    logging.DEBUG,
            "INFO":     logging.INFO,
            "SUCCESS":  logging.INFO,
            "WARNING":  logging.WARNING,
            "ERROR":    logging.ERROR,
            "CRITICAL": logging.CRITICAL
        }
        Thread(target=self._sender, daemon=True).start()

    def write(self, message):
        msg = message.strip()
        level = next((v for k, v in self._level_mapping.items() if k in msg), logging.INFO)
        self.queue.put(logging.LogRecord("studgpt", level, "", 0, msg, (), None))

    def _sender(self):
        while True:
            time.sleep(1)
            while not self.queue.empty():
                try: self.loki_handler.emit(self.queue.get_nowait())
                except: pass


def setup_logger():
    os.makedirs(os.path.join(
        "logs", datetime.now().strftime("%m.%Y")),
        exist_ok=True
    )

    try: # Подготовка Loki с батчингом
        loki_handler = logging_loki.LokiHandler(
            url=SETTINGS.LOKI_URL,
            tags={
                "application": SETTINGS.LOG_SERVICE_NAME,
                "service": SETTINGS.LOG_SERVICE_NAME},
            auth=(
                SETTINGS.LOKI_LOGIN,
                SETTINGS.LOKI_PASSWORD),
            version="1",
        )
        loki_handler.handleError = lambda record: None
        batch_handler = BatchLokiHandler(loki_handler)

    except Exception as e:
        logger.error(f"📜 Error setup loki: {e}")
        batch_handler = None


    # Настройка Loguru
    logger.remove()
    handlers = [
        {
            "sink": sys.stdout,
            "format": LOG_FORMAT,
            "level": SETTINGS.LOG_LEVEL,
            "backtrace": True, "diagnose": True,
        },
        {
            "sink": os.path.join("logs", datetime.now().strftime("%m.%Y"), datetime.now().strftime("%d.%m.%Y.log")),
            "format": LOG_FORMAT,
            "level": SETTINGS.LOG_LEVEL,
            "rotation": "10 MB", "retention": "7 days", "encoding": "utf-8",
        },
    ]

    # Добавляем Loki handler только если он успешно создан
    if batch_handler:
        handlers.append({
            "sink": batch_handler,
            "level": SETTINGS.LOG_LEVEL,
            "serialize": False,
        })

    logger.configure(handlers=handlers)
    logger.info("📜 Logger setup sucessful")
