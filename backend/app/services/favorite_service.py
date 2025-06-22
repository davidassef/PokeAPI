"""
Serviços de negócio para Pokémons favoritos.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.models.models import FavoritePokemon, PokemonRanking
from app.schemas.schemas import FavoritePokemonCreate


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

        # Atualiza ranking
        FavoriteService._update_ranking(
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

        # Atualiza ranking
        FavoriteService._update_ranking(
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
    def is_favorite(db: Session, user_id: int, pokemon_id: int) -> bool:
        """Verifica se Pokémon é favorito do usuário."""
        favorite = db.query(FavoritePokemon).filter(
            FavoritePokemon.user_id == user_id,
            FavoritePokemon.pokemon_id == pokemon_id
        ).first()
        return favorite is not None

    @staticmethod
    def get_ranking(db: Session, limit: int = 10) -> List[PokemonRanking]:
        """Busca ranking dos Pokémons mais favoritados."""
        return db.query(PokemonRanking).order_by(
            PokemonRanking.favorite_count.desc()
        ).limit(limit).all()

    @staticmethod
    def _update_ranking(db: Session, pokemon_id: int, pokemon_name: str,
                        increment: bool = True):
        """Atualiza ranking do Pokémon."""
        ranking = db.query(PokemonRanking).filter(
            PokemonRanking.pokemon_id == pokemon_id
        ).first()

        if not ranking:
            # Cria nova entrada no ranking
            ranking = PokemonRanking(
                pokemon_id=pokemon_id,
                pokemon_name=pokemon_name,
                favorite_count=1 if increment else 0
            )
            db.add(ranking)
        else:
            # Atualiza contagem
            if increment:
                ranking.favorite_count += 1
            else:
                ranking.favorite_count = max(0, ranking.favorite_count - 1)

            ranking.last_updated = func.now()

    @staticmethod
    def get_stats(db: Session) -> dict:
        """Busca estatísticas gerais."""
        total_favorites = db.query(FavoritePokemon).count()
        most_popular = db.query(PokemonRanking).order_by(
            PokemonRanking.favorite_count.desc()
        ).first()

        return {
            "total_favorites": total_favorites,
            "most_popular_pokemon": most_popular
        }
