"""
Testes unitários para PokeAPIService.
"""
import pytest
from unittest.mock import patch, MagicMock
import httpx
from app.services.pokeapi_service import PokeAPIService


class TestPokeAPIService:
    """Testes para PokeAPIService."""

    @pytest.fixture
    def service(self):
        """Fixture para instância do serviço."""
        return PokeAPIService()

    @pytest.mark.asyncio
    async def test_get_pokemon_success(self, service):
        """Testa buscar Pokémon com sucesso."""
        mock_response_data = {
            "id": 25,
            "name": "pikachu",
            "height": 4,
            "weight": 60,
            "types": [{"type": {"name": "electric"}}]
        }

        with patch.object(service.client, 'get') as mock_get:
            mock_response = MagicMock()
            mock_response.json.return_value = mock_response_data
            mock_response.raise_for_status.return_value = None
            mock_get.return_value = mock_response

            result = await service.get_pokemon("pikachu")

            assert result == mock_response_data
            mock_get.assert_called_once_with(f"{service.base_url}/pokemon/pikachu")

    @pytest.mark.asyncio
    async def test_get_pokemon_not_found(self, service):
        """Testa buscar Pokémon inexistente."""
        with patch.object(service.client, 'get') as mock_get:
            mock_get.side_effect = httpx.HTTPStatusError(
                "404 Not Found",
                request=MagicMock(),
                response=MagicMock()
            )

            result = await service.get_pokemon("nonexistent")

            assert result is None

    @pytest.mark.asyncio
    async def test_get_pokemon_network_error(self, service):
        """Testa buscar Pokémon com erro de rede."""
        with patch.object(service.client, 'get') as mock_get:
            mock_get.side_effect = httpx.NetworkError("Connection failed")

            result = await service.get_pokemon("pikachu")

            assert result is None

    @pytest.mark.asyncio
    async def test_get_pokemon_list_success(self, service):
        """Testa buscar lista de Pokémons com sucesso."""
        mock_response_data = {
            "count": 1281,
            "next": "https://pokeapi.co/api/v2/pokemon?offset=20&limit=20",
            "previous": None,
            "results": [
                {"name": "bulbasaur", "url": "https://pokeapi.co/api/v2/pokemon/1/"},
                {"name": "ivysaur", "url": "https://pokeapi.co/api/v2/pokemon/2/"}
            ]
        }

        with patch.object(service.client, 'get') as mock_get:
            mock_response = MagicMock()
            mock_response.json.return_value = mock_response_data
            mock_response.raise_for_status.return_value = None
            mock_get.return_value = mock_response

            result = await service.get_pokemon_list(limit=20, offset=0)

            assert result == mock_response_data
            mock_get.assert_called_once_with(
                f"{service.base_url}/pokemon",
                params={"limit": 20, "offset": 0}
            )

    @pytest.mark.asyncio
    async def test_get_pokemon_list_default_params(self, service):
        """Testa buscar lista com parâmetros padrão."""
        with patch.object(service.client, 'get') as mock_get:
            mock_response = MagicMock()
            mock_response.json.return_value = {"results": []}
            mock_response.raise_for_status.return_value = None
            mock_get.return_value = mock_response

            await service.get_pokemon_list()

            mock_get.assert_called_once_with(
                f"{service.base_url}/pokemon",
                params={"limit": 20, "offset": 0}
            )

    @pytest.mark.asyncio
    async def test_get_pokemon_list_error(self, service):
        """Testa buscar lista com erro."""
        with patch.object(service.client, 'get') as mock_get:
            mock_get.side_effect = httpx.HTTPError("Request failed")

            result = await service.get_pokemon_list()

            assert result is None

    @pytest.mark.asyncio
    async def test_get_pokemon_species_success(self, service):
        """Testa buscar espécie do Pokémon com sucesso."""
        mock_response_data = {
            "id": 25,
            "name": "pikachu",
            "flavor_text_entries": [
                {
                    "flavor_text": "When several of these POKéMON gather...",
                    "language": {"name": "en"}
                }
            ]
        }

        with patch.object(service.client, 'get') as mock_get:
            mock_response = MagicMock()
            mock_response.json.return_value = mock_response_data
            mock_response.raise_for_status.return_value = None
            mock_get.return_value = mock_response

            result = await service.get_pokemon_species("pikachu")

            assert result == mock_response_data
            mock_get.assert_called_once_with(f"{service.base_url}/pokemon-species/pikachu")

    @pytest.mark.asyncio
    async def test_get_pokemon_species_error(self, service):
        """Testa buscar espécie com erro."""
        with patch.object(service.client, 'get') as mock_get:
            mock_get.side_effect = httpx.HTTPError("Request failed")

            result = await service.get_pokemon_species("pikachu")

            assert result is None

    @pytest.mark.asyncio
    async def test_get_pokemon_types_success(self, service):
        """Testa buscar tipos de Pokémon com sucesso."""
        mock_response_data = {
            "count": 20,
            "results": [
                {"name": "normal", "url": "https://pokeapi.co/api/v2/type/1/"},
                {"name": "fighting", "url": "https://pokeapi.co/api/v2/type/2/"},
                {"name": "flying", "url": "https://pokeapi.co/api/v2/type/3/"}
            ]
        }

        with patch.object(service.client, 'get') as mock_get:
            mock_response = MagicMock()
            mock_response.json.return_value = mock_response_data
            mock_response.raise_for_status.return_value = None
            mock_get.return_value = mock_response

            result = await service.get_pokemon_types()

            expected_results = mock_response_data["results"]
            assert result == expected_results
            mock_get.assert_called_once_with(
                f"{service.base_url}/type",
                params={"limit": 100}
            )

    @pytest.mark.asyncio
    async def test_get_pokemon_types_error(self, service):
        """Testa buscar tipos com erro."""
        with patch.object(service.client, 'get') as mock_get:
            mock_get.side_effect = httpx.HTTPError("Request failed")

            result = await service.get_pokemon_types()

            assert result is None

    @pytest.mark.asyncio
    async def test_get_type_success(self, service):
        """Testa buscar detalhes de tipo específico com sucesso."""
        mock_response_data = {
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

        with patch.object(service.client, 'get') as mock_get:
            mock_response = MagicMock()
            mock_response.json.return_value = mock_response_data
            mock_response.raise_for_status.return_value = None
            mock_get.return_value = mock_response

            result = await service.get_type("electric")

            assert result == mock_response_data
            mock_get.assert_called_once_with(f"{service.base_url}/type/electric")

    @pytest.mark.asyncio
    async def test_get_type_error(self, service):
        """Testa buscar tipo com erro."""
        with patch.object(service.client, 'get') as mock_get:
            mock_get.side_effect = httpx.HTTPError("Request failed")

            result = await service.get_type("electric")

            assert result is None

    @pytest.mark.asyncio
    async def test_search_pokemon_found(self, service):
        """Testa buscar Pokémon que existe."""
        mock_pokemon_data = {
            "id": 25,
            "name": "pikachu",
            "types": [{"type": {"name": "electric"}}]
        }

        with patch.object(service, 'get_pokemon') as mock_get_pokemon:
            mock_get_pokemon.return_value = mock_pokemon_data

            result = await service.search_pokemon("Pikachu")

            assert len(result) == 1
            assert result[0] == mock_pokemon_data
            mock_get_pokemon.assert_called_once_with("pikachu")

    @pytest.mark.asyncio
    async def test_search_pokemon_not_found(self, service):
        """Testa buscar Pokémon que não existe."""
        with patch.object(service, 'get_pokemon') as mock_get_pokemon:
            mock_get_pokemon.return_value = None

            result = await service.search_pokemon("nonexistent")

            assert len(result) == 0
            mock_get_pokemon.assert_called_once_with("nonexistent")

    @pytest.mark.asyncio
    async def test_search_pokemon_exception(self, service):
        """Testa buscar Pokémon com exceção."""
        with patch.object(service, 'get_pokemon') as mock_get_pokemon:
            mock_get_pokemon.side_effect = Exception("Unexpected error")

            result = await service.search_pokemon("pikachu")

            assert len(result) == 0

    @pytest.mark.asyncio
    async def test_close(self, service):
        """Testa fechar cliente HTTP."""
        with patch.object(service.client, 'aclose') as mock_aclose:
            await service.close()

            mock_aclose.assert_called_once()

    def test_timeout_configuration(self):
        """Testa configuração de timeout do cliente."""
        service = PokeAPIService()

        assert service.client.timeout.read == 30.0

    def test_base_url_configuration(self):
        """Testa configuração da URL base."""
        service = PokeAPIService()

        assert service.base_url == "https://pokeapi.co/api/v2"
