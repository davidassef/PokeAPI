"""
Configuração do banco de dados SQLAlchemy.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Engine do SQLAlchemy com configurações otimizadas e persistência
database_url = settings.get_database_url
print(f"🔍 Usando banco de dados: {database_url}")

# Configurações específicas por tipo de banco
if "sqlite" in database_url:
    # SQLite - configurações otimizadas
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False},
        pool_size=20,
        max_overflow=30,
        pool_timeout=60,
        pool_recycle=3600,
        pool_pre_ping=True,
        echo=False
    )
else:
    # PostgreSQL/MySQL - configurações para bancos externos
    engine = create_engine(
        database_url,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True,
        echo=False
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
