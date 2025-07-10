"""
Rotas da API para integração com PokeAPI.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, List
from sqlalchemy.orm import Session
from app.services.pokeapi_service import pokeapi_service
from core.database import get_db
from app.services.translation_service import get_or_translate_flavor
import requests

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


@router.get("/{pokemon_id_or_name}/flavor")
async def get_pokemon_flavor_translated(
    pokemon_id_or_name: str, lang: str = "pt-BR", db: Session = Depends(get_db)
):
    """Retorna todos os flavors traduzidos para PT-BR, ou nativos para EN/ES."""
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
