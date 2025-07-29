"""
Schemas Pydantic para validação e serialização de dados da API.

Este módulo define todos os schemas utilizados para validação de entrada,
serialização de saída e documentação automática da API usando Pydantic.
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional, Union


# ===== SCHEMAS DE USUÁRIO =====

class UserBase(BaseModel):
    """
    Schema base para dados de usuário.

    Contém os campos comuns compartilhados entre diferentes operações de usuário.

    Attributes:
        username: Nome de usuário único no sistema
        email: Endereço de email válido para login e comunicação
    """
    username: str
    email: EmailStr


class UserCreate(UserBase):
    """
    Schema para criação de novo usuário.

    Herda os campos base e pode ser estendido com campos específicos
    para o processo de registro.
    """
    pass


class UserUpdate(BaseModel):
    """
    Schema para atualização de dados de usuário.

    Todos os campos são opcionais para permitir atualizações parciais.

    Attributes:
        username: Novo nome de usuário (opcional)
        email: Novo endereço de email (opcional)
        is_active: Status ativo/inativo da conta (opcional)
    """
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class User(UserBase):
    """
    Schema de resposta completo do usuário.

    Inclui todos os dados do usuário que podem ser retornados pela API,
    excluindo informações sensíveis como senhas.

    Attributes:
        id: Identificador único do usuário
        created_at: Data e hora de criação da conta
        is_active: Status atual da conta
    """
    id: int
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


# ===== SCHEMAS DE POKÉMONS FAVORITOS =====

class FavoritePokemonBase(BaseModel):
    """
    Schema base para Pokémons favoritos.

    Contém os dados essenciais de um Pokémon favoritado.

    Attributes:
        pokemon_id: ID do Pokémon na PokeAPI (1-1010+)
        pokemon_name: Nome do Pokémon para facilitar consultas
    """
    pokemon_id: int
    pokemon_name: str


class FavoritePokemonCreate(FavoritePokemonBase):
    """
    Schema para adicionar um Pokémon aos favoritos.

    Inclui a referência ao usuário que está favoritando o Pokémon.

    Attributes:
        user_id: ID do usuário que está favoritando
    """
    user_id: int


class FavoritePokemon(FavoritePokemonBase):
    """
    Schema de resposta completo de um Pokémon favorito.

    Inclui todos os dados do favorito incluindo metadados de auditoria.

    Attributes:
        id: Identificador único do registro de favorito
        user_id: ID do usuário proprietário
        added_at: Data e hora quando foi favoritado
    """
    id: int
    user_id: int
    added_at: datetime

    class Config:
        from_attributes = True


class CheckCapturedRequest(BaseModel):
    """
    Schema para verificação em lote de Pokémons capturados.

    Permite verificar o status de múltiplos Pokémons de uma só vez
    para otimizar a performance da interface.

    Attributes:
        pokemon_ids: Lista de IDs dos Pokémons a serem verificados
    """
    pokemon_ids: List[int]


# ===== SCHEMAS DE RANKING =====

class PokemonRankingBase(BaseModel):
    """
    Schema base para dados de ranking de Pokémons.

    Contém os dados essenciais de um item do ranking global.

    Attributes:
        pokemon_id: ID único do Pokémon na PokeAPI
        pokemon_name: Nome do Pokémon para facilitar consultas
        favorite_count: Número total de vezes que foi favoritado
    """
    pokemon_id: int
    pokemon_name: str
    favorite_count: int


class PokemonRanking(PokemonRankingBase):
    """
    Schema de resposta completo do ranking.

    Inclui metadados adicionais sobre o item do ranking.

    Attributes:
        id: Identificador único do registro de ranking
        last_updated: Data e hora da última atualização
    """
    id: int
    last_updated: datetime

    class Config:
        from_attributes = True


# ===== SCHEMAS DE SINCRONIZAÇÃO =====

class SyncPayload(BaseModel):
    """
    Schema para dados adicionais de sincronização.

    Contém metadados opcionais que acompanham uma operação de sincronização.

    Attributes:
        pokemonName: Nome do Pokémon (opcional, para facilitar debug)
        removed: Indica se é uma operação de remoção (padrão: False)
    """
    pokemonName: Optional[str] = None
    removed: Optional[bool] = False


class SyncCaptureRequest(BaseModel):
    """
    Schema para requisição individual de sincronização.

    Representa uma única operação de captura/favorito a ser sincronizada.

    Attributes:
        pokemonId: ID do Pokémon na PokeAPI
        action: Tipo de ação ('capture' ou 'favorite')
        timestamp: Timestamp Unix da operação no cliente
        payload: Dados adicionais opcionais
        user_id: ID do usuário (padrão: 1 para compatibilidade)
    """
    pokemonId: int
    action: str
    timestamp: int
    payload: Optional[SyncPayload] = None
    user_id: Optional[int] = 1


class SyncBatchRequest(BaseModel):
    """
    Schema para sincronização em lote.

    Permite enviar múltiplas operações de sincronização em uma única requisição
    para otimizar a performance e reduzir latência.

    Attributes:
        requests: Lista de requisições individuais de sincronização
        batch_id: Identificador único do lote (opcional)
        client_timestamp: Timestamp do cliente quando o lote foi criado
    """
    requests: List[SyncCaptureRequest]
    batch_id: Optional[str] = None
    client_timestamp: Optional[int] = None


class SyncBatchResponse(BaseModel):
    """
    Schema de resposta da sincronização em lote.

    Fornece informações detalhadas sobre o resultado do processamento
    do lote de sincronização.

    Attributes:
        success: Indica se o lote foi processado com sucesso
        processed_count: Número de requisições processadas com sucesso
        failed_count: Número de requisições que falharam
        errors: Lista de mensagens de erro detalhadas
        batch_id: ID do lote processado (se fornecido)
    """
    success: bool
    processed_count: int
    failed_count: int
    errors: List[str] = []
    batch_id: Optional[str] = None


# ===== SCHEMAS COMPOSTOS E UTILITÁRIOS =====

class UserWithFavorites(User):
    """
    Schema estendido do usuário incluindo seus Pokémons favoritos.

    Útil para endpoints que precisam retornar o usuário com sua lista
    completa de favoritos em uma única resposta.

    Attributes:
        favorites: Lista de Pokémons favoritos do usuário
    """
    favorites: List[FavoritePokemon] = []


class Message(BaseModel):
    """
    Schema para respostas simples com mensagem.

    Usado para endpoints que retornam apenas uma mensagem de confirmação
    ou informação simples.

    Attributes:
        message: Texto da mensagem a ser exibida
    """
    message: str


# ===== SCHEMAS DO SISTEMA PULL-BASED =====

class CaptureData(BaseModel):
    """
    Schema para dados individuais de captura no sistema pull-based.

    Representa uma única operação de captura/favorito armazenada
    no cliente aguardando sincronização.

    Attributes:
        capture_id: Identificador único da captura no cliente
        pokemon_id: ID do Pokémon na PokeAPI
        pokemon_name: Nome do Pokémon
        action: Tipo de ação ('capture' ou 'favorite')
        timestamp: Timestamp da operação (int Unix ou string ISO)
        synced: Status de sincronização (padrão: False)
        created_at: Data de criação no cliente (opcional)
        metadata: Dados adicionais opcionais
        user_id: ID do usuário (opcional)
    """
    capture_id: str
    pokemon_id: int
    pokemon_name: str
    action: str
    timestamp: Union[int, str]
    synced: bool = False
    created_at: Optional[datetime] = None
    metadata: Optional[dict] = None
    user_id: Optional[str] = None


class ClientSyncData(BaseModel):
    """
    Schema para dados completos de sincronização de um cliente.

    Representa o estado atual de sincronização de um cliente específico
    incluindo todas as capturas pendentes.

    Attributes:
        user_id: ID do usuário proprietário dos dados
        client_url: URL do cliente (opcional)
        captures: Lista de capturas pendentes de sincronização
        last_sync: Data e hora da última sincronização bem-sucedida
        total_pending: Número total de capturas pendentes
    """
    user_id: str
    client_url: Optional[str] = None
    captures: List[CaptureData] = []
    last_sync: Optional[datetime] = None
    total_pending: int = 0


class PullRequest(BaseModel):
    """
    Schema para requisição de pull de dados dos clientes.

    Permite ao servidor solicitar dados de múltiplos clientes
    com filtros opcionais para otimizar a sincronização.

    Attributes:
        client_urls: Lista de URLs dos clientes a serem consultados
        since: Data limite para buscar apenas dados recentes (opcional)
        max_captures: Número máximo de capturas por cliente (padrão: 100)
    """
    client_urls: List[str] = []
    since: Optional[datetime] = None
    max_captures: Optional[int] = 100


class PullResponse(BaseModel):
    """
    Schema de resposta do processo de pull de dados.

    Fornece informações detalhadas sobre o resultado da operação
    de pull de dados de múltiplos clientes.

    Attributes:
        success: Indica se a operação foi bem-sucedida
        clients_processed: Número de clientes processados com sucesso
        total_captures: Total de capturas coletadas
        failed_clients: Lista de URLs de clientes que falharam
        errors: Lista de mensagens de erro detalhadas
        processing_time: Tempo total de processamento em segundos
    """
    success: bool
    clients_processed: int
    total_captures: int
    failed_clients: List[str] = []
    errors: List[str] = []
    processing_time: Optional[float] = None


class ClientRegistration(BaseModel):
    """
    Schema para registro de novo cliente no sistema pull-based.

    Permite que clientes se registrem no servidor para participar
    do processo de sincronização pull-based.

    Attributes:
        client_url: URL base do cliente para comunicação
        user_id: ID do usuário associado ao cliente
        client_type: Tipo do cliente (padrão: "web")
        capabilities: Lista de capacidades suportadas pelo cliente
    """
    client_url: str
    user_id: str
    client_type: Optional[str] = "web"
    capabilities: List[str] = []


# ===== SCHEMAS DE ESTATÍSTICAS =====

class PokemonStats(BaseModel):
    """
    Schema para estatísticas gerais do sistema.

    Fornece métricas agregadas sobre o uso do sistema e popularidade
    dos Pokémons.

    Attributes:
        total_users: Número total de usuários registrados
        total_favorites: Número total de favoritos no sistema
        most_popular_pokemon: Pokémon mais popular (opcional)
    """
    total_users: int
    total_favorites: int
    most_popular_pokemon: Optional[PokemonRanking] = None
