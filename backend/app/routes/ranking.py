"""
Rotas da API para ranking de Pokémons.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
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


# REMOVED: Mock and debug endpoints for security
