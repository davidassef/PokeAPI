"""
Schemas Pydantic para validação de dados.
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional


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


# Schema de resposta com lista de usuários
class UserWithFavorites(User):
    """Schema do usuário com seus favoritos."""
    favorites: List[FavoritePokemon] = []


# Schemas de resposta genérica
class Message(BaseModel):
    """Schema para mensagens simples."""
    message: str


class PokemonStats(BaseModel):
    """Schema para estatísticas gerais."""
    total_users: int
    total_favorites: int
    most_popular_pokemon: Optional[PokemonRanking] = None
