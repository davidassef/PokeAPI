"""
Rota para sincronização de capturas/favoritos vindos do frontend offline.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from core.database import get_db
from app.schemas.schemas import FavoritePokemonCreate, Message, SyncCaptureRequest, SyncBatchRequest, SyncBatchResponse
from app.services.favorite_service import FavoriteService
from app.utils.rate_limiter import check_sync_rate_limit, check_batch_rate_limit

router = APIRouter(prefix="/sync-capture", tags=["sync-capture"])


@router.post("/", response_model=Message)
def sync_capture(action: SyncCaptureRequest, request: Request, db: Session = Depends(get_db)):
    """Sincroniza captura/favorito enviada pelo frontend."""
    # Rate limiting
    client_ip = request.client.host
    if not check_sync_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit excedido. Tente novamente em alguns minutos."
        )
    try:
        user_id = action.user_id
        pokemon_id = action.pokemonId

        # Buscar nome do pokémon no payload primeiro
        pokemon_name = ""
        if action.payload and action.payload.pokemonName:
            pokemon_name = action.payload.pokemonName
        else:
            pokemon_name = f"pokemon_{pokemon_id}"

        print(f"[SYNC] Recebido: pokemonId={pokemon_id}, action={action.action}, name={pokemon_name}, payload={action.payload}")

        # Se for captura/favorito, adiciona
        if action.action in ("capture", "favorite") and not (action.payload and action.payload.removed):
            fav = FavoritePokemonCreate(user_id=user_id, pokemon_id=pokemon_id, pokemon_name=pokemon_name)
            result = FavoriteService.add_favorite(db, fav)
            print(f"[SYNC] Adicionado: {result.pokemon_name} (ID: {result.pokemon_id})")
            return Message(message="Sincronizado com sucesso")

        # Se for remoção
        elif action.action in ("capture", "favorite") and action.payload and action.payload.removed:
            success = FavoriteService.remove_favorite(db, user_id, pokemon_id)
            print(f"[SYNC] Removido: {pokemon_name} (ID: {pokemon_id}) - Success: {success}")
            return Message(message="Removido com sucesso")
        else:
            raise ValueError("Ação não suportada")
    except Exception as e:
        print(f"[SYNC] Erro: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/batch", response_model=SyncBatchResponse)
def sync_batch(batch: SyncBatchRequest, request: Request, db: Session = Depends(get_db)):
    """Sincroniza múltiplas capturas/favoritos em lote."""
    # Rate limiting para batches
    client_ip = request.client.host
    if not check_batch_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit para batches excedido. Tente novamente em alguns minutos."
        )
    import uuid

    batch_id = batch.batch_id or str(uuid.uuid4())
    processed_count = 0
    failed_count = 0
    errors = []

    print(f"[SYNC_BATCH] Processando lote {batch_id} com {len(batch.requests)} itens")

    for request in batch.requests:
        try:
            user_id = request.user_id
            pokemon_id = request.pokemonId

            # Buscar nome do pokémon no payload primeiro
            pokemon_name = ""
            if request.payload and request.payload.pokemonName:
                pokemon_name = request.payload.pokemonName
            else:
                pokemon_name = f"pokemon_{pokemon_id}"

            # Se for captura/favorito, adiciona
            if request.action in ("capture", "favorite") and not (request.payload and request.payload.removed):
                fav = FavoritePokemonCreate(user_id=user_id, pokemon_id=pokemon_id, pokemon_name=pokemon_name)
                result = FavoriteService.add_favorite(db, fav)
                processed_count += 1
                print(f"[SYNC_BATCH] Adicionado: {result.pokemon_name} (ID: {result.pokemon_id})")

            # Se for remoção
            elif request.action in ("capture", "favorite") and request.payload and request.payload.removed:
                success = FavoriteService.remove_favorite(db, user_id, pokemon_id)
                processed_count += 1
                print(f"[SYNC_BATCH] Removido: {pokemon_name} (ID: {pokemon_id}) - Success: {success}")
            else:
                failed_count += 1
                errors.append(f"Ação não suportada para pokemon_id {pokemon_id}")

        except Exception as e:
            failed_count += 1
            error_msg = f"Erro ao processar pokemon_id {request.pokemonId}: {str(e)}"
            errors.append(error_msg)
            print(f"[SYNC_BATCH] {error_msg}")

    print(f"[SYNC_BATCH] Lote {batch_id} concluído: {processed_count} sucesso, {failed_count} erros")

    return SyncBatchResponse(
        success=failed_count == 0,
        processed_count=processed_count,
        failed_count=failed_count,
        errors=errors,
        batch_id=batch_id
    )
