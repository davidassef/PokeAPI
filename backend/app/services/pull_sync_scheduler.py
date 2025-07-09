"""
Scheduler para sistema pull-based de sincronização.
Executa tarefas periódicas para puxar dados dos clientes.
"""
import asyncio
import logging
from datetime import datetime
from typing import Optional

from app.core.database import get_db
from app.services.pull_sync_service import pull_service

logger = logging.getLogger(__name__)


class PullSyncScheduler:
    """Scheduler para tarefas de sincronização pull-based."""

    def __init__(self):
        self.running = False
        self.task: Optional[asyncio.Task] = None
        self.sync_interval = 30  # segundos
        self.cleanup_interval = 3600  # 1 hora
        self.last_cleanup = datetime.now()

    async def start(self):
        """Inicia o scheduler."""
        if self.running:
            logger.warning("Scheduler já está executando")
            return

        self.running = True
        self.task = asyncio.create_task(self._run_loop())
        logger.info("🔄 Scheduler de pull sync iniciado")

    async def stop(self):
        """Para o scheduler."""
        if not self.running:
            return

        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass

        logger.info("🛑 Scheduler de pull sync parado")

    async def _run_loop(self):
        """Loop principal do scheduler."""
        while self.running:
            try:
                await self._sync_clients()
                await self._cleanup_if_needed()
                await asyncio.sleep(self.sync_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"❌ Erro no loop do scheduler: {e}")
                await asyncio.sleep(5)  # Aguardar antes de tentar novamente

    async def _sync_clients(self):
        """Sincroniza todos os clientes registrados."""
        try:
            db = next(get_db())
            result = await pull_service.sync_with_storage_system(db)

            if result.get('total_captures', 0) > 0:
                logger.info(f"📥 Sincronizados {result['total_captures']} capturas de {result['clients_processed']} clientes")

            if result.get('failed_clients'):
                logger.warning(f"❌ {len(result['failed_clients'])} clientes falharam na sincronização")

        except Exception as e:
            logger.error(f"❌ Erro na sincronização de clientes: {e}")

    async def _cleanup_if_needed(self):
        """Executa cleanup se necessário."""
        now = datetime.now()
        if (now - self.last_cleanup).total_seconds() >= self.cleanup_interval:
            try:
                removed_count = await pull_service.cleanup_inactive_clients()
                if removed_count > 0:
                    logger.info(f"🧹 Removidos {removed_count} clientes inativos")
                self.last_cleanup = now
            except Exception as e:
                logger.error(f"❌ Erro no cleanup: {e}")

    def get_status(self) -> dict:
        """Retorna status do scheduler."""
        return {
            "running": self.running,
            "sync_interval": self.sync_interval,
            "cleanup_interval": self.cleanup_interval,
            "last_cleanup": self.last_cleanup.isoformat() if self.last_cleanup else None
        }

    def set_sync_interval(self, interval: int):
        """Define intervalo de sincronização."""
        if interval < 5:
            raise ValueError("Intervalo mínimo é 5 segundos")
        self.sync_interval = interval
        logger.info(f"📅 Intervalo de sincronização alterado para {interval} segundos")


# Instância global do scheduler
pull_scheduler = PullSyncScheduler()
