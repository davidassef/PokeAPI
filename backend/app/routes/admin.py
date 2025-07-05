"""
Rotas administrativas da API.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, FavoritePokemon, PokemonRanking
from app.schemas.schemas import Message
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.delete("/reset-database", response_model=Message)
def reset_database(db: Session = Depends(get_db)):
    """
    Limpa completamente o banco de dados.

    Este endpoint remove todos os dados das tabelas:
    - users (usuários)
    - favorites (favoritos)
    - rankings (rankings)

    Após o reset, o banco fica completamente vazio e deve ser
    alimentado exclusivamente pelo frontend através das ações
    de sincronização.

    ⚠️ ATENÇÃO: Esta operação é irreversível!
    """
    try:
        logger.info("🗑️  Iniciando reset do banco de dados...")

        # Contar registros antes da limpeza
        users_count = db.query(User).count()
        favorites_count = db.query(FavoritePokemon).count()
        rankings_count = db.query(PokemonRanking).count()

        logger.info(f"📊 Dados atuais - Usuários: {users_count}, Favoritos: {favorites_count}, Rankings: {rankings_count}")

        # Limpar todas as tabelas
        db.query(PokemonRanking).delete()
        db.query(FavoritePokemon).delete()
        db.query(User).delete()

        # Confirmar as alterações
        db.commit()

        logger.info("✅ Reset do banco de dados concluído com sucesso!")

        return Message(
            message=f"Banco de dados limpo com sucesso! "
                    f"Removidos: {users_count} usuários, {favorites_count} favoritos, {rankings_count} rankings"
        )

    except Exception as e:
        logger.error(f"❌ Erro ao limpar banco de dados: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao limpar banco de dados: {str(e)}"
        )


@router.get("/database-status")
def get_database_status(db: Session = Depends(get_db)):
    """
    Retorna o status atual do banco de dados.

    Mostra a quantidade de registros em cada tabela.
    """
    try:
        users_count = db.query(User).count()
        favorites_count = db.query(FavoritePokemon).count()
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


@router.post("/clear-fictitious-data", response_model=Message)
def clear_fictitious_data(db: Session = Depends(get_db)):
    """
    Remove dados fictícios/mock do banco de dados.

    Remove especificamente:
    - Usuário 'admin' com email 'admin@pokemon.com' ou 'admin@pokeapi.com'
    - Rankings com dados pré-populados (pikachu, charizard, etc.)
    - Favoritos associados a usuários fictícios
    """
    try:
        logger.info("🧹 Iniciando limpeza de dados fictícios...")

        # Identificar e remover usuários fictícios
        fictitious_users = db.query(User).filter(
            User.username.in_(["admin", "test", "demo"]) |
            User.email.in_(["admin@pokemon.com", "admin@pokeapi.com", "test@test.com"])
        ).all()

        fictitious_user_ids = [user.id for user in fictitious_users]

        # Remover favoritos dos usuários fictícios
        favorites_removed = 0
        if fictitious_user_ids:
            favorites_removed = db.query(FavoritePokemon).filter(
                FavoritePokemon.user_id.in_(fictitious_user_ids)
            ).delete(synchronize_session=False)

        # Remover usuários fictícios
        users_removed = len(fictitious_users)
        for user in fictitious_users:
            db.delete(user)

        # Remover rankings pré-populados (dados com favorite_count em sequência decrescente)
        # Isso indica dados fictícios do script de seed
        rankings_removed = db.query(PokemonRanking).filter(
            PokemonRanking.pokemon_name.in_([
                "pikachu", "charizard", "mewtwo", "articuno", "bulbasaur",
                "charmander", "squirtle", "jigglypuff", "gengar", "gyarados"
            ])
        ).delete(synchronize_session=False)

        # Confirmar as alterações
        db.commit()

        logger.info(f"✅ Limpeza concluída - Usuários: {users_removed}, Favoritos: {favorites_removed}, Rankings: {rankings_removed}")

        return Message(
            message=f"Dados fictícios removidos com sucesso! "
                    f"Removidos: {users_removed} usuários, {favorites_removed} favoritos, {rankings_removed} rankings"
        )

    except Exception as e:
        logger.error(f"❌ Erro ao limpar dados fictícios: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao limpar dados fictícios: {str(e)}"
        )
