"""
Schemas Pydantic para validação de dados.
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional, Union


# Schemas de User
class UserBase(BaseModel):
    """Schema base do usuário."""
    username: str
    email: EmailStr


class UserCreate(UserBase):
    """Schema para criação de usuário."""
    pass


class UserUpdate(BaseModel):
    """Schema para atualização de usuário."""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class User(UserBase):
    """Schema de resposta do usuário."""
    id: int
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


# Schemas de FavoritePokemon
class FavoritePokemonBase(BaseModel):
    """Schema base do Pokémon favorito."""
    pokemon_id: int
    pokemon_name: str


class FavoritePokemonCreate(FavoritePokemonBase):
    """Schema para adicionar favorito."""
    user_id: int


class FavoritePokemon(FavoritePokemonBase):
    """Schema de resposta do favorito."""
    id: int
    user_id: int
    added_at: datetime

    class Config:
        from_attributes = True


class CheckCapturedRequest(BaseModel):
    """Schema para verificação de múltiplos Pokémon capturados."""
    pokemon_ids: List[int]


# Schemas de Ranking
class PokemonRankingBase(BaseModel):
    """Schema base do ranking."""
    pokemon_id: int
    pokemon_name: str
    favorite_count: int


class PokemonRanking(PokemonRankingBase):
    """Schema de resposta do ranking."""
    id: int
    last_updated: datetime

    class Config:
        from_attributes = True


# Schemas de sincronização
class SyncPayload(BaseModel):
    """Schema para payload de sincronização."""
    pokemonName: Optional[str] = None
    removed: Optional[bool] = False


class SyncCaptureRequest(BaseModel):
    """Schema para requisição de sincronização de captura."""
    pokemonId: int
    action: str  # 'capture' ou 'favorite'
    timestamp: int
    payload: Optional[SyncPayload] = None
    user_id: Optional[int] = 1


class SyncBatchRequest(BaseModel):
    """Schema para sincronização em lote."""
    requests: List[SyncCaptureRequest]
    batch_id: Optional[str] = None
    client_timestamp: Optional[int] = None


class SyncBatchResponse(BaseModel):
    """Schema de resposta da sincronização em lote."""
    success: bool
    processed_count: int
    failed_count: int
    errors: List[str] = []
    batch_id: Optional[str] = None


# Schema de resposta com lista de usuários
class UserWithFavorites(User):
    """Schema do usuário com seus favoritos."""
    favorites: List[FavoritePokemon] = []


# Schemas de resposta genérica
class Message(BaseModel):
    """Schema para mensagens simples."""
    message: str


# Schemas para sistema Pull-Based
class CaptureData(BaseModel):
    """Schema para dados de captura individual."""
    capture_id: str
    pokemon_id: int
    pokemon_name: str
    action: str  # 'capture' ou 'favorite'
    timestamp: Union[int, str]  # Aceita tanto int quanto ISO string
    synced: bool = False
    created_at: Optional[datetime] = None
    metadata: Optional[dict] = None
    user_id: Optional[str] = None


class ClientSyncData(BaseModel):
    """Schema para dados de sincronização do cliente."""
    user_id: str
    client_url: Optional[str] = None
    captures: List[CaptureData] = []
    last_sync: Optional[datetime] = None
    total_pending: int = 0


class PullRequest(BaseModel):
    """Schema para requisição de pull de dados."""
    client_urls: List[str] = []
    since: Optional[datetime] = None
    max_captures: Optional[int] = 100


class PullResponse(BaseModel):
    """Schema de resposta do pull de dados."""
    success: bool
    clients_processed: int
    total_captures: int
    failed_clients: List[str] = []
    errors: List[str] = []
    processing_time: Optional[float] = None


class ClientRegistration(BaseModel):
    """Schema para registro de cliente."""
    client_url: str
    user_id: str
    client_type: Optional[str] = "web"
    capabilities: List[str] = []


# Schemas de resposta genérica (mantendo compatibilidade)
class PokemonStats(BaseModel):
    """Schema para estatísticas gerais."""
    total_users: int
    total_favorites: int
    most_popular_pokemon: Optional[PokemonRanking] = None
