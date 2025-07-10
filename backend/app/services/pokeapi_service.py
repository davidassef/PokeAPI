"""
Serviço para integração com a PokeAPI externa.
"""
import httpx
from typing import Dict, List, Optional
from core.config import settings


class PokeAPIService:
    """Serviço para comunicação com a PokeAPI."""

    def __init__(self):
        self.base_url = settings.pokeapi_base_url
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_pokemon(self, pokemon_id_or_name: str) -> Optional[Dict]:
        """Busca dados de um Pokémon específico."""
        try:
            url = f"{self.base_url}/pokemon/{pokemon_id_or_name}"
            response = await self.client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            return None

    async def get_pokemon_list(self, limit: int = 20, offset: int = 0) -> Optional[Dict]:
        """Busca lista de Pokémons com paginação."""
        try:
            url = f"{self.base_url}/pokemon"
            params = {"limit": limit, "offset": offset}
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            return None

    async def get_pokemon_species(self, pokemon_id_or_name: str) -> Optional[Dict]:
        """Busca dados da espécie do Pokémon (descrições, evoluções, etc)."""
        try:
            url = f"{self.base_url}/pokemon-species/{pokemon_id_or_name}"
            response = await self.client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            return None

    async def get_pokemon_types(self) -> Optional[List[Dict]]:
        """Busca todos os tipos de Pokémon."""
        try:
            url = f"{self.base_url}/type"
            response = await self.client.get(url, params={"limit": 100})
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])
        except httpx.HTTPError:
            return None

    async def get_type(self, type_name: str) -> Optional[Dict]:
        """Busca detalhes de um tipo específico."""
        try:
            url = f"{self.base_url}/type/{type_name}"
            response = await self.client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            return None

    async def search_pokemon(self, query: str) -> List[Dict]:
        """Busca Pokémons por nome (simulação de busca)."""
        try:
            # A PokeAPI não tem busca direta, então fazemos uma busca básica
            # Primeiro tentamos buscar diretamente
            pokemon = await self.get_pokemon(query.lower())
            if pokemon:
                return [pokemon]

            # Se não encontrar, retorna lista vazia
            # Em uma implementação real, poderíamos fazer busca fuzzy
            return []
        except Exception:
            return []

    async def close(self):
        """Fecha o cliente HTTP."""
        await self.client.aclose()


# Instância global do serviço
pokeapi_service = PokeAPIService()
