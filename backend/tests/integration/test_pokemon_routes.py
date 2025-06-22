"""
Testes de integração para rotas de Pokemon (proxy PokeAPI).
"""
from unittest.mock import patch
from fastapi.testclient import TestClient


class TestPokemonRoutes:
    """Testes de integração para rotas de Pokemon."""

    @patch('app.routes.pokemon.pokeapi_service.get_pokemon')
    def test_get_pokemon_success(self, mock_get_pokemon, client: TestClient):
        """Testa buscar Pokémon com sucesso."""
        mock_pokemon_data = {
            "id": 25,
            "name": "pikachu",
            "height": 4,
            "weight": 60,
            "types": [{"type": {"name": "electric"}}],
            "sprites": {
                "front_default": "https://example.com/pikachu.png"
            }
        }
        mock_get_pokemon.return_value = mock_pokemon_data

        response = client.get("/api/v1/pokemon/pikachu")

        assert response.status_code == 200
        data = response.json()
        assert data == mock_pokemon_data
        mock_get_pokemon.assert_called_once_with("pikachu")

    @patch('app.routes.pokemon.pokeapi_service.get_pokemon')
    def test_get_pokemon_not_found(self, mock_get_pokemon, client: TestClient):
        """Testa buscar Pokémon inexistente."""
        mock_get_pokemon.return_value = None

        response = client.get("/api/v1/pokemon/nonexistent")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"]

    @patch('app.routes.pokemon.pokeapi_service.get_pokemon_list')
    def test_get_pokemon_list_success(self, mock_get_list, client: TestClient):
        """Testa buscar lista de Pokémons com sucesso."""
        mock_list_data = {
            "count": 1281,
            "next": "https://pokeapi.co/api/v2/pokemon?offset=20&limit=20",
            "previous": None,
            "results": [
                {"name": "bulbasaur", "url": "https://pokeapi.co/api/v2/pokemon/1/"},
                {"name": "ivysaur", "url": "https://pokeapi.co/api/v2/pokemon/2/"}
            ]
        }
        mock_get_list.return_value = mock_list_data

        response = client.get("/api/v1/pokemon/")

        assert response.status_code == 200
        data = response.json()
        assert data == mock_list_data
        mock_get_list.assert_called_once_with(limit=20, offset=0)

    @patch('app.routes.pokemon.pokeapi_service.get_pokemon_list')
    def test_get_pokemon_list_with_params(self, mock_get_list, client: TestClient):
        """Testa buscar lista com parâmetros personalizados."""
        mock_list_data = {
            "count": 1281,
            "results": []
        }
        mock_get_list.return_value = mock_list_data

        response = client.get("/api/v1/pokemon/?limit=50&offset=100")

        assert response.status_code == 200
        mock_get_list.assert_called_once_with(limit=50, offset=100)

    @patch('app.routes.pokemon.pokeapi_service.get_pokemon_list')
    def test_get_pokemon_list_error(self, mock_get_list, client: TestClient):
        """Testa buscar lista com erro."""
        mock_get_list.return_value = None

        response = client.get("/api/v1/pokemon/")

        assert response.status_code == 503
        assert "service unavailable" in response.json()["detail"]

    @patch('app.routes.pokemon.pokeapi_service.get_pokemon_species')
    def test_get_pokemon_species_success(self, mock_get_species, client: TestClient):
        """Testa buscar espécie do Pokémon com sucesso."""
        mock_species_data = {
            "id": 25,
            "name": "pikachu",
            "flavor_text_entries": [
                {
                    "flavor_text": "When several of these POKéMON gather...",
                    "language": {"name": "en"}
                }
            ],
            "evolution_chain": {"url": "https://pokeapi.co/api/v2/evolution-chain/10/"}
        }
        mock_get_species.return_value = mock_species_data

        response = client.get("/api/v1/pokemon/pikachu/species")

        assert response.status_code == 200
        data = response.json()
        assert data == mock_species_data
        mock_get_species.assert_called_once_with("pikachu")

    @patch('app.routes.pokemon.pokeapi_service.get_pokemon_species')
    def test_get_pokemon_species_not_found(self, mock_get_species, client: TestClient):
        """Testa buscar espécie de Pokémon inexistente."""
        mock_get_species.return_value = None

        response = client.get("/api/v1/pokemon/nonexistent/species")

        assert response.status_code == 404

    @patch('app.routes.pokemon.pokeapi_service.get_pokemon_types')
    def test_get_pokemon_types_success(self, mock_get_types, client: TestClient):
        """Testa buscar tipos de Pokémon com sucesso."""
        mock_types_data = [
            {"name": "normal", "url": "https://pokeapi.co/api/v2/type/1/"},
            {"name": "fighting", "url": "https://pokeapi.co/api/v2/type/2/"},
            {"name": "flying", "url": "https://pokeapi.co/api/v2/type/3/"}
        ]
        mock_get_types.return_value = mock_types_data

        response = client.get("/api/v1/pokemon/types")

        assert response.status_code == 200
        data = response.json()
        assert data == mock_types_data
        mock_get_types.assert_called_once()

    @patch('app.routes.pokemon.pokeapi_service.get_pokemon_types')
    def test_get_pokemon_types_error(self, mock_get_types, client: TestClient):
        """Testa buscar tipos com erro."""
        mock_get_types.return_value = None

        response = client.get("/api/v1/pokemon/types")

        assert response.status_code == 503

    @patch('app.routes.pokemon.pokeapi_service.get_type')
    def test_get_type_details_success(self, mock_get_type, client: TestClient):
        """Testa buscar detalhes de tipo específico com sucesso."""
        mock_type_data = {
            "id": 13,
            "name": "electric",
            "damage_relations": {
                "double_damage_to": [{"name": "flying", "url": "..."}],
                "half_damage_from": [{"name": "flying", "url": "..."}]
            },
            "pokemon": [
                {"pokemon": {"name": "pikachu", "url": "..."}}
            ]
        }
        mock_get_type.return_value = mock_type_data

        response = client.get("/api/v1/pokemon/type/electric")

        assert response.status_code == 200
        data = response.json()
        assert data == mock_type_data
        mock_get_type.assert_called_once_with("electric")

    @patch('app.routes.pokemon.pokeapi_service.get_type')
    def test_get_type_details_not_found(self, mock_get_type, client: TestClient):
        """Testa buscar tipo inexistente."""
        mock_get_type.return_value = None

        response = client.get("/api/v1/pokemon/type/nonexistent")

        assert response.status_code == 404

    @patch('app.routes.pokemon.pokeapi_service.search_pokemon')
    def test_search_pokemon_success(self, mock_search, client: TestClient):
        """Testa buscar Pokémon por nome com sucesso."""
        mock_search_data = [
            {
                "id": 25,
                "name": "pikachu",
                "types": [{"type": {"name": "electric"}}]
            }
        ]
        mock_search.return_value = mock_search_data

        response = client.get("/api/v1/pokemon/search?q=pikachu")

        assert response.status_code == 200
        data = response.json()
        assert data == mock_search_data
        mock_search.assert_called_once_with("pikachu")

    @patch('app.routes.pokemon.pokeapi_service.search_pokemon')
    def test_search_pokemon_not_found(self, mock_search, client: TestClient):
        """Testa buscar Pokémon que não existe."""
        mock_search.return_value = []

        response = client.get("/api/v1/pokemon/search?q=nonexistent")

        assert response.status_code == 200
        data = response.json()
        assert data == []

    def test_search_pokemon_missing_query(self, client: TestClient):
        """Testa buscar Pokémon sem query string."""
        response = client.get("/api/v1/pokemon/search")

        assert response.status_code == 422  # Unprocessable Entity

    @patch('app.routes.pokemon.pokeapi_service.search_pokemon')
    def test_search_pokemon_empty_query(self, mock_search, client: TestClient):
        """Testa buscar Pokémon com query vazia."""
        mock_search.return_value = []

        response = client.get("/api/v1/pokemon/search?q=")

        assert response.status_code == 200
        data = response.json()
        assert data == []

    def test_get_pokemon_with_id(self, client: TestClient):
        """Testa buscar Pokémon por ID numérico."""
        with patch('app.routes.pokemon.pokeapi_service.get_pokemon') as mock_get:
            mock_pokemon_data = {"id": 1, "name": "bulbasaur"}
            mock_get.return_value = mock_pokemon_data

            response = client.get("/api/v1/pokemon/1")

            assert response.status_code == 200
            mock_get.assert_called_once_with("1")

    def test_get_pokemon_special_characters(self, client: TestClient):
        """Testa buscar Pokémon com caracteres especiais no nome."""
        with patch('app.routes.pokemon.pokeapi_service.get_pokemon') as mock_get:
            mock_get.return_value = None

            response = client.get("/api/v1/pokemon/mr-mime")

            assert response.status_code == 404
            mock_get.assert_called_once_with("mr-mime")

    @patch('app.routes.pokemon.pokeapi_service.get_pokemon_list')
    def test_get_pokemon_list_max_limit(self, mock_get_list, client: TestClient):
        """Testa buscar lista com limite máximo."""
        mock_list_data = {"count": 1281, "results": []}
        mock_get_list.return_value = mock_list_data

        response = client.get("/api/v1/pokemon/?limit=1000")

        assert response.status_code == 200
        # Verifica se o limite foi respeitado (dependendo da implementação)
        mock_get_list.assert_called_once_with(limit=1000, offset=0)
