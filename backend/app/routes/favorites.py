"""
Rotas da API para favoritos.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.schemas import FavoritePokemon, FavoritePokemonCreate, Message
from app.services.favorite_service import FavoriteService

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.post("/", response_model=FavoritePokemon, status_code=status.HTTP_201_CREATED)
def add_favorite(favorite: FavoritePokemonCreate, db: Session = Depends(get_db)):
    """Adiciona Pokémon aos favoritos."""
    return FavoriteService.add_favorite(db, favorite)


@router.delete("/{user_id}/{pokemon_id}", response_model=Message)
def remove_favorite(user_id: int, pokemon_id: int, db: Session = Depends(get_db)):
    """Remove Pokémon dos favoritos."""
    if not FavoriteService.remove_favorite(db, user_id, pokemon_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorito não encontrado"
        )
    return Message(message="Pokémon removido dos favoritos")


@router.get("/user/{user_id}", response_model=List[FavoritePokemon])
def get_user_favorites(user_id: int, db: Session = Depends(get_db)):
    """Busca favoritos do usuário."""
    return FavoriteService.get_user_favorites(db, user_id)


@router.get("/check/{user_id}/{pokemon_id}")
def check_favorite(user_id: int, pokemon_id: int, db: Session = Depends(get_db)):
    """Verifica se Pokémon é favorito do usuário."""
    is_favorite = FavoriteService.is_favorite(db, user_id, pokemon_id)
    return {"is_favorite": is_favorite}
