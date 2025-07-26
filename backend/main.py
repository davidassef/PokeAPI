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

    # Log básico sem consumir o corpo da requisição (evita travamento)
    if request.method in ("POST", "PUT"):
        logger.debug(
            "[%s] Request Body: <não logado para evitar consumir stream>",
            request_id
        )

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
    # ✅ CORREÇÃO CRÍTICA: Adicionar domínio da Vercel
    "https://poke-api-mauve.vercel.app",  # Frontend Vercel
    "https://your-production-domain.com",  # Placeholder para outros domínios
]

# ✅ CORREÇÃO CRÍTICA: CORS otimizado para Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Métodos específicos
    allow_headers=[
        "*",  # Permite todos os headers
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
        "X-CSRF-Token",
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Methods",
        "Cache-Control",
        "Pragma",
    ],
    expose_headers=[
        "Content-Disposition",
        "Content-Length",
        "X-Request-ID",
        "Access-Control-Allow-Origin",
    ],
    max_age=86400,  # 24 horas
)

# CORS duplicado removido - usando apenas CORSMiddleware do FastAPI

# Imports tardios para evitar problemas de inicialização
try:
    from app.core.database import engine
    from app.models.models import Base
    from app.routes import favorites, ranking, pokemon, sync_capture, admin, pull_sync, auth, pokemon_management

    # Criar tabelas vazias (sem dados iniciais)
    # Em produção, o banco é criado vazio e alimentado apenas pelo frontend
    Base.metadata.create_all(bind=engine)

    # Criar usuários de teste em produção
    try:
        from app.services.auth_service import auth_service
        from app.schemas.auth_schemas import UserCreate
        from app.core.database import SessionLocal

        db = SessionLocal()

        # Usuários de teste para demonstração
        test_users = [
            {
                "name": "Usuário Teste Principal",
                "email": "teste@teste.com",
                "password": "Teste123",
                "security_question": "Qual é o seu Pokémon favorito?",
                "security_answer": "pikachu"
            },
            {
                "name": "Usuário Teste Secundário",
                "email": "teste2@teste.com",
                "password": "Teste123",
                "security_question": "Qual é o seu Pokémon favorito?",
                "security_answer": "charizard"
            }
        ]

        for user_info in test_users:
            existing_user = auth_service.get_user_by_email(db, user_info['email'])
            if not existing_user:
                user_data = UserCreate(
                    name=user_info['name'],
                    email=user_info['email'],
                    password=user_info['password'],
                    security_question=user_info['security_question'],
                    security_answer=user_info['security_answer']
                )
                auth_service.create_user(db, user_data)
                print(f"✅ Usuário de teste criado: {user_info['email']}")

        db.close()
    except Exception as e:
        print(f"⚠️ Erro ao criar usuários de teste: {e}")
        # Não falhar a aplicação por causa dos usuários de teste

    # Incluir rotas
    app.include_router(auth.router, prefix="/api/v1/auth")
    app.include_router(favorites.router, prefix="/api/v1")
    app.include_router(ranking.router, prefix="/api/v1")
    app.include_router(pokemon.router, prefix="/api/v1")
    app.include_router(pokemon_management.router, prefix="/api/v1")  # Rotas RBAC de Pokemon
    app.include_router(sync_capture.router, prefix="/api/v1")
    app.include_router(admin.router, prefix="/api/v1")
    app.include_router(pull_sync.router, prefix="/api/v1")

    # ✅ NOVO: Rotas de monitoramento de integridade de dados
    from app.routes import data_integrity
    app.include_router(data_integrity.router, prefix="/api/v1/data-integrity")

except (ImportError, ModuleNotFoundError, AttributeError) as e:
    print(f"❌ ERRO CRÍTICO: Falha ao importar rotas: {e}")
    import traceback
    traceback.print_exc()
    # ✅ CORREÇÃO CRÍTICA: Não continuar sem rotas - isso causa falha silenciosa
    raise RuntimeError(f"Falha crítica na inicialização das rotas: {e}") from e


@app.get("/")
async def root():
    """Endpoint raiz da API."""
    return {
        "message": "🚀 PokeAPI Backend v1.5",
        "status": "online",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """Health check da API."""
    return {"status": "healthy", "version": "1.5"}


@app.get("/cors-test")
async def cors_test():
    """✅ CORREÇÃO CRÍTICA: Endpoint para testar CORS com Vercel."""
    return {
        "message": "CORS funcionando!",
        "timestamp": "2025-07-23T16:10:00Z",
        "origin": "backend-render",
        "cors_enabled": True,
        "vercel_compatible": True
    }


# REMOVED: Test endpoints for security


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
