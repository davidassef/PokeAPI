"""
Rotas para sistema pull-based de sincronização.
O backend puxa dados dos clientes ao invés de receber push.
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.schemas import (
    PullRequest,
    PullResponse,
    ClientRegistration,
    Message
)
from app.services.pull_sync_service import pull_service
from app.services.pull_sync_scheduler import pull_scheduler

router = APIRouter(prefix="/pull-sync", tags=["pull-sync"])


@router.post("/register-client", response_model=Message)
async def register_client(registration: ClientRegistration):
    """Registra um cliente para sincronização pull."""
    try:
        success = await pull_service.register_client(registration)
        if success:
            return Message(message=f"Cliente registrado com sucesso: {registration.user_id}")
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Falha ao registrar cliente. Verifique a URL e conectividade."
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao registrar cliente: {str(e)}"
        )


@router.delete("/unregister-client/{user_id}", response_model=Message)
async def unregister_client(user_id: str):
    """Remove um cliente do registro de sincronização."""
    success = await pull_service.unregister_client(user_id)
    if success:
        return Message(message=f"Cliente removido com sucesso: {user_id}")
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )


@router.get("/registered-clients", response_model=List[ClientRegistration])
async def get_registered_clients():
    """Lista todos os clientes registrados."""
    return await pull_service.get_registered_clients()


@router.post("/sync-all", response_model=PullResponse)
async def sync_all_clients(
    request: PullRequest = None,
    db: Session = Depends(get_db)
):
    """Sincroniza todos os clientes registrados."""
    try:
        since = request.since if request else None
        return await pull_service.sync_all_clients(db, since)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro na sincronização: {str(e)}"
        )


@router.post("/sync-recent", response_model=PullResponse)
async def sync_recent_changes(db: Session = Depends(get_db)):
    """Sincroniza apenas mudanças recentes (últimos 15 minutos)."""
    try:
        return await pull_service.sync_recent_changes(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro na sincronização: {str(e)}"
        )


@router.post("/sync-all-background")
async def sync_all_background(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Inicia sincronização de todos os clientes em background."""
    background_tasks.add_task(pull_service.sync_all_clients, db)
    return {"message": "Sincronização iniciada em background"}


@router.post("/cleanup-inactive")
async def cleanup_inactive_clients():
    """Remove clientes inativos."""
    try:
        removed_count = await pull_service.cleanup_inactive_clients()
        return {
            "message": "Cleanup concluído",
            "removed_clients": removed_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro no cleanup: {str(e)}"
        )


@router.get("/status")
async def get_pull_sync_status():
    """Retorna status do sistema de pull sync."""
    clients = await pull_service.get_registered_clients()
    return {
        "registered_clients": len(clients),
        "clients": [
            {
                "user_id": client.user_id,
                "client_url": client.client_url,
                "client_type": client.client_type
            }
            for client in clients
        ]
    }


@router.get("/scheduler/status")
async def get_scheduler_status():
    """Retorna status do scheduler."""
    return pull_scheduler.get_status()


@router.post("/scheduler/start")
async def start_scheduler():
    """Inicia o scheduler."""
    try:
        await pull_scheduler.start()
        return {"message": "Scheduler iniciado com sucesso"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao iniciar scheduler: {str(e)}"
        )


@router.post("/scheduler/stop")
async def stop_scheduler():
    """Para o scheduler."""
    try:
        await pull_scheduler.stop()
        return {"message": "Scheduler parado com sucesso"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao parar scheduler: {str(e)}"
        )


@router.post("/scheduler/set-interval")
async def set_sync_interval(interval: int):
    """Define intervalo de sincronização."""
    try:
        pull_scheduler.set_sync_interval(interval)
        return {"message": f"Intervalo alterado para {interval} segundos"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao alterar intervalo: {str(e)}"
        )


@router.post("/full-sync-with-consistency")
async def full_sync_with_consistency(db: Session = Depends(get_db)):
    """
    Sincronização completa com verificação de consistência.
    Garante que o banco de dados reflita exatamente o que está nos clientes.
    """
    try:
        result = await pull_service.full_sync_with_consistency_check(db)
        return {
            "message": "Sincronização completa concluída",
            **result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro na sincronização completa: {str(e)}"
        )


@router.post("/sync-complete-state")
async def sync_complete_state(db: Session = Depends(get_db)):
    """
    Sincronização completa que garante que o banco reflita
    exatamente o que está nos clientes.
    """
    try:
        return await pull_service.sync_complete_state(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro na sincronização completa: {str(e)}"
        )


@router.post("/sync-with-storage")
async def sync_with_storage(db: Session = Depends(get_db)):
    """
    Sincronização completa usando o novo sistema de storage.
    Atualiza storage, ranking e favoritos baseado nas capturas dos clientes.
    """
    try:
        result = await pull_service.sync_with_storage_system(db)
        return {
            "message": "Sincronização com storage concluída",
            **result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro na sincronização com storage: {str(e)}"
        )


@router.get("/storage-ranking")
async def get_storage_ranking(limit: int = 10):
    """
    Retorna ranking baseado no storage (dados em tempo real).
    """
    try:
        ranking = await pull_service.get_storage_ranking(limit)
        return {
            "ranking": ranking,
            "total_entries": len(ranking)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter ranking do storage: {str(e)}"
        )


@router.get("/storage-stats")
async def get_storage_stats():
    """
    Retorna estatísticas do sistema de storage.
    """
    try:
        stats = await pull_service.get_storage_stats()
        return {
            "storage_stats": stats,
            "message": "Estatísticas do storage obtidas com sucesso"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter estatísticas do storage: {str(e)}"
        )


@router.post("/rebuild-ranking")
async def rebuild_ranking(db: Session = Depends(get_db)):
    """
    Força reconstrução completa do ranking baseado no storage.
    """
    try:
        # Primeiro sincronizar com storage
        sync_result = await pull_service.sync_with_storage_system(db)

        # Depois forçar rebuild do ranking
        ranking_stats = pull_service.ranking_service.force_ranking_rebuild(db)

        return {
            "message": "Ranking reconstruído com sucesso",
            "sync_result": sync_result,
            "ranking_stats": ranking_stats
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao reconstruir ranking: {str(e)}"
        )
