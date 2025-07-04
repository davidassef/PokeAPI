"""
Aplicação principal FastAPI - PokeAPI Backend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine
from app.models.models import Base
from app.routes import users, favorites, ranking, pokemon, sync_capture
from app.services.pokeapi_service import pokeapi_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação."""
    # Startup
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    await pokeapi_service.close()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend API para aplicativo Pokédex com Ionic + Angular",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://pokeapi-frontend.onrender.com",
        "http://localhost:8100",  # Para desenvolvimento local Ionic
        "http://localhost:4200"   # Para desenvolvimento local Angular
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Incluir rotas
app.include_router(users.router, prefix="/api/v1")
app.include_router(favorites.router, prefix="/api/v1")
app.include_router(ranking.router, prefix="/api/v1")
app.include_router(pokemon.router, prefix="/api/v1")
app.include_router(sync_capture.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Endpoint raiz da API."""
    return {
        "message": f"🚀 {settings.app_name} v{settings.app_version}",
        "status": "online",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """Health check da API."""
    return {"status": "healthy", "version": settings.app_version}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
