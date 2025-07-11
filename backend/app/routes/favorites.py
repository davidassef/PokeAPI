"""
Rotas da API para favoritos.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.auth import get_current_active_user
from app.models.models import User
from app.schemas.schemas import FavoritePokemon, FavoritePokemonCreate, Message
from app.services.favorite_service import FavoriteService

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.post("/", response_model=FavoritePokemon,
             status_code=status.HTTP_201_CREATED)
def add_favorite(favorite: FavoritePokemonCreate,
                 db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_active_user)):
    """Adiciona Pokémon aos favoritos do usuário atual."""
    # Usar o ID do usuário autenticado
    favorite.user_id = current_user.id
    return FavoriteService.add_favorite(db, favorite)


@router.delete("/{pokemon_id}", response_model=Message)
def remove_favorite(pokemon_id: int,
                    db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_active_user)):
    """Remove Pokémon dos favoritos do usuário atual."""
    if not FavoriteService.remove_favorite(db, current_user.id, pokemon_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorito não encontrado"
        )
    return Message(message="Pokémon removido dos favoritos")


@router.get("/my-favorites", response_model=List[FavoritePokemon])
def get_my_favorites(db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_active_user)):
    """Busca favoritos do usuário atual."""
    return FavoriteService.get_user_favorites(db, current_user.id)


@router.get("/check/{pokemon_id}")
def check_favorite(
    pokemon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Verifica se Pokémon é favorito do usuário atual."""
    return {
        "is_favorite": FavoriteService.is_favorite(
            db, current_user.id, pokemon_id
        )
    }


@router.post("/check-captured", response_model=dict)
def check_multiple_favorites(
    pokemon_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Verifica quais Pokémons de uma lista estão nos favoritos do usuário.

    Args:
        pokemon_ids: Lista de IDs de Pokémon para verificar

    Returns:
        Dicionário onde as chaves são os IDs dos Pokémons (como strings) e os
        valores são booleanos indicando se estão nos favoritos
    """
    service = FavoriteService()
    return service.check_multiple_favorites(
        db=db,
        user_id=current_user.id,
        pokemon_ids=pokemon_ids
    )


# REMOVED: Legacy public endpoints for security
