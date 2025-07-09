"""
Rotas da API para ranking de Pokémons.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.schemas import PokemonRanking
from app.services.favorite_service import FavoriteService

router = APIRouter(prefix="/ranking", tags=["ranking"])


@router.get("/", response_model=List[PokemonRanking])
def get_pokemon_ranking(limit: int = 10, db: Session = Depends(get_db)):
    """Busca ranking dos Pokémons mais capturados."""
    return FavoriteService.get_ranking(db, limit=limit)


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Busca estatísticas gerais do ranking baseado em capturas."""
    return FavoriteService.get_stats(db)


@router.get("/local")
def get_local_ranking(region: str = Query(...)):
    """Endpoint local de ranking (mock inicial)."""
    return []


@router.get("/debug/favorites")
async def debug_favorites(db: Session = Depends(get_db)):
    """Endpoint temporário para depuração da tabela de favoritos"""
    from app.models.models import FavoritePokemon
    favorites = db.query(FavoritePokemon).all()
    return {
        "count": len(favorites),
        "favorites": [
            {
                "id": fav.id,
                "user_id": fav.user_id,
                "pokemon_id": fav.pokemon_id,
                "pokemon_name": fav.pokemon_name,
                "added_at": fav.added_at.isoformat() if fav.added_at else None
            }
            for fav in favorites
        ]
    }
