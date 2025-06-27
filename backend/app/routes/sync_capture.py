"""
Rota para sincronização de capturas/favoritos vindos do frontend offline.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import FavoritePokemonCreate, Message
from app.services.favorite_service import FavoriteService

router = APIRouter(prefix="/sync-capture", tags=["sync-capture"])

@router.post("/", response_model=Message)
def sync_capture(action: dict, db: Session = Depends(get_db)):
    """Sincroniza captura/favorito enviada pelo frontend."""
    # Espera: {pokemonId, action, timestamp, payload}
    try:
        user_id = action.get("user_id", 1)  # Padrão: 1
        pokemon_id = action["pokemonId"]
        pokemon_name = action.get("pokemonName") or action.get("pokemon_name") or ""
        if not pokemon_id:
            raise ValueError("pokemonId é obrigatório")
        # Se for captura/favorito, adiciona
        if action["action"] in ("capture", "favorite") and not action.get("payload", {}).get("removed"):
            fav = FavoritePokemonCreate(user_id=user_id, pokemon_id=pokemon_id, pokemon_name=pokemon_name)
            FavoriteService.add_favorite(db, fav)
            return Message(message="Sincronizado com sucesso")
        # Se for remoção
        elif action["action"] in ("capture", "favorite") and action.get("payload", {}).get("removed"):
            FavoriteService.remove_favorite(db, user_id, pokemon_id)
            return Message(message="Removido com sucesso")
        else:
            raise ValueError("Ação não suportada")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
