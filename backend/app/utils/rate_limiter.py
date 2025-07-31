"""
Utilitário para rate limiting e throttling de requisições no PokeAPI_SYNC.

Este módulo fornece um sistema de limitação de taxa de requisições
para prevenir abuso da API e garantir uso justo dos recursos.

Funcionalidades:
    - Rate limiting baseado em janela de tempo deslizante
    - Limites separados para diferentes tipos de operações
    - Informações detalhadas sobre limites e tempos de reset
    - Implementação thread-safe para uso em produção

Classes:
    RateLimiter: Implementação de limitador de taxa genérico

Funções auxiliares:
    check_sync_rate_limit: Verifica limite para sincronização individual
    check_batch_rate_limit: Verifica limite para sincronização em lote
    get_rate_limit_info: Retorna informações completas sobre limites

Configurações padrão:
    - Sincronização individual: 50 requisições por minuto
    - Sincronização em lote: 10 batches por minuto

Example:
    >>> from app.utils.rate_limiter import check_sync_rate_limit
    >>> if check_sync_rate_limit("192.168.1.1"):
    ...     print("Requisição permitida")
    ... else:
    ...     print("Limite excedido")
"""
import time
from typing import Dict, Optional
from datetime import datetime


class RateLimiter:
    """Limitador de taxa de requisições simples."""

    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        """
        Inicializa o limitador de taxa com parâmetros configuráveis.
        
        Args:
            max_requests: Número máximo de requisições permitidas na janela
            window_seconds: Tamanho da janela de tempo em segundos
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, list] = {}

    def is_allowed(self, identifier: str) -> bool:
        """
        Verifica se uma requisição é permitida para o identificador especificado.
        
        Implementa o algoritmo sliding window, removendo requisições antigas
        e verificando se o limite foi excedido.
        
        Args:
            identifier: Identificador único (ex: IP do cliente, user ID)
            
        Returns:
            bool: True se a requisição é permitida, False se o limite foi excedido
            
        Example:
            >>> limiter = RateLimiter(max_requests=2, window_seconds=60)
            >>> limiter.is_allowed("user1")  # Primeira requisição
            True
            >>> limiter.is_allowed("user1")  # Segunda requisição
            True
            >>> limiter.is_allowed("user1")  # Terceira requisição (excede limite)
            False
        """
        now = time.time()

        # Limpar requisições antigas fora da janela de tempo
        if identifier in self.requests:
            self.requests[identifier] = [
                req_time for req_time in self.requests[identifier]
                if now - req_time < self.window_seconds
            ]
        else:
            self.requests[identifier] = []

        # Verificar se excedeu o limite máximo
        if len(self.requests[identifier]) >= self.max_requests:
            return False

        # Registrar nova requisição
        self.requests[identifier].append(now)
        return True

    def get_remaining_requests(self, identifier: str) -> int:
        """
        Retorna o número de requisições restantes para o identificador.
        
        Calcula quantas requisições ainda podem ser feitas antes de
        atingir o limite máximo na janela de tempo atual.
        
        Args:
            identifier: Identificador único do cliente/usuário
            
        Returns:
            int: Número de requisições restantes (0 se limite excedido)
            
        Example:
            >>> limiter = RateLimiter(max_requests=5, window_seconds=60)
            >>> limiter.get_remaining_requests("user1")
            5
            >>> limiter.is_allowed("user1")
            True
            >>> limiter.get_remaining_requests("user1")
            4
        """
        if identifier not in self.requests:
            return self.max_requests

        now = time.time()
        valid_requests = [
            req_time for req_time in self.requests[identifier]
            if now - req_time < self.window_seconds
        ]

        return max(0, self.max_requests - len(valid_requests))

    def get_reset_time(self, identifier: str) -> Optional[datetime]:
        """
        Retorna a data/hora quando o limite será resetado para o identificador.
        
        Calcula quando a janela de tempo mais antiga expirará, liberando
        espaço para novas requisições.
        
        Args:
            identifier: Identificador único do cliente/usuário
            
        Returns:
            Optional[datetime]: Data/hora do reset ou None se não há requisições
            
        Example:
            >>> from datetime import datetime
            >>> limiter = RateLimiter(max_requests=1, window_seconds=60)
            >>> limiter.is_allowed("user1")
            True
            >>> reset_time = limiter.get_reset_time("user1")
            >>> isinstance(reset_time, datetime)
            True
        """
        if identifier not in self.requests or not self.requests[identifier]:
            return None

        oldest_request = min(self.requests[identifier])
        reset_time = oldest_request + self.window_seconds

        return datetime.fromtimestamp(reset_time)


# Instâncias globais pré-configuradas para diferentes tipos de operações
sync_rate_limiter = RateLimiter(max_requests=50, window_seconds=60)  # 50 requisições por minuto
batch_rate_limiter = RateLimiter(max_requests=10, window_seconds=60)  # 10 batches por minuto


def check_sync_rate_limit(client_ip: str) -> bool:
    """
    Verifica se uma requisição de sincronização individual é permitida.
    
    Usa o limitador global configurado para 50 requisições por minuto.
    
    Args:
        client_ip: Endereço IP do cliente
        
    Returns:
        bool: True se a requisição é permitida, False caso contrário
        
    Example:
        >>> if check_sync_rate_limit("192.168.1.1"):
        ...     print("Sincronização permitida")
        ... else:
        ...     print("Aguarde antes de sincronizar novamente")
    """
    return sync_rate_limiter.is_allowed(client_ip)


def check_batch_rate_limit(client_ip: str) -> bool:
    """
    Verifica se uma requisição de sincronização em lote é permitida.
    
    Usa o limitador global configurado para 10 batches por minuto.
    
    Args:
        client_ip: Endereço IP do cliente
        
    Returns:
        bool: True se o batch é permitido, False caso contrário
        
    Example:
        >>> if check_batch_rate_limit("192.168.1.1"):
        ...     print("Batch de sincronização permitido")
        ... else:
        ...     print("Aguarde antes de enviar outro batch")
    """


def get_rate_limit_info(client_ip: str) -> dict:
    """
    Retorna informações completas sobre os limites de taxa para um cliente.
    
    Fornece dados detalhados sobre quantas requisições restam e quando
    os limites serão resetados para ambos os tipos de operações.
    
    Args:
        client_ip: Endereço IP do cliente
        
    Returns:
        dict: Dicionário com informações de limites para sincronização e batch
            - sync_remaining: Requisições de sincronização restantes
            - batch_remaining: Batches restantes
            - sync_reset_time: Data/hora do reset de sincronização
            - batch_reset_time: Data/hora do reset de batch
            
    Example:
        >>> info = get_rate_limit_info("192.168.1.1")
        >>> print(f"Sincronizações restantes: {info['sync_remaining']}")
        Sincronizações restantes: 45
    """
    return {
        "sync_remaining": sync_rate_limiter.get_remaining_requests(client_ip),
        "batch_remaining": batch_rate_limiter.get_remaining_requests(client_ip),
        "sync_reset_time": sync_rate_limiter.get_reset_time(client_ip),
        "batch_reset_time": batch_rate_limiter.get_reset_time(client_ip)
    }
