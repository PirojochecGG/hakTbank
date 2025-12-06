# fmt: off
# isort: off
import asyncio
from uuid import UUID
from loguru import logger
from datetime import datetime, timedelta
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Dict, Callable, Awaitable, List

from app.storage import RequestStatus, RequestPriority, Request, get_session
from .objects import QueueStats


class QueueManager:
    """Менеджер очереди запросов."""

    def __init__(self, ratio=(1, 2), workers=50, batch=100):
        self.tasks = []
        self.batch = batch
        self.feeder = None
        self.ratio = ratio
        self.running = False
        self.workers = workers
        self.queue = asyncio.Queue()
        self._ratio_counter = 0
        logger.info(f"🚀 QueueManager: {workers} workers, batch={batch}, ratio={ratio}")


    async def _shutdown(self) -> None:
        """Завершает работу очереди."""
        self.running = False
        if self.feeder and not self.feeder.done():
            self.feeder.cancel()

        for task in self.tasks:
            if not task.done():
                task.cancel()

        if self.tasks:
            await asyncio.gather(
                *self.tasks,
                return_exceptions=True
            )


    async def _feed(self) -> None:
        """Подает запросы в очередь."""
        while self.running:
            try:
                if self.queue.qsize() < self.batch:
                    async for db in get_session():
                        if (reqs := await self._get_batch(db)):
                            logger.info(f"🚀 Подхвачено {len(reqs)} запросов")
                            for req in reqs: await self.queue.put(req)
                        break
            except Exception as e:
                logger.error(f"🚀 Ошибка feeder [{e.__class__.__name__}]: {e}")
            await asyncio.sleep(1)


    async def _process(self, db: AsyncSession, req: Request, handler: Callable, wid: int) -> None:
        """Обрабатывает один запрос."""
        logger.info(f"🚀 [W{wid}] {req.id}")
        try:
            await handler(req)
            await self.complete_request(db, req.id)
        except Exception as e:
            logger.error(f"🚀 [W{wid}] Ошибка {req.id} [{e.__class__.__name__}]: {e}")
            await self.fail_request(db, req.id, f"[{e.__class__.__name__}] {e}")


    async def process_queue(self, handler: Callable[[Request], Awaitable[bool]]) -> None:
        """Запускает обработку очереди."""
        try:
            logger.info(f"🚀 Запуск {self.workers} воркеров")
            self.tasks = [asyncio.create_task(self._worker(i, handler)) for i in range(self.workers)]
            self.feeder = asyncio.create_task(self._feed())

            self.running = True
            await asyncio.gather(self.feeder, *self.tasks)

        except Exception as e:
            logger.error(f"🚀 Ошибка очереди [{e.__class__.__name__}]: {e}")
        finally:
            await self._shutdown()


    async def enqueue(
        self, db: AsyncSession, user_id: UUID, payload: Dict[str, Any],
        priority: RequestPriority = RequestPriority.GENERAL,
    ) -> UUID:
        """Добавляет запрос в очередь."""
        db.add(req := Request(
            user_id=user_id,
            priority=priority,
            payload=payload,
        ))
        await db.commit()
        return req.id


    async def _get_batch(self, db: AsyncSession) -> List[Request]:
        """Получает пачку запросов для обработки."""
        g_cnt = await db.scalar(select(func.count(Request.id)).where(
            Request.status == RequestStatus.PENDING,
            Request.priority == RequestPriority.GENERAL
        ))
        p_cnt = await db.scalar(select(func.count(Request.id)).where(
            Request.status == RequestStatus.PENDING,
            Request.priority == RequestPriority.PREMIUM
        ))
        if not (g_cnt := g_cnt or 0) and not (p_cnt := p_cnt or 0):
            return []

        # Соотношение 1:2 с ротацией
        if g_cnt and p_cnt:
            self._ratio_counter = (self._ratio_counter + 1) % sum(self.ratio)
            is_general = self._ratio_counter < self.ratio[0]
        else: is_general = not p_cnt

        priority = RequestPriority.GENERAL if is_general else RequestPriority.PREMIUM
        size = min(self.batch, g_cnt if is_general else p_cnt)

        logger.info(f"🚀 Доступно: general={g_cnt}, premium={p_cnt}, выбрано: {priority.value}={size}")
        return await self._lock_batch(db, priority, size)


    async def _lock_batch(self, db: AsyncSession, priority: RequestPriority, count: int) -> List[Request]:
        """Блокирует пачку запросов для обработки."""
        if not (reqs := list((await db.execute(select(Request).where(
            Request.status == RequestStatus.PENDING,
            Request.priority == priority
        ).order_by(Request.created_at).limit(count))).scalars().all())):
            return []

        now = datetime.now()
        await db.execute(
            update(Request).where(Request.id.in_([r.id for r in reqs]))
            .values(status=RequestStatus.PROCESSING, locked_at=now)
        )
        await db.commit()

        for r in reqs:
            r.status = RequestStatus.PROCESSING
            r.locked_at = now
        return reqs


    async def complete_request(self, db: AsyncSession, req_id: UUID) -> bool:
        """Удаляет успешно выполненный запрос."""
        if req := await db.get(Request, req_id):
            await db.delete(req)
            await db.commit()
            return True
        return False


    async def fail_request(self, db: AsyncSession, req_id: UUID, error: str) -> bool:
        """Отмечает запрос как неудачный."""
        result = await db.execute(
            update(Request)
            .where(Request.id == req_id)
            .values(
                status=RequestStatus.FAILED,
                processed_at=datetime.now(),
                error=error
            )
        )
        await db.commit()
        return result.rowcount > 0


    async def _worker(self, wid: int, handler: Callable[[Request], Awaitable[bool]]) -> None:
        """Воркер для обработки запросов."""
        from app.storage import get_session

        while self.running:
            try:
                req = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                async for db in get_session():
                    await self._process(db, req, handler, wid)
                    break
                self.queue.task_done()

            except asyncio.TimeoutError:
                continue

            except Exception as e:
                logger.error(f"🚀 Ошибка W{wid} [{e.__class__.__name__}]: {e}")
                await asyncio.sleep(0.1)


    async def cleanup_completed(self, db: AsyncSession, days: int = 7) -> int:
        """Удаляет старые завершенные запросы."""
        threshold = datetime.now() - timedelta(days=days)
        result = await db.execute(
            select(Request).where(
                Request.status.in_([
                    RequestStatus.COMPLETED,
                    RequestStatus.FAILED]),
                Request.processed_at < threshold
            )
        )

        reqs = result.scalars().all()
        for req in reqs:
            await db.delete(req)

        await db.commit()
        return len(reqs)


    async def get_queue_stats(self, db: AsyncSession) -> QueueStats:
        """Получает статистику очереди."""
        general_pending = await db.scalar(select(func.count(Request.id)).where(
            Request.status == RequestStatus.PENDING,
            Request.priority == RequestPriority.GENERAL
        ))
        premium_pending = await db.scalar(select(func.count(Request.id)).where(
            Request.status == RequestStatus.PENDING,
            Request.priority == RequestPriority.PREMIUM
        ))
        processing = await db.scalar(select(func.count(Request.id)).where(
            Request.status == RequestStatus.PROCESSING
        ))
        completed = await db.scalar(select(func.count(Request.id)).where(
            Request.status == RequestStatus.COMPLETED
        ))
        failed = await db.scalar(select(func.count(Request.id)).where(
            Request.status == RequestStatus.FAILED
        ))
        return QueueStats(
            pending={
                "general": general_pending or 0,
                "premium": premium_pending or 0
            },
            processing=processing or 0,
            completed=completed or 0,
            failed=failed or 0,
        )
