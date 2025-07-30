"""
Rotas da API para integração com PokeAPI.

Este módulo define todos os endpoints relacionados a Pokémons, incluindo:
- Busca de listas paginadas de Pokémons
- Detalhes individuais de Pokémons
- Informações de espécies e tipos
- Busca por nome
- Tradução de descrições/flavor texts

Todas as rotas são assíncronas e utilizam o serviço PokeAPIService para
interagir com a PokeAPI externa de forma otimizada com cache.

Exemplo de uso:
    ```python
    # Buscar lista de Pokémons
    GET /api/v1/pokemon/?limit=20&offset=0
    
    # Buscar Pokémon específico
    GET /api/v1/pokemon/pikachu
    GET /api/v1/pokemon/25
    
    # Buscar Pokémons por nome
    GET /api/v1/pokemon/search/pika
    
    # Obter descrição traduzida
    GET /api/v1/pokemon/25/flavor?lang=pt-BR
    ```
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, List
from sqlalchemy.orm import Session
from app.services.pokeapi_service import pokeapi_service
from app.core.database import get_db
from app.services.translation_service import get_or_translate_flavor
import requests

router = APIRouter(prefix="/pokemon", tags=["pokemon"])


@router.get("/")
async def get_pokemon_list(limit: int = 20, offset: int = 0) -> Dict:
    """
    Busca lista de Pokémons com paginação da PokeAPI.
    
    Args:
        limit: Número máximo de Pokémons a retornar (padrão: 20, máximo: 100)
        offset: Número de Pokémons a pular para paginação (padrão: 0)
    
    Returns:
        Dict: Objeto contendo:
            - count: Total de Pokémons disponíveis
            - next: URL para próxima página ou None
            - previous: URL para página anterior ou None
            - results: Lista de Pokémons básicos (nome e URL)
    
    Raises:
        HTTPException: 500 se houver erro ao buscar dados da PokeAPI
    
    Example:
        ```json
        {
            "count": 1281,
            "next": "https://pokeapi.co/api/v2/pokemon?offset=20&limit=20",
            "previous": null,
            "results": [
                {"name": "bulbasaur", "url": "https://pokeapi.co/api/v2/pokemon/1/"},
                {"name": "ivysaur", "url": "https://pokeapi.co/api/v2/pokemon/2/"}
            ]
        }
        ```
    """
    pokemon_list = await pokeapi_service.get_pokemon_list(limit, offset)
    if not pokemon_list:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar lista de Pokémons"
        )
    return pokemon_list


@router.get("/{pokemon_id_or_name}")
async def get_pokemon(pokemon_id_or_name: str) -> Dict:
    """
    Busca dados detalhados de um Pokémon específico.
    
    Args:
        pokemon_id_or_name: ID numérico ou nome do Pokémon (case-insensitive)
                           Exemplos: "25", "pikachu", "Pikachu"
    
    Returns:
        Dict: Objeto completo do Pokémon contendo:
            - id: ID numérico do Pokémon
            - name: Nome do Pokémon
            - height: Altura em decímetros
            - weight: Peso em hectogramas
            - types: Lista de tipos do Pokémon
            - abilities: Lista de habilidades
            - stats: Estatísticas base do Pokémon
            - sprites: URLs das imagens do Pokémon
    
    Raises:
        HTTPException: 404 se o Pokémon não for encontrado
    
    Example:
        ```json
        {
            "id": 25,
            "name": "pikachu",
            "height": 4,
            "weight": 60,
            "types": [{"type": {"name": "electric"}}],
            "abilities": [{"ability": {"name": "static"}}],
            "stats": [{"base_stat": 35, "stat": {"name": "hp"}}],
            "sprites": {"front_default": "https://raw.githubusercontent.com/..."}
        }
        ```
    """
    pokemon = await pokeapi_service.get_pokemon(pokemon_id_or_name)
    if not pokemon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pokémon não encontrado"
        )
    return pokemon


@router.get("/{pokemon_id_or_name}/species")
async def get_pokemon_species(pokemon_id_or_name: str) -> Dict:
    """
    Busca informações detalhadas da espécie de um Pokémon.
    
    Args:
        pokemon_id_or_name: ID numérico ou nome do Pokémon
    
    Returns:
        Dict: Informações da espécie incluindo:
            - id: ID da espécie
            - name: Nome da espécie
            - flavor_text_entries: Descrições em diferentes idiomas
            - genera: Classificação da espécie
            - evolution_chain: Informações sobre evolução
            - habitat: Habitat natural
            - is_legendary: Se é lendário
            - is_mythical: Se é mítico
    
    Raises:
        HTTPException: 404 se a espécie não for encontrada
    """
    species = await pokeapi_service.get_pokemon_species(pokemon_id_or_name)
    if not species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Espécie do Pokémon não encontrada"
        )
    return species


@router.get("/search/{query}")
async def search_pokemon(query: str) -> List[Dict]:
    """
    Busca Pokémons por nome com busca fuzzy/parcial.
    
    Args:
        query: Termo de busca (mínimo 2 caracteres)
              Busca parcial case-insensitive
    
    Returns:
        List[Dict]: Lista de Pokémons encontrados, cada um contendo:
            - name: Nome do Pokémon
            - url: URL completa do Pokémon na PokeAPI
            - id: ID numérico extraído da URL
    
    Example:
        ```json
        [
            {"name": "pikachu", "url": "https://pokeapi.co/api/v2/pokemon/25/", "id": 25},
            {"name": "raichu", "url": "https://pokeapi.co/api/v2/pokemon/26/", "id": 26}
        ]
        ```
    """
    return await pokeapi_service.search_pokemon(query)


@router.get("/types/all")
async def get_pokemon_types() -> List[Dict]:
    """
    Busca lista completa de todos os tipos de Pokémon.
    
    Returns:
        List[Dict]: Lista de tipos contendo:
            - name: Nome do tipo (normal, fire, water, etc.)
            - url: URL dos detalhes do tipo
    
    Raises:
        HTTPException: 500 se houver erro ao buscar dados
    
    Example:
        ```json
        [
            {"name": "normal", "url": "https://pokeapi.co/api/v2/type/1/"},
            {"name": "fighting", "url": "https://pokeapi.co/api/v2/type/2/"},
            {"name": "fire", "url": "https://pokeapi.co/api/v2/type/10/"}
        ]
        ```
    """
    types = await pokeapi_service.get_pokemon_types()
    if not types:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar tipos de Pokémon"
        )
    return types


@router.get("/type/{type_name}")
async def get_type_details(type_name: str) -> Dict:
    """
    Busca informações detalhadas sobre um tipo específico de Pokémon.
    
    Args:
        type_name: Nome do tipo (case-insensitive)
                    Exemplos: "fire", "water", "electric"
    
    Returns:
        Dict: Informações completas do tipo incluindo:
            - id: ID do tipo
            - name: Nome do tipo
            - damage_relations: Relações de dano (vantagens/desvantagens)
            - pokemon: Lista de Pokémons deste tipo
            - moves: Lista de movimentos deste tipo
    
    Raises:
        HTTPException: 404 se o tipo não for encontrado
    """
    type_data = await pokeapi_service.get_type(type_name)
    if not type_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo não encontrado"
        )
    return type_data


@router.get("/{pokemon_id_or_name}/flavor")
async def get_pokemon_flavor_translated(
    pokemon_id_or_name: str, lang: str = "pt-BR", db: Session = Depends(get_db)
):
    """
    Retorna todas as descrições (flavor texts) de um Pokémon traduzidas.
    
    Suporta tradução para português (pt-BR), espanhol (es-ES) ou inglês nativo (en).
    Para português, utiliza serviço de tradução com cache para otimizar performance.
    
    Args:
        pokemon_id_or_name: ID numérico ou nome do Pokémon
        lang: Código do idioma desejado (pt-BR, es-ES, en)
              Padrão: pt-BR (português do Brasil)
        db: Sessão do banco de dados injetada pelo FastAPI
    
    Returns:
        Dict: Objeto contendo:
            - flavors: Lista de descrições no idioma solicitado
            - lang: Código do idioma retornado
    
    Raises:
        HTTPException: 404 se o Pokémon não for encontrado na PokeAPI
    
    Example:
        ```json
        {
            "flavors": [
                "Quando vários desses POKéMON se reúnem, sua eletricidade pode se acumular e causar tempestades de raios.",
                "Ele armazena eletricidade em suas bochechas. Se ele sentir ameaça, ele descarregará a eletricidade."
            ],
            "lang": "pt-BR"
        }
        ```
    """
    url = f"https://pokeapi.co/api/v2/pokemon-species/{pokemon_id_or_name}"
    resp = requests.get(url, timeout=10)
    if not resp.ok:
        raise HTTPException(status_code=404, detail="Pokémon não encontrado na PokéAPI")
    data = resp.json()

    # Define idioma base para busca
    if lang == "es-ES":
        lang_api = "es"
    else:
        lang_api = "en"

    # Busca todos os flavors no idioma base
    flavors = [
        entry["flavor_text"].replace('\n', ' ').replace('\f', ' ')
        for entry in data["flavor_text_entries"] if entry["language"]["name"] == lang_api
    ]
    # Remove duplicados mantendo a ordem
    flavors = list(dict.fromkeys(flavors))

    # Se for PT-BR, traduzir todos os flavors do inglês para português
    if lang == "pt-BR":
        flavors_translated = [
            get_or_translate_flavor(db, int(data["id"]), flavor, lang)
            for flavor in flavors
        ]
        return {"flavors": flavors_translated, "lang": lang}
    else:
        # Para EN ou ES, retorna nativo
        return {"flavors": flavors, "lang": lang}
