"""
Rotas para gerenciamento de Pokemon (CRUD operations).
Requer permissões de administrador.
"""
import json
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from core.database import get_db
from app.models.models import User, UserRole
from app.core.rbac import require_admin, require_permission, Permission
from core.auth_middleware import get_current_active_user
from app.schemas.pokemon_management_schemas import (
    PokemonCreate, PokemonUpdate, PokemonResponse,
    PokemonListResponse, PokemonDeleteResponse, ApiResponse,
    PokemonErrorResponse, PokemonValidationError
)

# Configurar logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pokemon", tags=["pokemon-management"])


# Simulação de banco de dados de Pokemon (em produção, usar banco real)
# Por enquanto, vamos simular com uma lista em memória
POKEMON_DATABASE = []
NEXT_POKEMON_ID = 1


def get_next_pokemon_id() -> int:
    """Obtém o próximo ID disponível para Pokemon."""
    global NEXT_POKEMON_ID
    current_id = NEXT_POKEMON_ID
    NEXT_POKEMON_ID += 1
    return current_id


def find_pokemon_by_id(pokemon_id: int) -> Optional[dict]:
    """Encontra Pokemon por ID."""
    for pokemon in POKEMON_DATABASE:
        if pokemon.get('id') == pokemon_id:
            return pokemon
    return None


def find_pokemon_by_name(name: str) -> Optional[dict]:
    """Encontra Pokemon por nome."""
    name_lower = name.lower()
    for pokemon in POKEMON_DATABASE:
        if pokemon.get('name', '').lower() == name_lower:
            return pokemon
    return None


def validate_pokemon_data(pokemon_data: dict) -> List[PokemonValidationError]:
    """Valida dados de Pokemon e retorna lista de erros."""
    errors = []

    # Validar nome único
    if 'name' in pokemon_data:
        existing = find_pokemon_by_name(pokemon_data['name'])
        if existing and existing.get('id') != pokemon_data.get('id'):
            errors.append(PokemonValidationError(
                field="name",
                message=f"Pokemon com nome '{pokemon_data['name']}' já existe",
                value=pokemon_data['name']
            ))

    return errors


@router.post("/", response_model=ApiResponse)
@require_admin()
async def create_pokemon(
    pokemon_data: PokemonCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Cria um novo Pokemon (Admin apenas).

    Requer:
    - Autenticação
    - Role de administrador
    - Dados válidos de Pokemon
    """
    try:
        logger.info(f"Admin {current_user.email} criando Pokemon: {pokemon_data.name}")

        # Converter para dict para manipulação
        pokemon_dict = pokemon_data.dict()

        # Validar dados
        validation_errors = validate_pokemon_data(pokemon_dict)
        if validation_errors:
            return PokemonErrorResponse(
                error="Dados de Pokemon inválidos",
                details=validation_errors,
                code="VALIDATION_ERROR"
            )

        # Adicionar ID e metadados
        pokemon_dict['id'] = get_next_pokemon_id()
        pokemon_dict['created_by'] = current_user.id
        pokemon_dict['created_at'] = "2025-07-10T16:00:00Z"  # Em produção, usar datetime real

        # Salvar no "banco de dados"
        POKEMON_DATABASE.append(pokemon_dict)

        logger.info(f"Pokemon {pokemon_dict['name']} criado com ID {pokemon_dict['id']}")

        return ApiResponse(
            success=True,
            message=f"Pokemon '{pokemon_dict['name']}' criado com sucesso",
            data=pokemon_dict
        )

    except Exception as e:
        logger.error(f"Erro ao criar Pokemon: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao criar Pokemon: {str(e)}"
        )


@router.put("/{pokemon_id}", response_model=ApiResponse)
@require_admin()
async def update_pokemon(
    pokemon_id: int,
    pokemon_data: PokemonUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Atualiza um Pokemon existente (Admin apenas).

    Requer:
    - Autenticação
    - Role de administrador
    - Pokemon deve existir
    """
    try:
        logger.info(f"Admin {current_user.email} atualizando Pokemon ID: {pokemon_id}")

        # Encontrar Pokemon
        existing_pokemon = find_pokemon_by_id(pokemon_id)
        if not existing_pokemon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pokemon com ID {pokemon_id} não encontrado"
            )

        # Converter dados de atualização para dict
        update_dict = pokemon_data.dict(exclude_unset=True)

        # Validar dados se houver mudanças
        if update_dict:
            # Criar dict temporário com dados atualizados para validação
            temp_dict = existing_pokemon.copy()
            temp_dict.update(update_dict)

            validation_errors = validate_pokemon_data(temp_dict)
            if validation_errors:
                return PokemonErrorResponse(
                    error="Dados de atualização inválidos",
                    details=validation_errors,
                    code="VALIDATION_ERROR"
                )

            # Aplicar atualizações
            existing_pokemon.update(update_dict)
            existing_pokemon['updated_by'] = current_user.id
            existing_pokemon['updated_at'] = "2025-07-10T16:00:00Z"

            logger.info(f"Pokemon {existing_pokemon['name']} atualizado com sucesso")

            return ApiResponse(
                success=True,
                message=f"Pokemon '{existing_pokemon['name']}' atualizado com sucesso",
                data=existing_pokemon
            )
        else:
            return ApiResponse(
                success=True,
                message="Nenhuma alteração fornecida",
                data=existing_pokemon
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar Pokemon: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao atualizar Pokemon: {str(e)}"
        )


@router.delete("/{pokemon_id}", response_model=PokemonDeleteResponse)
@require_admin()
async def delete_pokemon(
    pokemon_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Exclui um Pokemon (Admin apenas).

    Requer:
    - Autenticação
    - Role de administrador
    - Pokemon deve existir
    """
    try:
        logger.info(f"Admin {current_user.email} excluindo Pokemon ID: {pokemon_id}")

        # Encontrar Pokemon
        pokemon_to_delete = find_pokemon_by_id(pokemon_id)
        if not pokemon_to_delete:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pokemon com ID {pokemon_id} não encontrado"
            )

        # Remover do "banco de dados"
        POKEMON_DATABASE.remove(pokemon_to_delete)

        logger.info(f"Pokemon {pokemon_to_delete['name']} excluído com sucesso")

        return PokemonDeleteResponse(
            success=True,
            message=f"Pokemon '{pokemon_to_delete['name']}' excluído com sucesso",
            deleted_pokemon=pokemon_to_delete
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao excluir Pokemon: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao excluir Pokemon: {str(e)}"
        )


@router.get("/", response_model=PokemonListResponse)
async def list_pokemon(
    page: int = Query(1, ge=1, description="Número da página"),
    limit: int = Query(20, ge=1, le=100, description="Itens por página"),
    db: Session = Depends(get_db)
):
    """
    Lista todos os Pokemon com paginação (Público).

    Este endpoint é público e não requer autenticação.
    """
    try:
        # Calcular paginação
        total = len(POKEMON_DATABASE)
        total_pages = (total + limit - 1) // limit
        start_index = (page - 1) * limit
        end_index = start_index + limit

        # Obter Pokemon da página atual
        pokemon_page = POKEMON_DATABASE[start_index:end_index]

        return PokemonListResponse(
            pokemon=pokemon_page,
            total=total,
            page=page,
            total_pages=total_pages
        )

    except Exception as e:
        logger.error(f"Erro ao listar Pokemon: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao listar Pokemon: {str(e)}"
        )


@router.get("/{pokemon_id}", response_model=ApiResponse)
async def get_pokemon(
    pokemon_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtém detalhes de um Pokemon específico (Público).

    Este endpoint é público e não requer autenticação.
    """
    try:
        pokemon = find_pokemon_by_id(pokemon_id)
        if not pokemon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pokemon com ID {pokemon_id} não encontrado"
            )

        return ApiResponse(
            success=True,
            data=pokemon
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter Pokemon: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao obter Pokemon: {str(e)}"
        )


@router.get("/admin/stats", response_model=ApiResponse)
@require_admin()
async def get_pokemon_management_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Obtém estatísticas de gerenciamento de Pokemon (Admin apenas).

    Requer:
    - Autenticação
    - Role de administrador
    """
    try:
        total_pokemon = len(POKEMON_DATABASE)

        # Estatísticas por tipo
        type_stats = {}
        for pokemon in POKEMON_DATABASE:
            for type_info in pokemon.get('types', []):
                type_name = type_info['type']['name']
                type_stats[type_name] = type_stats.get(type_name, 0) + 1

        stats = {
            "total_pokemon": total_pokemon,
            "types_distribution": type_stats,
            "database_size": len(POKEMON_DATABASE),
            "last_created": POKEMON_DATABASE[-1] if POKEMON_DATABASE else None
        }

        return ApiResponse(
            success=True,
            message="Estatísticas de gerenciamento de Pokemon",
            data=stats
        )

    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao obter estatísticas: {str(e)}"
        )
