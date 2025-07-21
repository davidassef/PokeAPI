"""
Modelos do banco de dados para o PokeAPI App.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from enum import Enum


class UserRole(str, Enum):
    """Enum para roles de usuário."""
    VISITOR = "visitor"
    USER = "user"
    ADMINISTRATOR = "administrator"


class User(Base):
    """Modelo de usuário."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)  # Nome obrigatório
    contact = Column(String(100), nullable=True)  # Contato opcional (telefone, whatsapp, etc)
    security_question = Column(String(50), nullable=True)  # Pergunta de segurança
    security_answer_hash = Column(String(255), nullable=True)  # Resposta criptografada
    role = Column(String(20), default=UserRole.USER.value, nullable=False)  # Role do usuário
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)  # Último login

    # Relacionamentos
    favorites = relationship("FavoritePokemon", back_populates="user")


class FavoritePokemon(Base):
    """Modelo para Pokémons favoritos do usuário."""

    __tablename__ = "favorite_pokemons"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pokemon_id = Column(Integer, nullable=False)
    pokemon_name = Column(String(100), nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    user = relationship("User", back_populates="favorites")


class PokemonRanking(Base):
    """Modelo para ranking de Pokémons mais favoritados."""

    __tablename__ = "pokemon_rankings"

    id = Column(Integer, primary_key=True, index=True)
    pokemon_id = Column(Integer, unique=True, nullable=False)
    pokemon_name = Column(String(100), nullable=False)
    favorite_count = Column(Integer, default=0)
    last_updated = Column(DateTime(timezone=True), server_default=func.now())


class PokemonFlavorTranslation(Base):
    """Modelo para cache persistente de traduções de flavor de Pokémon."""
    __tablename__ = "pokemon_flavor_translation"
    id = Column(Integer, primary_key=True, index=True)
    pokemon_id = Column(Integer, index=True)
    flavor_en = Column(Text, nullable=False)
    flavor_translated = Column(Text, nullable=False)
    lang = Column(String(10), nullable=False)  # 'pt-BR', 'es-ES', etc
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    __table_args__ = (UniqueConstraint('pokemon_id', 'flavor_en', 'lang', name='_pokemon_flavor_lang_uc'),)
