"""
Testes de integração para rotas de favoritos.
"""
from fastapi.testclient import TestClient
from app.models.models import FavoritePokemon, PokemonRanking


class TestFavoriteRoutes:
    """Testes de integração para rotas de favoritos."""

    def test_add_favorite_success(self, client: TestClient, sample_user):
        """Testa adicionar favorito com sucesso."""
        favorite_data = {
            "user_id": sample_user.id,
            "pokemon_id": 25,
            "pokemon_name": "pikachu"
        }

        response = client.post("/api/v1/favorites/", json=favorite_data)

        assert response.status_code == 201
        data = response.json()
        assert data["user_id"] == sample_user.id
        assert data["pokemon_id"] == 25
        assert data["pokemon_name"] == "pikachu"
        assert "id" in data

    def test_add_favorite_duplicate(self, client: TestClient, sample_favorite):
        """Testa adicionar favorito duplicado."""
        favorite_data = {
            "user_id": sample_favorite.user_id,
            "pokemon_id": sample_favorite.pokemon_id,
            "pokemon_name": sample_favorite.pokemon_name
        }

        response = client.post("/api/v1/favorites/", json=favorite_data)

        assert response.status_code == 201
        data = response.json()
        assert data["id"] == sample_favorite.id  # Retorna o existente

    def test_add_favorite_invalid_user(self, client: TestClient):
        """Testa adicionar favorito com usuário inexistente."""
        favorite_data = {
            "user_id": 999,
            "pokemon_id": 25,
            "pokemon_name": "pikachu"
        }

        response = client.post("/api/v1/favorites/", json=favorite_data)

        # Dependendo da implementação, pode ser 400 ou 404
        assert response.status_code in [400, 404, 422]

    def test_remove_favorite_success(self, client: TestClient, sample_favorite):
        """Testa remover favorito com sucesso."""
        response = client.delete(
            f"/api/favorites/{sample_favorite.user_id}/{sample_favorite.pokemon_id}"
        )

        assert response.status_code == 204

    def test_remove_favorite_not_found(self, client: TestClient, sample_user):
        """Testa remover favorito inexistente."""
        response = client.delete(f"/api/favorites/{sample_user.id}/999")

        assert response.status_code == 404

    def test_get_user_favorites_success(self, client: TestClient, sample_user, db_session):
        """Testa buscar favoritos do usuário."""
        # Adiciona alguns favoritos
        favorites = [
            FavoritePokemon(user_id=sample_user.id, pokemon_id=1, pokemon_name="bulbasaur"),
            FavoritePokemon(user_id=sample_user.id, pokemon_id=4, pokemon_name="charmander"),
            FavoritePokemon(user_id=sample_user.id, pokemon_id=7, pokemon_name="squirtle")
        ]

        for favorite in favorites:
            db_session.add(favorite)
        db_session.commit()

        response = client.get(f"/api/favorites/user/{sample_user.id}")

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3

        pokemon_names = [fav["pokemon_name"] for fav in data]
        assert "bulbasaur" in pokemon_names
        assert "charmander" in pokemon_names
        assert "squirtle" in pokemon_names

    def test_get_user_favorites_empty(self, client: TestClient, sample_user):
        """Testa buscar favoritos quando usuário não tem nenhum."""
        response = client.get(f"/api/favorites/user/{sample_user.id}")

        assert response.status_code == 200
        data = response.json()
        assert data == []

    def test_get_user_favorites_user_not_found(self, client: TestClient):
        """Testa buscar favoritos de usuário inexistente."""
        response = client.get("/api/v1/favorites/user/999")

        # Dependendo da implementação, pode retornar lista vazia ou 404
        assert response.status_code in [200, 404]

    def test_check_is_favorite_true(self, client: TestClient, sample_favorite):
        """Testa verificar se Pokémon é favorito (caso verdadeiro)."""
        response = client.get(
            f"/api/favorites/check/{sample_favorite.user_id}/{sample_favorite.pokemon_id}"
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_favorite"] is True

    def test_check_is_favorite_false(self, client: TestClient, sample_user):
        """Testa verificar se Pokémon é favorito (caso falso)."""
        response = client.get(f"/api/favorites/check/{sample_user.id}/999")

        assert response.status_code == 200
        data = response.json()
        assert data["is_favorite"] is False

    def test_get_ranking_success(self, client: TestClient, db_session):
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

        response = client.get("/api/v1/favorites/ranking")

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3

        # Deve estar ordenado por favorite_count desc
        assert data[0]["pokemon_name"] == "mewtwo"
        assert data[0]["favorite_count"] == 15

    def test_get_ranking_with_limit(self, client: TestClient, db_session):
        """Testa buscar ranking com limite personalizado."""
        # Cria vários rankings
        for i in range(15):
            ranking = PokemonRanking(
                pokemon_id=i + 1,
                pokemon_name=f"pokemon_{i + 1}",
                favorite_count=i + 1
            )
            db_session.add(ranking)
        db_session.commit()

        response = client.get("/api/v1/favorites/ranking?limit=5")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5
        # Deve retornar os 5 com maior contagem
        assert data[0]["favorite_count"] == 15

    def test_get_ranking_empty(self, client: TestClient):
        """Testa buscar ranking quando não há dados."""
        response = client.get("/api/v1/favorites/ranking")

        assert response.status_code == 200
        data = response.json()
        assert data == []

    def test_get_stats_success(self, client: TestClient, sample_user, db_session):
        """Testa buscar estatísticas gerais."""
        # Adiciona alguns favoritos
        favorites = [
            FavoritePokemon(user_id=sample_user.id, pokemon_id=1, pokemon_name="bulbasaur"),
            FavoritePokemon(user_id=sample_user.id, pokemon_id=25, pokemon_name="pikachu")
        ]

        for favorite in favorites:
            db_session.add(favorite)

        # Adiciona ranking
        ranking = PokemonRanking(
            pokemon_id=150,
            pokemon_name="mewtwo",
            favorite_count=100
        )
        db_session.add(ranking)
        db_session.commit()

        response = client.get("/api/v1/favorites/stats")

        assert response.status_code == 200
        data = response.json()
        assert "total_favorites" in data
        assert "most_popular_pokemon" in data
        assert data["total_favorites"] >= 2
        assert data["most_popular_pokemon"]["pokemon_name"] == "mewtwo"

    def test_get_stats_empty(self, client: TestClient):
        """Testa buscar estatísticas quando não há dados."""
        response = client.get("/api/v1/favorites/stats")

        assert response.status_code == 200
        data = response.json()
        assert data["total_favorites"] == 0
        assert data["most_popular_pokemon"] is None
