"""
Aplicação principal FastAPI - PokeAPI Backend.
"""
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
from contextlib import asynccontextmanager

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação."""
    # Startup
    try:
        from app.services.pull_sync_scheduler import pull_scheduler
        await pull_scheduler.start()
        print("🔄 Scheduler de pull sync iniciado")
    except Exception as e:
        print(f"❌ Erro ao iniciar scheduler: {e}")

    yield

    # Shutdown
    try:
        from app.services.pull_sync_scheduler import pull_scheduler
        await pull_scheduler.stop()
        print("🛑 Scheduler de pull sync parado")
    except Exception as e:
        print(f"❌ Erro ao parar scheduler: {e}")


# Configuração básica
app = FastAPI(
    title="PokeAPI Backend",
    version="1.0.0",
    description="Backend API para aplicativo Pokédex com Ionic + Angular",
    lifespan=lifespan
)

# Middleware para logging de requisições


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    # Log da requisição
    logger.info(f"🔍 {request.method} {request.url}")
    logger.info(f"📋 Headers: {dict(request.headers)}")

    response = await call_next(request)

    # Log da resposta
    process_time = time.time() - start_time
    logger.info(f"✅ {request.method} {request.url} - Status: {response.status_code} - Time: {process_time:.2f}s")

    return response

# CORS Configuration
# Lista de origens permitidas (ajuste conforme necessário para seu ambiente)
origins = [
    "http://localhost:4200",  # Angular
    "http://localhost:8100",  # Ionic
    "http://localhost:8080",  # Outros servidores locais
    "http://localhost",
    "https://your-production-domain.com",
]

# Adiciona o middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Lista de origens permitidas
    allow_credentials=True,  # Permite credenciais (cookies, headers de autenticação)
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Métodos permitidos
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With"
    ],  # Headers permitidos
    expose_headers=["Content-Disposition"],  # Headers expostos
    max_age=600,  # Tempo de cache para pré-voo (em segundos)
)

# Imports tardios para evitar problemas de inicialização
try:
    from app.core.database import engine
    from app.models.models import Base
    from app.routes import users, favorites, ranking, pokemon, sync_capture, admin, pull_sync, auth

    # Criar tabelas vazias (sem dados iniciais)
    # Em produção, o banco é criado vazio e alimentado apenas pelo frontend
    Base.metadata.create_all(bind=engine)

    # Incluir rotas
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(users.router, prefix="/api/v1")
    app.include_router(favorites.router, prefix="/api/v1")
    app.include_router(ranking.router, prefix="/api/v1")
    app.include_router(pokemon.router, prefix="/api/v1")
    app.include_router(sync_capture.router, prefix="/api/v1")
    app.include_router(admin.router, prefix="/api/v1")
    app.include_router(pull_sync.router, prefix="/api/v1")

except (ImportError, ModuleNotFoundError, AttributeError) as e:
    print(f"Warning: Error importing modules: {e}")
    # Continua a execução sem os módulos de rotas se houver erro


@app.get("/")
async def root():
    """Endpoint raiz da API."""
    return {
        "message": "🚀 PokeAPI Backend v1.0.0",
        "status": "online",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """Health check da API."""
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/api/test-frontend")
async def test_frontend_connection():
    """Endpoint específico para testar conexão do frontend."""
    return {
        "message": "Frontend conectado com sucesso!",
        "backend_url": "https://pokeapi-la6k.onrender.com",
        "frontend_url": "https://pokeapi-frontend.onrender.com",
        "status": "connected",
        "timestamp": "2025-07-05T01:15:00Z"
    }


@app.get("/api/database-status")
async def database_status():
    """Verifica o status do banco de dados sem popular dados."""
    try:
        from app.core.database import get_db
        from app.models.models import User, PokemonRanking

        db = next(get_db())

        # Contar registros existentes
        user_count = db.query(User).count()
        ranking_count = db.query(PokemonRanking).count()

        return {
            "message": "Status do banco de dados",
            "status": "success",
            "data": {
                "users": user_count,
                "rankings": ranking_count,
                "is_empty": user_count == 0 and ranking_count == 0
            }
        }
    except (ImportError, AttributeError, TypeError) as e:
        return {"message": f"Erro ao verificar status: {str(e)}", "status": "error"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
