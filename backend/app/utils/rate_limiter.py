"""
Utilitário para rate limiting e throttling de requisições.
"""
import time
from typing import Dict, Optional
from datetime import datetime


class RateLimiter:
    """Limitador de taxa de requisições simples."""

    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, list] = {}

    def is_allowed(self, identifier: str) -> bool:
        """Verifica se a requisição é permitida."""
        now = time.time()

        # Limpar requisições antigas
        if identifier in self.requests:
            self.requests[identifier] = [
                req_time for req_time in self.requests[identifier]
                if now - req_time < self.window_seconds
            ]
        else:
            self.requests[identifier] = []

        # Verificar se excedeu o limite
        if len(self.requests[identifier]) >= self.max_requests:
            return False

        # Adicionar nova requisição
        self.requests[identifier].append(now)
        return True

    def get_remaining_requests(self, identifier: str) -> int:
        """Retorna quantas requisições restam."""
        if identifier not in self.requests:
            return self.max_requests

        now = time.time()
        valid_requests = [
            req_time for req_time in self.requests[identifier]
            if now - req_time < self.window_seconds
        ]

        return max(0, self.max_requests - len(valid_requests))

    def get_reset_time(self, identifier: str) -> Optional[datetime]:
        """Retorna quando o limite será resetado."""
        if identifier not in self.requests or not self.requests[identifier]:
            return None

        oldest_request = min(self.requests[identifier])
        reset_time = oldest_request + self.window_seconds

        return datetime.fromtimestamp(reset_time)


# Instância global para sincronização
sync_rate_limiter = RateLimiter(max_requests=50, window_seconds=60)  # 50 req/min
batch_rate_limiter = RateLimiter(max_requests=10, window_seconds=60)  # 10 batches/min


def check_sync_rate_limit(client_ip: str) -> bool:
    """Verifica rate limit para sincronização individual."""
    return sync_rate_limiter.is_allowed(client_ip)


def check_batch_rate_limit(client_ip: str) -> bool:
    """Verifica rate limit para sincronização em lote."""
    return batch_rate_limiter.is_allowed(client_ip)


def get_rate_limit_info(client_ip: str) -> dict:
    """Retorna informações sobre o rate limit."""
    return {
        "sync_remaining": sync_rate_limiter.get_remaining_requests(client_ip),
        "batch_remaining": batch_rate_limiter.get_remaining_requests(client_ip),
        "sync_reset_time": sync_rate_limiter.get_reset_time(client_ip),
        "batch_reset_time": batch_rate_limiter.get_reset_time(client_ip)
    }
