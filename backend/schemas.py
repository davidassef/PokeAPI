"""
Schemas Pydantic para validação de dados
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# ===== SCHEMAS DE USUÁRIO =====

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# ===== SCHEMAS DE FAVORITOS =====

class FavoritePokemonBase(BaseModel):
    pokemon_id: int

class FavoritePokemonCreate(FavoritePokemonBase):
    pass

class FavoritePokemonResponse(FavoritePokemonBase):
    id: int
    user_id: int
    pokemon_name: str
    added_at: datetime
    
    class Config:
        from_attributes = True

# ===== SCHEMAS DE RANKING =====

class UserRankingResponse(BaseModel):
    user_id: int
    username: str
    favorites_count: int
    position: int
    
    class Config:
        from_attributes = True

# ===== SCHEMAS DE RESPOSTA =====

class MessageResponse(BaseModel):
    message: str
    timestamp: Optional[datetime] = None

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    timestamp: datetime
