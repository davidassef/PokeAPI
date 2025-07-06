"""
Rotas da API para favoritos.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import get_current_active_user
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
def check_favorite(pokemon_id: int,
                   db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_active_user)):
    """Verifica se Pokémon é favorito do usuário atual."""
    is_favorite = FavoriteService.is_favorite(db, current_user.id, pokemon_id)
    return {"is_favorite": is_favorite}


# Manter rotas públicas para compatibilidade (podem ser removidas posteriormente)
@router.get("/user/{user_id}", response_model=List[FavoritePokemon])
def get_user_favorites_public(user_id: int, db: Session = Depends(get_db)):
    """Busca favoritos do usuário (rota pública para compatibilidade)."""
    return FavoriteService.get_user_favorites(db, user_id)


@router.get("/check/{user_id}/{pokemon_id}")
def check_favorite_public(user_id: int, pokemon_id: int,
                          db: Session = Depends(get_db)):
    """Verifica se Pokémon é favorito do usuário (rota pública para compatibilidade)."""
    is_favorite = FavoriteService.is_favorite(db, user_id, pokemon_id)
    return {"is_favorite": is_favorite}
