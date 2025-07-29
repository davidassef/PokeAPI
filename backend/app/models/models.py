"""
Modelos do banco de dados para o sistema PokeAPI_SYNC.

Este módulo define todas as entidades do banco de dados utilizando SQLAlchemy ORM,
incluindo modelos para usuários, Pokémons favoritos, rankings e traduções.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from enum import Enum


class UserRole(str, Enum):
    """
    Enumeração dos níveis de acesso de usuário no sistema.

    Attributes:
        VISITOR: Usuário não autenticado com acesso limitado
        USER: Usuário padrão com acesso completo às funcionalidades básicas
        ADMINISTRATOR: Usuário com privilégios administrativos completos
    """
    VISITOR = "visitor"
    USER = "user"
    ADMINISTRATOR = "administrator"


class User(Base):
    """
    Modelo de usuário do sistema.

    Representa um usuário registrado no sistema com suas informações pessoais,
    credenciais de acesso e configurações de segurança.

    Attributes:
        id: Identificador único do usuário
        email: Endereço de email único para login
        password_hash: Hash da senha do usuário (bcrypt)
        name: Nome completo do usuário
        contact: Informação de contato opcional (telefone, WhatsApp, etc.)
        security_question: Pergunta de segurança para recuperação de senha
        security_answer_hash: Hash da resposta da pergunta de segurança
        role: Nível de acesso do usuário (UserRole)
        is_active: Status ativo/inativo da conta
        created_at: Data e hora de criação da conta
        updated_at: Data e hora da última atualização
        last_login: Data e hora do último login
        favorites: Relacionamento com Pokémons favoritos do usuário
    """

    __tablename__ = "users"

    # Campos principais
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)

    # Campos opcionais de contato e segurança
    contact = Column(String(100), nullable=True)
    security_question = Column(String(50), nullable=True)
    security_answer_hash = Column(String(255), nullable=True)

    # Controle de acesso e status
    role = Column(String(20), default=UserRole.USER.value, nullable=False)
    is_active = Column(Boolean, default=True)

    # Campos de auditoria temporal
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relacionamentos ORM
    favorites = relationship("FavoritePokemon", back_populates="user")


class FavoritePokemon(Base):
    """
    Modelo para Pokémons favoritos dos usuários.

    Representa a relação many-to-many entre usuários e Pokémons favoritos,
    permitindo que cada usuário tenha uma lista personalizada de Pokémons favoritos.

    Attributes:
        id: Identificador único do registro de favorito
        user_id: Referência ao usuário proprietário do favorito
        pokemon_id: ID do Pokémon na PokeAPI (1-1010+)
        pokemon_name: Nome do Pokémon para facilitar consultas
        added_at: Data e hora quando o Pokémon foi favoritado
        user: Relacionamento com o modelo User
    """

    __tablename__ = "favorite_pokemons"

    # Campos principais
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pokemon_id = Column(Integer, nullable=False)
    pokemon_name = Column(String(100), nullable=False)

    # Campo de auditoria temporal
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos ORM
    user = relationship("User", back_populates="favorites")


class PokemonRanking(Base):
    """
    Modelo para ranking global de Pokémons mais favoritados.

    Mantém um cache otimizado do ranking dos Pokémons mais populares
    baseado na contagem de favoritos de todos os usuários.

    Attributes:
        id: Identificador único do registro de ranking
        pokemon_id: ID único do Pokémon na PokeAPI
        pokemon_name: Nome do Pokémon para facilitar consultas
        favorite_count: Número total de vezes que foi favoritado
        last_updated: Data e hora da última atualização do ranking
    """

    __tablename__ = "pokemon_rankings"

    # Campos principais
    id = Column(Integer, primary_key=True, index=True)
    pokemon_id = Column(Integer, unique=True, nullable=False)
    pokemon_name = Column(String(100), nullable=False)
    favorite_count = Column(Integer, default=0)

    # Campo de auditoria temporal
    last_updated = Column(DateTime(timezone=True), server_default=func.now())


class PokemonFlavorTranslation(Base):
    """
    Modelo para cache persistente de traduções de descrições de Pokémon.

    Armazena traduções de flavor texts (descrições) dos Pokémons para evitar
    chamadas repetidas à API de tradução e melhorar a performance.

    Attributes:
        id: Identificador único da tradução
        pokemon_id: ID do Pokémon na PokeAPI
        flavor_en: Texto original em inglês
        flavor_translated: Texto traduzido para o idioma especificado
        lang: Código do idioma de destino (pt-BR, es-ES, etc.)
        updated_at: Data e hora da última atualização da tradução
    """

    __tablename__ = "pokemon_flavor_translation"

    # Campos principais
    id = Column(Integer, primary_key=True, index=True)
    pokemon_id = Column(Integer, index=True)
    flavor_en = Column(Text, nullable=False)
    flavor_translated = Column(Text, nullable=False)
    lang = Column(String(10), nullable=False)

    # Campo de auditoria temporal
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Constraint para evitar traduções duplicadas
    __table_args__ = (
        UniqueConstraint('pokemon_id', 'flavor_en', 'lang', name='_pokemon_flavor_lang_uc'),
    )
