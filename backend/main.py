"""
Aplicação principal FastAPI - PokeAPI Backend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configuração básica
app = FastAPI(
    title="PokeAPI Backend",
    version="1.0.0",
    description="Backend API para aplicativo Pokédex com Ionic + Angular"
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

# Imports tardios para evitar problemas de inicialização
try:
    from app.core.database import engine
    from app.models.models import Base
    from app.routes import users, favorites, ranking, pokemon, sync_capture
    
    # Criar tabelas
    Base.metadata.create_all(bind=engine)
    
    # Incluir rotas
    app.include_router(users.router, prefix="/api/v1")
    app.include_router(favorites.router, prefix="/api/v1")
    app.include_router(ranking.router, prefix="/api/v1")
    app.include_router(pokemon.router, prefix="/api/v1")
    app.include_router(sync_capture.router, prefix="/api/v1")
    
except Exception as e:
    print(f"Warning: Error importing modules: {e}")


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
