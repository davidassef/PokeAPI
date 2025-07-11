"""
Schemas para gerenciamento de Pokemon (CRUD operations).
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, validator, Field


class PokemonTypeSchema(BaseModel):
    """Schema para tipo de Pokemon."""
    type: Dict[str, str]  # {"name": "grass"}


class PokemonStatSchema(BaseModel):
    """Schema para estatística de Pokemon."""
    base_stat: int = Field(..., ge=1, le=255, description="Valor da estatística (1-255)")
    stat: Dict[str, str]  # {"name": "hp"}


class PokemonAbilitySchema(BaseModel):
    """Schema para habilidade de Pokemon."""
    ability: Dict[str, str]  # {"name": "overgrow"}


class PokemonSpritesSchema(BaseModel):
    """Schema para sprites/imagens de Pokemon."""
    front_default: Optional[str] = None
    front_shiny: Optional[str] = None
    other: Optional[Dict[str, Any]] = None


class PokemonCreate(BaseModel):
    """Schema para criação de Pokemon."""
    name: str = Field(..., min_length=1, max_length=50, description="Nome do Pokemon")
    height: int = Field(..., ge=1, le=1000, description="Altura em decímetros")
    weight: int = Field(..., ge=1, le=10000, description="Peso em hectogramas")
    base_experience: int = Field(..., ge=1, le=1000, description="Experiência base")
    types: List[PokemonTypeSchema] = Field(..., min_items=1, max_items=2, description="Tipos do Pokemon")
    stats: List[PokemonStatSchema] = Field(..., min_items=6, max_items=6, description="Estatísticas do Pokemon")
    abilities: List[PokemonAbilitySchema] = Field(..., min_items=1, max_items=3, description="Habilidades do Pokemon")
    sprites: PokemonSpritesSchema = Field(..., description="Sprites/imagens do Pokemon")

    @validator('name')
    def validate_name(cls, v):
        """Valida o nome do Pokemon."""
        if not v or not v.strip():
            raise ValueError('Nome é obrigatório')

        # Converter para lowercase e remover espaços extras
        name = v.strip().lower()

        # Verificar caracteres válidos (apenas letras, números e hífens)
        if not all(c.isalnum() or c in ['-', ' '] for c in name):
            raise ValueError('Nome deve conter apenas letras, números, hífens e espaços')

        return name

    @validator('types')
    def validate_types(cls, v):
        """Valida os tipos do Pokemon."""
        if not v:
            raise ValueError('Pelo menos um tipo é obrigatório')

        # Verificar tipos válidos
        valid_types = {
            'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting',
            'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost',
            'dragon', 'dark', 'steel', 'fairy'
        }

        type_names = [t.type['name'].lower() for t in v]

        # Verificar se todos os tipos são válidos
        for type_name in type_names:
            if type_name not in valid_types:
                raise ValueError(f'Tipo inválido: {type_name}')

        # Verificar duplicatas
        if len(type_names) != len(set(type_names)):
            raise ValueError('Não é possível ter tipos duplicados')

        return v

    @validator('stats')
    def validate_stats(cls, v):
        """Valida as estatísticas do Pokemon."""
        if len(v) != 6:
            raise ValueError('Exatamente 6 estatísticas são obrigatórias')

        required_stats = {'hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'}
        provided_stats = {stat.stat['name'].lower() for stat in v}

        if provided_stats != required_stats:
            missing = required_stats - provided_stats
            extra = provided_stats - required_stats
            error_msg = []
            if missing:
                error_msg.append(f'Estatísticas faltando: {", ".join(missing)}')
            if extra:
                error_msg.append(f'Estatísticas extras: {", ".join(extra)}')
            raise ValueError('; '.join(error_msg))

        return v

    @validator('abilities')
    def validate_abilities(cls, v):
        """Valida as habilidades do Pokemon."""
        if not v:
            raise ValueError('Pelo menos uma habilidade é obrigatória')

        # Verificar duplicatas
        ability_names = [ability.ability['name'].lower() for ability in v]
        if len(ability_names) != len(set(ability_names)):
            raise ValueError('Não é possível ter habilidades duplicadas')

        return v


class PokemonUpdate(BaseModel):
    """Schema para atualização de Pokemon."""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    height: Optional[int] = Field(None, ge=1, le=1000)
    weight: Optional[int] = Field(None, ge=1, le=10000)
    base_experience: Optional[int] = Field(None, ge=1, le=1000)
    types: Optional[List[PokemonTypeSchema]] = Field(None, min_items=1, max_items=2)
    stats: Optional[List[PokemonStatSchema]] = Field(None, min_items=6, max_items=6)
    abilities: Optional[List[PokemonAbilitySchema]] = Field(None, min_items=1, max_items=3)
    sprites: Optional[PokemonSpritesSchema] = None

    @validator('name')
    def validate_name(cls, v):
        """Valida o nome do Pokemon."""
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Nome não pode estar vazio')

            name = v.strip().lower()

            if not all(c.isalnum() or c in ['-', ' '] for c in name):
                raise ValueError('Nome deve conter apenas letras, números, hífens e espaços')

            return name
        return v

    @validator('types')
    def validate_types(cls, v):
        """Valida os tipos do Pokemon."""
        if v is not None:
            if not v:
                raise ValueError('Pelo menos um tipo é obrigatório')

            valid_types = {
                'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting',
                'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost',
                'dragon', 'dark', 'steel', 'fairy'
            }

            type_names = [t.type['name'].lower() for t in v]

            for type_name in type_names:
                if type_name not in valid_types:
                    raise ValueError(f'Tipo inválido: {type_name}')

            if len(type_names) != len(set(type_names)):
                raise ValueError('Não é possível ter tipos duplicados')

        return v

    @validator('stats')
    def validate_stats(cls, v):
        """Valida as estatísticas do Pokemon."""
        if v is not None:
            if len(v) != 6:
                raise ValueError('Exatamente 6 estatísticas são obrigatórias')

            required_stats = {'hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'}
            provided_stats = {stat.stat['name'].lower() for stat in v}

            if provided_stats != required_stats:
                missing = required_stats - provided_stats
                extra = provided_stats - required_stats
                error_msg = []
                if missing:
                    error_msg.append(f'Estatísticas faltando: {", ".join(missing)}')
                if extra:
                    error_msg.append(f'Estatísticas extras: {", ".join(extra)}')
                raise ValueError('; '.join(error_msg))

        return v

    @validator('abilities')
    def validate_abilities(cls, v):
        """Valida as habilidades do Pokemon."""
        if v is not None:
            if not v:
                raise ValueError('Pelo menos uma habilidade é obrigatória')

            ability_names = [ability.ability['name'].lower() for ability in v]
            if len(ability_names) != len(set(ability_names)):
                raise ValueError('Não é possível ter habilidades duplicadas')

        return v


class PokemonResponse(BaseModel):
    """Schema para resposta de Pokemon."""
    id: int
    name: str
    height: int
    weight: int
    base_experience: int
    types: List[PokemonTypeSchema]
    stats: List[PokemonStatSchema]
    abilities: List[PokemonAbilitySchema]
    sprites: PokemonSpritesSchema

    class Config:
        from_attributes = True


class PokemonListResponse(BaseModel):
    """Schema para resposta de lista de Pokemon."""
    pokemon: List[PokemonResponse]
    total: int
    page: int
    total_pages: int


class PokemonDeleteResponse(BaseModel):
    """Schema para resposta de exclusão de Pokemon."""
    success: bool
    message: str
    deleted_pokemon: Optional[PokemonResponse] = None


class ApiResponse(BaseModel):
    """Schema genérico para respostas da API."""
    success: bool
    message: Optional[str] = None
    data: Optional[Any] = None
    error: Optional[str] = None


class PokemonValidationError(BaseModel):
    """Schema para erros de validação de Pokemon."""
    field: str
    message: str
    value: Optional[Any] = None


class PokemonErrorResponse(BaseModel):
    """Schema para respostas de erro específicas de Pokemon."""
    success: bool = False
    error: str
    details: Optional[List[PokemonValidationError]] = None
    code: Optional[str] = None


# Schemas para compatibilidade com frontend
class PokemonManagementCreate(PokemonCreate):
    """Alias para compatibilidade com frontend."""
    pass


class PokemonManagementUpdate(PokemonUpdate):
    """Alias para compatibilidade com frontend."""
    pass
