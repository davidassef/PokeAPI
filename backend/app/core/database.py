"""
Configuração do banco de dados SQLAlchemy.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Engine do SQLAlchemy com configurações de pool otimizadas
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},  # Para SQLite
    pool_size=20,  # Aumentar pool de conexões
    max_overflow=30,  # Permitir mais conexões extras
    pool_timeout=60,  # Timeout maior para obter conexão
    pool_recycle=3600,  # Reciclar conexões a cada hora
    pool_pre_ping=True,  # Verificar conexões antes de usar
    echo=False  # Desabilitar logs SQL para performance
)

# Session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os modelos
Base = declarative_base()


def get_db():
    """Dependency para obter sessão do banco de dados."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
