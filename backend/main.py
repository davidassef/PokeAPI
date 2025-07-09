"""
Aplicação principal FastAPI - PokeAPI Backend.
"""
import logging
import os
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
from contextlib import asynccontextmanager

# Configurar logging
log_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(log_dir, exist_ok=True)

# Configuração do logger principal
log_filename = f'app_{datetime.now().strftime("%Y%m%d")}.log'
log_file = os.path.join(log_dir, log_filename)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# Desativar logs de bibliotecas externas
logging.getLogger('passlib').setLevel(logging.WARNING)
logging.getLogger('sqlalchemy').setLevel(logging.WARNING)
logging.getLogger('uvicorn').setLevel(logging.WARNING)
logging.getLogger('fastapi').setLevel(logging.WARNING)

logger = logging.getLogger(__name__)
logger.info("Iniciando aplicação FastAPI")


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
    """Middleware para log detalhado de requisições e respostas."""
    request_id = f"{time.time():.0f}-{os.urandom(4).hex()}"
    start_time = time.time()
    
    # Log da requisição
    logger.info(
        "[%s] %s %s\nHeaders: %s\nQuery Params: %s",
        request_id,
        request.method,
        request.url,
        {k: v for k, v in request.headers.items() 
         if k.lower() not in ['authorization']},
        dict(request.query_params)
    )
    
    # Capturar o corpo da requisição se for POST/PUT
    if request.method in ("POST", "PUT"):
        body = await request.body()
        if body:
            try:
                logger.debug(
                    "[%s] Request Body: %s", 
                    request_id, 
                    body.decode()
                )
            except UnicodeDecodeError:
                logger.debug("[%s] Request Body: <binary data>", request_id)
    
    try:
        response = await call_next(request)
    except Exception as e:
        logger.exception(
            "[%s] Erro ao processar requisição: %s",
            request_id,
            str(e)
        )
        raise
    
    # Log da resposta
    process_time = (time.time() - start_time) * 1000
    
    # Log detalhado para erros 4xx/5xx
    if response.status_code >= 400:
        logger.warning(
            "[%s] %s %s - Status: %d - Time: %.2fms",
            request_id,
            request.method,
            request.url,
            response.status_code,
            process_time
        )
    else:
        logger.info(
            "[%s] %s %s - Status: %d - Time: %.2fms",
            request_id,
            request.method,
            request.url,
            response.status_code,
            process_time
        )
    
    return response

# CORS Configuration
# Lista de origens permitidas (ajuste conforme necessário para seu ambiente)
origins = [
    "http://localhost:4200",  # Angular
    "http://localhost:8100",  # Ionic
    "http://localhost:8080",  # Outros servidores locais
    "http://localhost",
    "http://127.0.0.1:8100",  # Ionic (alternativo)
    "http://localhost:5173",   # Vite/React
    "https://your-production-domain.com",
]

# Adiciona o middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos
    allow_headers=[
        "*",  # Permite todos os headers
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
        "X-CSRF-Token",
        "Access-Control-Allow-Origin",
    ],
    expose_headers=[
        "Content-Disposition",
        "Content-Length",
        "X-Request-ID",
    ],
    max_age=86400,  # 24 horas
)

# Adiciona headers CORS manualmente para garantir compatibilidade


@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    """Adiciona headers CORS manualmente para garantir compatibilidade."""
    origin = request.headers.get("origin")
    
    # Verifica se a origem está na lista de origens permitidas
    if origin and any(origin.startswith(allowed) for allowed in origins):
        response = await call_next(request)
        
        # Adiciona headers CORS
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        
        return response
    
    return await call_next(request)

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
