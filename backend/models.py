"""
Modelos de banco de dados para PokeAPI App
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    """Modelo de usuário"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    
    # Relacionamentos
    favorites = relationship("FavoritePokemon", back_populates="user", cascade="all, delete-orphan")

class FavoritePokemon(Base):
    """Modelo de Pokémon favorito"""
    __tablename__ = "favorite_pokemons"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pokemon_id = Column(Integer, nullable=False)
    pokemon_name = Column(String(100), nullable=False)
    added_at = Column(DateTime, default=datetime.now)
    
    # Relacionamentos
    user = relationship("User", back_populates="favorites")

class UserRanking(Base):
    """Modelo para ranking de usuários (view materializada)"""
    __tablename__ = "user_rankings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    username = Column(String(50), nullable=False)
    favorites_count = Column(Integer, default=0)
    position = Column(Integer)
    updated_at = Column(DateTime, default=datetime.now)
    
    # Relacionamentos
    user = relationship("User")
