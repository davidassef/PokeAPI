"""
Testes unitários para FavoriteService.
"""
from app.services.favorite_service import FavoriteService
from app.models.models import FavoritePokemon, PokemonRanking
from app.schemas.schemas import FavoritePokemonCreate


class TestFavoriteService:
    """Testes para FavoriteService."""

    def test_add_favorite_new(self, db_session, sample_user):
        """Testa adicionar novo favorito."""
        favorite_data = FavoritePokemonCreate(
            user_id=sample_user.id,
            pokemon_id=25,
            pokemon_name="pikachu"
        )

        result = FavoriteService.add_favorite(db_session, favorite_data)

        assert result.user_id == sample_user.id
        assert result.pokemon_id == 25
        assert result.pokemon_name == "pikachu"

        # Verifica se foi criado no banco
        db_favorite = db_session.query(FavoritePokemon).filter(
            FavoritePokemon.user_id == sample_user.id,
            FavoritePokemon.pokemon_id == 25
        ).first()
        assert db_favorite is not None

    def test_add_favorite_existing(self, db_session, sample_favorite):
        """Testa adicionar favorito já existente."""
        favorite_data = FavoritePokemonCreate(
            user_id=sample_favorite.user_id,
            pokemon_id=sample_favorite.pokemon_id,
            pokemon_name=sample_favorite.pokemon_name
        )

        result = FavoriteService.add_favorite(db_session, favorite_data)

        assert result.id == sample_favorite.id

        # Verifica que não duplicou
        count = db_session.query(FavoritePokemon).filter(
            FavoritePokemon.user_id == sample_favorite.user_id,
            FavoritePokemon.pokemon_id == sample_favorite.pokemon_id
        ).count()
        assert count == 1

    def test_remove_favorite_existing(self, db_session, sample_favorite):
        """Testa remover favorito existente."""
        user_id = sample_favorite.user_id
        pokemon_id = sample_favorite.pokemon_id

        result = FavoriteService.remove_favorite(db_session, user_id, pokemon_id)

        assert result is True

        # Verifica se foi removido
        db_favorite = db_session.query(FavoritePokemon).filter(
            FavoritePokemon.user_id == user_id,
            FavoritePokemon.pokemon_id == pokemon_id
        ).first()
        assert db_favorite is None

    def test_remove_favorite_not_existing(self, db_session, sample_user):
        """Testa remover favorito inexistente."""
        result = FavoriteService.remove_favorite(db_session, sample_user.id, 999)

        assert result is False

    def test_get_user_favorites(self, db_session, sample_user):
        """Testa buscar favoritos do usuário."""
        # Cria alguns favoritos
        favorites_data = [
            FavoritePokemonCreate(user_id=sample_user.id, pokemon_id=1, pokemon_name="bulbasaur"),
            FavoritePokemonCreate(user_id=sample_user.id, pokemon_id=4, pokemon_name="charmander"),
            FavoritePokemonCreate(user_id=sample_user.id, pokemon_id=7, pokemon_name="squirtle")
        ]

        for fav_data in favorites_data:
            FavoriteService.add_favorite(db_session, fav_data)

        result = FavoriteService.get_user_favorites(db_session, sample_user.id)

        assert len(result) == 3
        pokemon_names = [fav.pokemon_name for fav in result]
        assert "bulbasaur" in pokemon_names
        assert "charmander" in pokemon_names
        assert "squirtle" in pokemon_names

    def test_get_user_favorites_empty(self, db_session, sample_user):
        """Testa buscar favoritos quando usuário não tem nenhum."""
        result = FavoriteService.get_user_favorites(db_session, sample_user.id)

        assert len(result) == 0

    def test_is_favorite_true(self, db_session, sample_favorite):
        """Testa verificar se Pokémon é favorito (caso verdadeiro)."""
        result = FavoriteService.is_favorite(
            db_session,
            sample_favorite.user_id,
            sample_favorite.pokemon_id
        )

        assert result is True

    def test_is_favorite_false(self, db_session, sample_user):
        """Testa verificar se Pokémon é favorito (caso falso)."""
        result = FavoriteService.is_favorite(db_session, sample_user.id, 999)

        assert result is False

    def test_get_ranking(self, db_session):
        """Testa buscar ranking dos mais favoritados."""
        # Cria alguns rankings
        rankings = [
            PokemonRanking(pokemon_id=25, pokemon_name="pikachu", favorite_count=10),
            PokemonRanking(pokemon_id=1, pokemon_name="bulbasaur", favorite_count=8),
            PokemonRanking(pokemon_id=150, pokemon_name="mewtwo", favorite_count=15),
        ]

        for ranking in rankings:
            db_session.add(ranking)
        db_session.commit()

        result = FavoriteService.get_ranking(db_session, limit=3)

        assert len(result) == 3
        # Deve estar ordenado por favorite_count desc
        assert result[0].pokemon_name == "mewtwo"
        assert result[0].favorite_count == 15
        assert result[1].pokemon_name == "pikachu"
        assert result[1].favorite_count == 10
        assert result[2].pokemon_name == "bulbasaur"
        assert result[2].favorite_count == 8

    def test_get_ranking_limit(self, db_session):
        """Testa buscar ranking com limite."""
        # Cria vários rankings
        for i in range(15):
            ranking = PokemonRanking(
                pokemon_id=i + 1,
                pokemon_name=f"pokemon_{i + 1}",
                favorite_count=i + 1
            )
            db_session.add(ranking)
        db_session.commit()

        result = FavoriteService.get_ranking(db_session, limit=5)

        assert len(result) == 5        # Deve retornar os 5 com maior contagem
        assert result[0].favorite_count == 15

    def test_update_ranking_through_add_favorite(self, db_session, sample_user):
        """Testa atualização do ranking através de adicionar favorito."""
        favorite_data = FavoritePokemonCreate(
            user_id=sample_user.id,
            pokemon_id=25,
            pokemon_name="pikachu"
        )

        FavoriteService.add_favorite(db_session, favorite_data)

        ranking = db_session.query(PokemonRanking).filter(
            PokemonRanking.pokemon_id == 25
        ).first()

        assert ranking is not None
        assert ranking.pokemon_name == "pikachu"
        assert ranking.favorite_count == 1

    def test_update_ranking_through_remove_favorite(self, db_session, sample_favorite):
        """Testa atualização do ranking através de remover favorito."""
        # Primeiro adiciona para criar ranking
        initial_ranking = PokemonRanking(
            pokemon_id=sample_favorite.pokemon_id,
            pokemon_name=sample_favorite.pokemon_name,
            favorite_count=2
        )
        db_session.add(initial_ranking)
        db_session.commit()

        # Remove favorito
        FavoriteService.remove_favorite(
            db_session,
            sample_favorite.user_id,
            sample_favorite.pokemon_id
        )

        updated_ranking = db_session.query(PokemonRanking).filter(
            PokemonRanking.pokemon_id == sample_favorite.pokemon_id
        ).first()

        assert updated_ranking.favorite_count == 1

    def test_get_stats(self, db_session, sample_user):
        """Testa buscar estatísticas gerais."""
        # Cria favoritos e rankings
        favorites_data = [
            FavoritePokemonCreate(user_id=sample_user.id, pokemon_id=1, pokemon_name="bulbasaur"),
            FavoritePokemonCreate(user_id=sample_user.id, pokemon_id=25, pokemon_name="pikachu")
        ]

        for fav_data in favorites_data:
            FavoriteService.add_favorite(db_session, fav_data)

        # Cria ranking manual para ter um "most popular"
        most_popular = PokemonRanking(
            pokemon_id=150,
            pokemon_name="mewtwo",
            favorite_count=100
        )
        db_session.add(most_popular)
        db_session.commit()

        result = FavoriteService.get_stats(db_session)

        assert "total_favorites" in result
        assert "most_popular_pokemon" in result
        assert result["total_favorites"] >= 2
        assert result["most_popular_pokemon"].pokemon_name == "mewtwo"

    def test_get_stats_empty(self, db_session):
        """Testa buscar estatísticas quando não há dados."""
        result = FavoriteService.get_stats(db_session)

        assert result["total_favorites"] == 0
        assert result["most_popular_pokemon"] is None
