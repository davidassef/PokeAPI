"""
Serviços de negócio para Pokémons favoritos.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.models.models import FavoritePokemon, PokemonRanking
from app.schemas.schemas import FavoritePokemonCreate
from datetime import datetime


class FavoriteService:
    """Serviço para operações com favoritos."""

    @staticmethod
    def add_favorite(db: Session,
                     favorite: FavoritePokemonCreate) -> FavoritePokemon:
        """Adiciona Pokémon aos favoritos."""
        # Verifica se já não está nos favoritos
        existing = db.query(FavoritePokemon).filter(
            FavoritePokemon.user_id == favorite.user_id,
            FavoritePokemon.pokemon_id == favorite.pokemon_id
        ).first()

        if existing:
            return existing

        # Cria novo favorito
        db_favorite = FavoritePokemon(
            user_id=favorite.user_id,
            pokemon_id=favorite.pokemon_id,
            pokemon_name=favorite.pokemon_name
        )
        db.add(db_favorite)

        # Atualiza ranking baseado em capturas (não favoritos)
        FavoriteService._update_ranking_from_captures(
            db, favorite.pokemon_id, favorite.pokemon_name)

        db.commit()
        db.refresh(db_favorite)
        return db_favorite

    @staticmethod
    def remove_favorite(db: Session, user_id: int, pokemon_id: int) -> bool:
        """Remove Pokémon dos favoritos."""
        favorite = db.query(FavoritePokemon).filter(
            FavoritePokemon.user_id == user_id,
            FavoritePokemon.pokemon_id == pokemon_id
        ).first()

        if not favorite:
            return False

        pokemon_name = favorite.pokemon_name
        db.delete(favorite)

        # Atualiza ranking baseado em capturas (não favoritos)
        FavoriteService._update_ranking_from_captures(
            db, pokemon_id, pokemon_name, increment=False)

        db.commit()
        return True

    @staticmethod
    def get_user_favorites(db: Session, user_id: int) -> List[FavoritePokemon]:
        """Busca favoritos do usuário."""
        return db.query(FavoritePokemon).filter(
            FavoritePokemon.user_id == user_id
        ).all()

    @staticmethod
    def check_multiple_favorites(
        db: Session,
        user_id: int,
        pokemon_ids: List[int]
    ) -> dict:
        """
        Verifica quais Pokémons de uma lista estão nos favoritos do usuário.

        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            pokemon_ids: Lista de IDs de Pokémon para verificar

        Returns:
            Dicionário onde as chaves são os IDs dos Pokémons e os valores são
            booleanos indicando se estão nos favoritos
        """
        if not pokemon_ids:
            return {}

        # Converte para set para remover duplicatas
        pokemon_ids = list(set(pokemon_ids))

        # Busca todos os favoritos do usuário que estão na lista de IDs fornecida
        query = db.query(FavoritePokemon.pokemon_id)
        query = query.filter(
            FavoritePokemon.user_id == user_id,
            FavoritePokemon.pokemon_id.in_(pokemon_ids)
        )
        favorites = query.all()

        # Cria um conjunto com os IDs dos favoritos para busca mais rápida
        favorite_ids = {fav.pokemon_id for fav in favorites}

        # Retorna um dicionário com o status de cada Pokémon
        return {
            str(pokemon_id): pokemon_id in favorite_ids
            for pokemon_id in pokemon_ids
        }

    @staticmethod
    def is_favorite(db: Session, user_id: int, pokemon_id: int) -> bool:
        """Verifica se Pokémon é favorito do usuário."""
        favorite = db.query(FavoritePokemon).filter(
            FavoritePokemon.user_id == user_id,
            FavoritePokemon.pokemon_id == pokemon_id
        ).first()
        return favorite is not None

    @staticmethod
    def get_ranking(db: Session, limit: int = 10) -> list[dict]:
        """Busca ranking dos Pokémons mais capturados (não favoritados)."""
        # Primeiro, vamos buscar do PokemonRanking se existir
        ranking_records = db.query(PokemonRanking).order_by(
            PokemonRanking.favorite_count.desc()
        ).limit(limit).all()

        if ranking_records:
            # Se há dados na tabela PokemonRanking, use-os
            rankings = []
            for record in ranking_records:
                ranking = {
                    'id': record.id,
                    'pokemon_id': record.pokemon_id,
                    'pokemon_name': record.pokemon_name,
                    'favorite_count': record.favorite_count,
                    'last_updated': record.last_updated
                }
                rankings.append(ranking)
            return rankings

        # Se não há dados no PokemonRanking, gera dinamicamente a partir dos favoritos
        capture_counts = db.query(
            FavoritePokemon.pokemon_id,
            FavoritePokemon.pokemon_name,
            func.count(FavoritePokemon.id).label('capture_count')
        ).group_by(
            FavoritePokemon.pokemon_id,
            FavoritePokemon.pokemon_name
        ).order_by(
            func.count(FavoritePokemon.id).desc()
        ).limit(limit).all()

        rankings = []
        now = datetime.now()
        for i, (pokemon_id, pokemon_name, capture_count) in enumerate(capture_counts):
            ranking = {
                'id': i + 1,  # ID sequencial
                'pokemon_id': pokemon_id,
                'pokemon_name': pokemon_name,
                'favorite_count': capture_count,
                'last_updated': now
            }
            rankings.append(ranking)

        return rankings

    @staticmethod
    def _update_ranking_from_captures(db: Session, pokemon_id: int, pokemon_name: str, increment: bool = True):
        """Atualiza ranking do Pokémon baseado em capturas."""
        # Este método agora é usado apenas para manter compatibilidade
        # O ranking real é calculado dinamicamente em get_ranking()
        pass

    @staticmethod
    def get_stats(db: Session) -> dict:
        """Busca estatísticas gerais baseadas em capturas."""
        total_captures = db.query(FavoritePokemon).count()

        # Busca o Pokémon mais capturado
        most_captured = db.query(
            FavoritePokemon.pokemon_id,
            FavoritePokemon.pokemon_name,
            func.count(FavoritePokemon.id).label('capture_count')
        ).group_by(
            FavoritePokemon.pokemon_id,
            FavoritePokemon.pokemon_name
        ).order_by(
            func.count(FavoritePokemon.id).desc()
        ).first()

        most_popular = None
        if most_captured:
            most_popular = PokemonRanking(
                pokemon_id=most_captured.pokemon_id,
                pokemon_name=most_captured.pokemon_name,
                favorite_count=most_captured.capture_count
            )

        return {
            "total_favorites": total_captures,  # Mantém nome para compatibilidade
            "most_popular_pokemon": most_popular
        }

    @staticmethod
    def get_all_favorites(db: Session) -> List[FavoritePokemon]:
        """Busca todos os favoritos do sistema."""
        return db.query(FavoritePokemon).all()

    @staticmethod
    def clear_all_favorites(db: Session, user_id: int) -> int:
        """🚨 EMERGÊNCIA: Remove TODOS os favoritos de um usuário específico"""
        import logging
        logger = logging.getLogger(__name__)

        logger.warning(f"🚨 LIMPEZA EMERGENCIAL: Removendo TODOS os favoritos do usuário ID {user_id}")

        # Conta quantos favoritos serão removidos
        count_query = db.query(FavoritePokemon).filter(FavoritePokemon.user_id == user_id)
        deleted_count = count_query.count()

        # Remove todos os favoritos do usuário
        count_query.delete()
        db.commit()

        logger.info(f"✅ Limpeza concluída: {deleted_count} favoritos removidos para o usuário ID {user_id}")

        return deleted_count
