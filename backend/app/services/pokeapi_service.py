"""
Serviço de integração com a PokeAPI externa para dados de Pokémons.

Este módulo fornece uma interface abstrata para consumir a PokeAPI oficial,
encapsulando chamadas HTTP, tratamento de erros e transformação de dados.
Inclui métodos para buscar Pokémons individuais, listas paginadas, espécies,
tipos e funcionalidades de busca.

Example:
    >>> from app.services.pokeapi_service import pokeapi_service
    >>> pokemon = await pokeapi_service.get_pokemon("pikachu")
    >>> print(pokemon["name"])
    'pikachu'
"""
import httpx
from typing import Dict, List, Optional
from app.core.config import settings


class PokeAPIService:
    """
    Serviço de comunicação com a PokeAPI oficial para dados de Pokémons.
    
    Esta classe encapsula todas as interações com a PokeAPI externa,
    fornecendo métodos assíncronos para buscar informações sobre Pokémons,
    espécies, tipos e realizar buscas. Inclui tratamento de erros HTTP
    e configuração de timeouts apropriados.
    
    Attributes:
        base_url (str): URL base da PokeAPI (https://pokeapi.co/api/v2).
        client (httpx.AsyncClient): Cliente HTTP assíncrono com timeout de 30 segundos.
        
    Example:
        >>> service = PokeAPIService()
        >>> pokemon = await service.get_pokemon(25)
        >>> print(pokemon["name"])
        'pikachu'
    """

    def __init__(self):
        self.base_url = settings.pokeapi_base_url
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_pokemon(self, pokemon_id_or_name: str) -> Optional[Dict]:
        """
        Busca dados completos de um Pokémon específico da PokeAPI.
        
        Retorna informações detalhadas sobre um Pokémon, incluindo estatísticas,
        tipos, habilidades, sprites e movimentos. O método aceita tanto ID quanto
        nome do Pokémon.
        
        Args:
            pokemon_id_or_name (str): ID numérico ou nome do Pokémon (case-insensitive).
            
        Returns:
            Optional[Dict]: Dicionário com dados completos do Pokémon ou None se não encontrado.
            
        Raises:
            httpx.HTTPError: Erros HTTP são capturados e retornam None em vez de propagar.
            
        Examples:
            >>> service = PokeAPIService()
            >>> # Busca por nome
            >>> pikachu = await service.get_pokemon("pikachu")
            >>> print(pikachu["id"])
            25
            >>> # Busca por ID
            >>> charizard = await service.get_pokemon("6")
            >>> print(charizard["name"])
            'charizard'
        """
        try:
            url = f"{self.base_url}/pokemon/{pokemon_id_or_name}"
            response = await self.client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            return None

    async def get_pokemon_list(self, limit: int = 20, offset: int = 0) -> Optional[Dict]:
        """
        Busca lista paginada de Pokémons da PokeAPI.
        
        Retorna uma lista paginada de Pokémons com seus nomes e URLs para
        detalhes completos. Útil para implementar navegação paginada.
        
        Args:
            limit (int): Número máximo de Pokémons por página. Padrão: 20. Máximo: 1000.
            offset (int): Número de Pokémons a pular para paginação. Padrão: 0.
            
        Returns:
            Optional[Dict]: Dicionário com lista de Pokémons e metadados de paginação ou None em caso de erro.
            
        Examples:
            >>> service = PokeAPIService()
            >>> # Primeira página com 10 Pokémons
            >>> page1 = await service.get_pokemon_list(limit=10, offset=0)
            >>> print(page1["count"])
            1302
            >>> print(len(page1["results"]))
            10
            >>> # Segunda página
            >>> page2 = await service.get_pokemon_list(limit=10, offset=10)
            >>> print(page2["results"][0]["name"])
            'caterpie'
        """
        try:
            url = f"{self.base_url}/pokemon"
            params = {"limit": limit, "offset": offset}
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            return None

    async def get_pokemon_species(self, pokemon_id_or_name: str) -> Optional[Dict]:
        """
        Busca dados da espécie de um Pokémon para informações evolutivas e descritivas.
        
        Retorna informações detalhadas sobre a espécie do Pokémon, incluindo:
        - Descrições em diferentes idiomas
        - Informações de evolução e cadeia evolutiva
        - Taxonomia (gênero, forma, habitat)
        - Dados de captura e reprodução
        
        Args:
            pokemon_id_or_name (str): ID numérico ou nome do Pokémon.
            
        Returns:
            Optional[Dict]: Dicionário com dados da espécie ou None se não encontrado.
            
        Examples:
            >>> service = PokeAPIService()
            >>> species = await service.get_pokemon_species("pikachu")
            >>> print(species["flavor_text_entries"][0]["flavor_text"])
            'When several of these POKéMON gather, their electricity could build and cause lightning storms.'
            >>> print(species["evolution_chain"]["url"])
            'https://pokeapi.co/api/v2/evolution-chain/10/'
        """
        try:
            url = f"{self.base_url}/pokemon-species/{pokemon_id_or_name}"
            response = await self.client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            return None

    async def get_pokemon_types(self) -> Optional[List[Dict]]:
        """
        Busca lista completa de todos os tipos de Pokémon disponíveis.
        
        Retorna uma lista com todos os tipos de Pokémon (fogo, água, grama, etc),
        incluindo seus nomes e URLs para detalhes completos de cada tipo.
        
        Returns:
            Optional[List[Dict]]: Lista de dicionários com 'name' e 'url' de cada tipo ou None em caso de erro.
            
        Examples:
            >>> service = PokeAPIService()
            >>> types = await service.get_pokemon_types()
            >>> print(len(types))
            20
            >>> print(types[0]["name"])
            'normal'
            >>> print(types[0]["url"])
            'https://pokeapi.co/api/v2/type/1/'
        """
        try:
            url = f"{self.base_url}/type"
            response = await self.client.get(url, params={"limit": 100})
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])
        except httpx.HTTPError:
            return None

    async def get_type(self, type_name: str) -> Optional[Dict]:
        """
        Busca detalhes completos de um tipo específico de Pokémon.
        
        Retorna informações detalhadas sobre um tipo específico, incluindo:
        - Pokémons que possuem este tipo
        - Danos multiplicativos (super efetivo, não muito efetivo, sem efeito)
        - Relações com outros tipos
        - Informações de geração e movimentos
        
        Args:
            type_name (str): Nome do tipo (ex: 'fire', 'water', 'electric').
            
        Returns:
            Optional[Dict]: Dicionário com dados completos do tipo ou None se não encontrado.
            
        Examples:
            >>> service = PokeAPIService()
            >>> fire_type = await service.get_type("fire")
            >>> print(fire_type["id"])
            10
            >>> print(fire_type["damage_relations"]["double_damage_to"][0]["name"])
            'grass'
            >>> water_type = await service.get_type("water")
            >>> print(water_type["pokemon"][0]["pokemon"]["name"])
            'squirtle'
        """
        try:
            url = f"{self.base_url}/type/{type_name}"
            response = await self.client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            return None

    async def search_pokemon(self, query: str) -> List[Dict]:
        """
        Realiza busca de Pokémon por nome com fallback para busca direta.
        
        Como a PokeAPI não possui endpoint de busca fuzzy, este método
        implementa uma busca básica tentando encontrar o Pokémon exato
        pelo nome. Em caso de não encontrar, retorna lista vazia.
        
        Para implementações futuras, pode ser estendido com:
        - Busca fuzzy (Levenshtein distance)
        - Busca por prefixo
        - Cache de resultados populares
        
        Args:
            query (str): Termo de busca (nome do Pokémon).
            
        Returns:
            List[Dict]: Lista com o Pokémon encontrado (se houver) ou lista vazia.
            
        Examples:
            >>> service = PokeAPIService()
            >>> # Busca exata
            >>> results = await service.search_pokemon("pikachu")
            >>> print(len(results))
            1
            >>> print(results[0]["name"])
            'pikachu'
            >>> # Busca com erro de digitação (retorna vazio)
            >>> results = await service.search_pokemon("pikachuu")
            >>> print(results)
            []
            >>> # Busca case-insensitive
            >>> results = await service.search_pokemon("PIKACHU")
            >>> print(len(results))
            1
        """
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
        """
        Fecha o cliente HTTP assíncrono e libera recursos.
        
        Deve ser chamado quando o serviço não for mais utilizado para
        garantir o fechamento adequado da conexão HTTP e evitar vazamento
        de recursos do sistema.
        
        Examples:
            >>> service = PokeAPIService()
            >>> # ... uso do serviço ...
            >>> await service.close()
            >>> # Cliente HTTP está agora fechado
        """
        await self.client.aclose()


# Instância global do serviço para uso conveniente em toda a aplicação
# 
# Esta instância pré-configurada pode ser importada e utilizada diretamente
# em rotas e outros serviços sem necessidade de criar novas instâncias.
# 
# Example:
#     from app.services.pokeapi_service import pokeapi_service
#     pokemon = await pokeapi_service.get_pokemon("pikachu")
# 
# Nota: Para uso em contextos assíncronos longos, considere criar
# uma nova instância para evitar problemas de estado compartilhado.
pokeapi_service = PokeAPIService()
