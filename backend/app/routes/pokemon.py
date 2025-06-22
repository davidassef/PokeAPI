"""
Rotas da API para integração com PokeAPI.
"""
from fastapi import APIRouter, HTTPException, status
from typing import Dict, List
from app.services.pokeapi_service import pokeapi_service

router = APIRouter(prefix="/pokemon", tags=["pokemon"])


@router.get("/{pokemon_id_or_name}")
async def get_pokemon(pokemon_id_or_name: str) -> Dict:
    """Busca dados de um Pokémon específico."""
    pokemon = await pokeapi_service.get_pokemon(pokemon_id_or_name)
    if not pokemon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pokémon não encontrado"
        )
    return pokemon


@router.get("/")
async def get_pokemon_list(limit: int = 20, offset: int = 0) -> Dict:
    """Busca lista de Pokémons com paginação."""
    pokemon_list = await pokeapi_service.get_pokemon_list(limit, offset)
    if not pokemon_list:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar lista de Pokémons"
        )
    return pokemon_list


@router.get("/{pokemon_id_or_name}/species")
async def get_pokemon_species(pokemon_id_or_name: str) -> Dict:
    """Busca dados da espécie do Pokémon."""
    species = await pokeapi_service.get_pokemon_species(pokemon_id_or_name)
    if not species:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Espécie do Pokémon não encontrada"
        )
    return species


@router.get("/search/{query}")
async def search_pokemon(query: str) -> List[Dict]:
    """Busca Pokémons por nome."""
    return await pokeapi_service.search_pokemon(query)


@router.get("/types/all")
async def get_pokemon_types() -> List[Dict]:
    """Busca todos os tipos de Pokémon."""
    types = await pokeapi_service.get_pokemon_types()
    if not types:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar tipos de Pokémon"
        )
    return types


@router.get("/type/{type_name}")
async def get_type_details(type_name: str) -> Dict:
    """Busca detalhes de um tipo específico."""
    type_data = await pokeapi_service.get_type(type_name)
    if not type_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo não encontrado"
        )
    return type_data
