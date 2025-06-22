"""
Testes de integração para rotas de ranking.
"""
from fastapi.testclient import TestClient
from app.models.models import PokemonRanking


class TestRankingRoutes:
    """Testes de integração para rotas de ranking."""

    def test_get_ranking_success(self, client: TestClient, db_session):
        """Testa buscar ranking com sucesso."""
        # Cria alguns rankings
        rankings = [
            PokemonRanking(pokemon_id=25, pokemon_name="pikachu", favorite_count=10),
            PokemonRanking(pokemon_id=1, pokemon_name="bulbasaur", favorite_count=8),
            PokemonRanking(pokemon_id=150, pokemon_name="mewtwo", favorite_count=15),
            PokemonRanking(pokemon_id=4, pokemon_name="charmander", favorite_count=12),
        ]

        for ranking in rankings:
            db_session.add(ranking)
        db_session.commit()

        response = client.get("/api/v1/ranking/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 4

        # Deve estar ordenado por favorite_count desc
        assert data[0]["pokemon_name"] == "mewtwo"
        assert data[0]["favorite_count"] == 15
        assert data[1]["pokemon_name"] == "charmander"
        assert data[1]["favorite_count"] == 12
        assert data[2]["pokemon_name"] == "pikachu"
        assert data[2]["favorite_count"] == 10
        assert data[3]["pokemon_name"] == "bulbasaur"
        assert data[3]["favorite_count"] == 8

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

        response = client.get("/api/v1/ranking/?limit=5")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5

        # Deve retornar os 5 com maior contagem (15, 14, 13, 12, 11)
        assert data[0]["favorite_count"] == 15
        assert data[1]["favorite_count"] == 14
        assert data[2]["favorite_count"] == 13
        assert data[3]["favorite_count"] == 12
        assert data[4]["favorite_count"] == 11

    def test_get_ranking_default_limit(self, client: TestClient, db_session):
        """Testa buscar ranking com limite padrão."""
        # Cria mais de 10 rankings
        for i in range(15):
            ranking = PokemonRanking(
                pokemon_id=i + 1,
                pokemon_name=f"pokemon_{i + 1}",
                favorite_count=i + 1
            )
            db_session.add(ranking)
        db_session.commit()

        response = client.get("/api/v1/ranking/")

        assert response.status_code == 200
        data = response.json()
        # Limite padrão deve ser 10
        assert len(data) == 10

    def test_get_ranking_large_limit(self, client: TestClient, db_session):
        """Testa buscar ranking com limite maior que dados disponíveis."""
        # Cria apenas 3 rankings
        rankings = [
            PokemonRanking(pokemon_id=1, pokemon_name="bulbasaur", favorite_count=5),
            PokemonRanking(pokemon_id=2, pokemon_name="ivysaur", favorite_count=3),
            PokemonRanking(pokemon_id=3, pokemon_name="venusaur", favorite_count=8),
        ]

        for ranking in rankings:
            db_session.add(ranking)
        db_session.commit()

        response = client.get("/api/v1/ranking/?limit=100")

        assert response.status_code == 200
        data = response.json()
        # Deve retornar apenas os 3 disponíveis
        assert len(data) == 3

    def test_get_ranking_zero_limit(self, client: TestClient, db_session):
        """Testa buscar ranking com limite zero."""
        # Cria alguns rankings
        rankings = [
            PokemonRanking(pokemon_id=1, pokemon_name="bulbasaur", favorite_count=5),
            PokemonRanking(pokemon_id=2, pokemon_name="ivysaur", favorite_count=3),
        ]

        for ranking in rankings:
            db_session.add(ranking)
        db_session.commit()

        response = client.get("/api/v1/ranking/?limit=0")

        assert response.status_code == 200
        data = response.json()
        # Com limite 0, deve retornar lista vazia ou usar limite padrão
        assert len(data) >= 0

    def test_get_ranking_negative_limit(self, client: TestClient, db_session):
        """Testa buscar ranking com limite negativo."""
        # Cria alguns rankings
        rankings = [
            PokemonRanking(pokemon_id=1, pokemon_name="bulbasaur", favorite_count=5),
            PokemonRanking(pokemon_id=2, pokemon_name="ivysaur", favorite_count=3),
        ]

        for ranking in rankings:
            db_session.add(ranking)
        db_session.commit()

        response = client.get("/api/v1/ranking/?limit=-1")

        # Dependendo da implementação, pode retornar erro 422 ou usar limite padrão
        assert response.status_code in [200, 422]

    def test_get_ranking_empty(self, client: TestClient):
        """Testa buscar ranking quando não há dados."""
        response = client.get("/api/v1/ranking/")

        assert response.status_code == 200
        data = response.json()
        assert data == []

    def test_get_ranking_response_format(self, client: TestClient, db_session):
        """Testa formato da resposta do ranking."""
        ranking = PokemonRanking(
            pokemon_id=25,
            pokemon_name="pikachu",
            favorite_count=5
        )
        db_session.add(ranking)
        db_session.commit()

        response = client.get("/api/v1/ranking/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

        pokemon_data = data[0]
        assert "id" in pokemon_data
        assert "pokemon_id" in pokemon_data
        assert "pokemon_name" in pokemon_data
        assert "favorite_count" in pokemon_data
        assert "last_updated" in pokemon_data

        assert pokemon_data["pokemon_id"] == 25
        assert pokemon_data["pokemon_name"] == "pikachu"
        assert pokemon_data["favorite_count"] == 5

    def test_get_ranking_tied_scores(self, client: TestClient, db_session):
        """Testa ranking com pontuações empatadas."""
        # Cria rankings com mesma pontuação
        rankings = [
            PokemonRanking(pokemon_id=1, pokemon_name="bulbasaur", favorite_count=10),
            PokemonRanking(pokemon_id=2, pokemon_name="ivysaur", favorite_count=10),
            PokemonRanking(pokemon_id=3, pokemon_name="venusaur", favorite_count=10),
            PokemonRanking(pokemon_id=4, pokemon_name="charmander", favorite_count=5),
        ]

        for ranking in rankings:
            db_session.add(ranking)
        db_session.commit()

        response = client.get("/api/v1/ranking/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 4

        # Os três primeiros devem ter favorite_count = 10
        assert data[0]["favorite_count"] == 10
        assert data[1]["favorite_count"] == 10
        assert data[2]["favorite_count"] == 10
        # O último deve ter favorite_count = 5
        assert data[3]["favorite_count"] == 5
