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


@app.post("/admin/reset-database")
async def reset_database():
    """ADMIN: Limpa e recria todas as tabelas do banco de dados."""
    try:
        from app.core.database import engine
        from app.models.models import Base
        
        # Drop todas as tabelas
        Base.metadata.drop_all(bind=engine)
        # Recria todas as tabelas
        Base.metadata.create_all(bind=engine)
        
        return {"message": "Database resetado com sucesso", "status": "success"}
    except Exception as e:
        return {"message": f"Erro ao resetar database: {str(e)}", "status": "error"}


@app.post("/admin/seed-data")
async def seed_initial_data():
    """ADMIN: Popula dados iniciais no banco de dados."""
    try:
        from app.core.database import get_db
        from app.models.models import User, Ranking
        
        db = next(get_db())
        
        # Criar usuário padrão se não existir
        existing_user = db.query(User).filter(User.email == "admin@pokeapi.com").first()
        if not existing_user:
            default_user = User(
                username="admin",
                email="admin@pokeapi.com"
            )
            db.add(default_user)
            db.commit()
            db.refresh(default_user)
        else:
            default_user = existing_user
        
        # Adicionar alguns favoritos/ranking iniciais populares
        popular_pokemon_list = [
            {"pokemon_id": 25, "pokemon_name": "pikachu"},
            {"pokemon_id": 6, "pokemon_name": "charizard"},
            {"pokemon_id": 150, "pokemon_name": "mewtwo"},
            {"pokemon_id": 144, "pokemon_name": "articuno"},
            {"pokemon_id": 1, "pokemon_name": "bulbasaur"},
            {"pokemon_id": 4, "pokemon_name": "charmander"},
            {"pokemon_id": 7, "pokemon_name": "squirtle"},
            {"pokemon_id": 39, "pokemon_name": "jigglypuff"},
            {"pokemon_id": 94, "pokemon_name": "gengar"},
            {"pokemon_id": 130, "pokemon_name": "gyarados"}
        ]
        
        for i, poke_data in enumerate(popular_pokemon_list):
            # Criar entrada de ranking se não existir
            existing_ranking = db.query(Ranking).filter(
                Ranking.pokemon_id == poke_data["pokemon_id"]
            ).first()
            
            if not existing_ranking:
                ranking_entry = Ranking(
                    pokemon_id=poke_data["pokemon_id"],
                    pokemon_name=poke_data["pokemon_name"],
                    favorite_count=10 - i  # Começar com contagens decrescentes
                )
                db.add(ranking_entry)
        
        db.commit()
        
        return {
            "message": "Dados iniciais populados com sucesso",
            "status": "success",
            "data": {
                "user_created": default_user.username,
                "pokemon_seeded": len(popular_pokemon_list)
            }
        }
    except Exception as e:
        return {"message": f"Erro ao popular dados: {str(e)}", "status": "error"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
