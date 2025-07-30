"""
Módulo de configuração do banco de dados SQLAlchemy para o sistema PokeAPI_SYNC.

Este módulo configura a conexão com o banco de dados, criando o engine SQLAlchemy
com otimizações específicas para diferentes tipos de bancos (SQLite, PostgreSQL, MySQL).
Também define a sessão do banco de dados e fornece uma dependência FastAPI para
injeção de dependências.

Funcionalidades:
- Configuração automática de engine baseada no tipo de banco
- Otimizações de pool de conexões para diferentes ambientes
- Sessão thread-safe para operações de banco de dados
- Dependência FastAPI para injeção de sessão do banco

Configurações:
- SQLite: Otimizado para desenvolvimento local com threading habilitado
- PostgreSQL/MySQL: Configurações para produção com pool de conexões
- Logging desabilitado por padrão (echo=False)

Exemplo de uso:
    ```python
    from fastapi import Depends, FastAPI
    from sqlalchemy.orm import Session
    from app.core.database import get_db, Base
    
    app = FastAPI()
    
    @app.get("/users")
    async def get_users(db: Session = Depends(get_db)):
        return db.query(User).all()
    ```
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Engine do SQLAlchemy com configurações otimizadas e persistência
# URL de conexão com o banco de dados obtida das configurações
database_url = settings.get_database_url
print(f"🔍 Usando banco de dados: {database_url}")

# Configurações específicas por tipo de banco de dados
# SQLite: Configurações otimizadas para desenvolvimento local
# - check_same_thread=False: Permite uso em threads diferentes (necessário para FastAPI)
# - pool_size=20: Número de conexões mantidas no pool
# - max_overflow=30: Número máximo de conexões temporárias acima do pool_size
# - pool_timeout=60: Tempo máximo de espera por uma conexão
# - pool_recycle=3600: Recicla conexões após 1 hora para evitar timeouts
# - pool_pre_ping=True: Verifica conexões antes de usar
# - echo=False: Desabilita logging SQL para performance
if "sqlite" in database_url:
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
    # PostgreSQL/MySQL: Configurações otimizadas para produção
    # Valores mais conservadores para ambientes externos
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
# Factory para criar sessões do banco de dados com configurações padrão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os modelos
# Classe base que todos os modelos SQLAlchemy devem herdar
Base = declarative_base()


def get_db():
    """Dependência FastAPI para obter sessão do banco de dados.

    Esta função é uma dependência do FastAPI que cria e fornece uma sessão
    do SQLAlchemy para cada requisição, garantindo que a sessão seja
    corretamente fechada após o uso através do gerenciador de contexto.

    Yields:
        Session: Sessão SQLAlchemy configurada para operações de banco de dados
                com transações automáticas (autocommit=False) e autoflush desabilitado

    Usage:
        ```python
        from fastapi import Depends, FastAPI
        from sqlalchemy.orm import Session
        from app.core.database import get_db
        
        app = FastAPI()
        
        @app.post("/users")
        async def create_user(user_data: dict, db: Session = Depends(get_db)):
            # db é uma sessão válida e será fechada automaticamente
            new_user = User(**user_data)
            db.add(new_user)
            db.commit()
            return new_user
        ```

    Notes:
        - A sessão é criada no início da requisição e fechada automaticamente
        - Usa yield para compatibilidade com gerenciadores de contexto do FastAPI
        - Configurado com autocommit=False para controle manual de transações
        - Autoflush=False para melhor performance em operações em lote
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
