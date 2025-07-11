"""
Rotas administrativas da API.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from app.models.models import User, PokemonRanking
from app.models.models import FavoritePokemon as FavoritePokemonModel

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


# REMOVED: Dangerous reset-database endpoint for security


@router.get("/database-status")
def get_database_status(db: Session = Depends(get_db)):
    """
    Retorna o status atual do banco de dados.

    Mostra a quantidade de registros em cada tabela.
    """
    try:
        users_count = db.query(User).count()
        favorites_count = db.query(FavoritePokemonModel).count()
        rankings_count = db.query(PokemonRanking).count()

        return {
            "status": "healthy",
            "tables": {
                "users": users_count,
                "favorites": favorites_count,
                "rankings": rankings_count
            },
            "total_records": users_count + favorites_count + rankings_count,
            "is_empty": users_count == 0 and favorites_count == 0 and rankings_count == 0
        }

    except Exception as e:
        logger.error(f"❌ Erro ao verificar status do banco: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao verificar status do banco: {str(e)}"
        )


# REMOVED: Dangerous clear-fictitious-data endpoint for security


# REMOVED: Debug endpoints for security
