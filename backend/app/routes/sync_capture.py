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

        # Buscar nome do pokémon no payload primeiro, depois nas chaves diretas
        payload = action.get("payload", {})
        pokemon_name = (
            payload.get("pokemonName") or
            action.get("pokemonName") or
            action.get("pokemon_name") or
            f"pokemon_{pokemon_id}"
        )

        if not pokemon_id:
            raise ValueError("pokemonId é obrigatório")

        print(f"[SYNC] Recebido: pokemonId={pokemon_id}, action={action['action']}, name={pokemon_name}, payload={payload}")

        # Se for captura/favorito, adiciona
        if action["action"] in ("capture", "favorite") and not payload.get("removed"):
            fav = FavoritePokemonCreate(user_id=user_id, pokemon_id=pokemon_id, pokemon_name=pokemon_name)
            result = FavoriteService.add_favorite(db, fav)
            print(f"[SYNC] Adicionado: {result.pokemon_name} (ID: {result.pokemon_id})")
            return Message(message="Sincronizado com sucesso")

        # Se for remoção
        elif action["action"] in ("capture", "favorite") and payload.get("removed"):
            success = FavoriteService.remove_favorite(db, user_id, pokemon_id)
            print(f"[SYNC] Removido: {pokemon_name} (ID: {pokemon_id}) - Success: {success}")
            return Message(message="Removido com sucesso")
        else:
            raise ValueError("Ação não suportada")
    except Exception as e:
        print(f"[SYNC] Erro: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
