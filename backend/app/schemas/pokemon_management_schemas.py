"""
Schemas para gerenciamento de Pokémon (operações CRUD).

Este módulo define os schemas Pydantic para validação e serialização
de dados relacionados ao gerenciamento de Pokémon no sistema PokeAPI_SYNC.
Inclui schemas para criação, atualização, validação e serialização
de informações completas de Pokémon.

Classes:
    PokemonTypeSchema: Schema para tipos de Pokémon
    PokemonStatSchema: Schema para estatísticas de Pokémon
    PokemonAbilitySchema: Schema para habilidades de Pokémon
    PokemonSpritesSchema: Schema para sprites/imagens de Pokémon
    PokemonCreate: Schema para criação de Pokémon
    PokemonUpdate: Schema para atualização parcial de Pokémon
    PokemonResponse: Schema para resposta de dados de Pokémon
    PokemonListResponse: Schema para resposta de lista de Pokémon
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, validator, Field


class PokemonTypeSchema(BaseModel):
    """
    Schema para tipos de Pokémon.
    
    Representa os tipos elementais de um Pokémon (ex: fogo, água, grama).
    Um Pokémon pode ter até 2 tipos simultaneamente.
    
    Attributes:
        type (Dict[str, str]): Dicionário contendo o nome do tipo
        
    Example:
        >>> type_schema = PokemonTypeSchema(type={"name": "fire"})
    """
    type: Dict[str, str]  # {"name": "grass"}


class PokemonStatSchema(BaseModel):
    """
    Schema para estatísticas base de Pokémon.
    
    Representa as estatísticas base de um Pokémon, incluindo HP,
    ataque, defesa e velocidade.
    
    Attributes:
        base_stat (int): Valor da estatística (1-255)
        stat (Dict[str, str]): Dicionário com o nome da estatística
        
    Example:
        >>> stat_schema = PokemonStatSchema(
        ...     base_stat=45,
        ...     stat={"name": "hp"}
        ... )
    """
    base_stat: int = Field(..., ge=1, le=255, description="Valor da estatística (1-255)")
    stat: Dict[str, str]  # {"name": "hp"}


class PokemonAbilitySchema(BaseModel):
    """
    Schema para habilidades de Pokémon.
    
    Representa as habilidades especiais que um Pokémon pode possuir,
    como efeitos em batalha ou características únicas.
    
    Attributes:
        ability (Dict[str, str]): Dicionário com o nome da habilidade
        
    Example:
        >>> ability_schema = PokemonAbilitySchema(
        ...     ability={"name": "overgrow"}
        ... )
    """
    ability: Dict[str, str]  # {"name": "overgrow"}


class PokemonSpritesSchema(BaseModel):
    """
    Schema para sprites e imagens de Pokémon.
    
    Contém URLs para diferentes sprites e imagens do Pokémon,
    incluindo versões normais, shiny e outras variações.
    
    Attributes:
        front_default (Optional[str]): URL da imagem frontal padrão
        front_shiny (Optional[str]): URL da imagem frontal shiny
        other (Optional[Dict[str, Any]]): Dicionário com outras variações de imagem
        
    Example:
        >>> sprites_schema = PokemonSpritesSchema(
        ...     front_default="https://pokeapi.co/api/v2/pokemon/1/",
        ...     front_shiny="https://pokeapi.co/api/v2/pokemon/1/shiny",
        ...     other={"official-artwork": {"front_default": "..."}}
        ... )
    """
    front_default: Optional[str] = None
    front_shiny: Optional[str] = None
    other: Optional[Dict[str, Any]] = None


class PokemonCreate(BaseModel):
    """
    Schema para criação de novos Pokémon no sistema.
    
    Este schema valida todos os dados necessários para registrar um novo
    Pokémon no sistema, incluindo validações rigorosas para garantir
    consistência com os dados da PokeAPI.
    
    Attributes:
        name (str): Nome do Pokémon (1-50 caracteres)
        height (int): Altura em decímetros (1-1000)
        weight (int): Peso em hectogramas (1-10000)
        base_experience (int): Experiência base ao derrotar (1-1000)
        types (List[PokemonTypeSchema]): Lista de tipos elementais (1-2 tipos)
        stats (List[PokemonStatSchema]): Lista de estatísticas base (exatamente 6)
        abilities (List[PokemonAbilitySchema]): Lista de habilidades (1-3 habilidades)
        sprites (PokemonSpritesSchema): URLs das imagens/sprites do Pokémon
    
    Raises:
        ValueError: Quando algum campo não atende aos critérios de validação
    
    Example:
        >>> pokemon_data = PokemonCreate(
        ...     name="Pikachu",
        ...     height=4,
        ...     weight=60,
        ...     base_experience=112,
        ...     types=[PokemonTypeSchema(type={"name": "electric"})],
        ...     stats=[
        ...         PokemonStatSchema(base_stat=35, stat={"name": "hp"}),
        ...         PokemonStatSchema(base_stat=55, stat={"name": "attack"}),
        ...         PokemonStatSchema(base_stat=40, stat={"name": "defense"}),
        ...         PokemonStatSchema(base_stat=50, stat={"name": "special-attack"}),
        ...         PokemonStatSchema(base_stat=50, stat={"name": "special-defense"}),
        ...         PokemonStatSchema(base_stat=90, stat={"name": "speed"})
        ...     ],
        ...     abilities=[PokemonAbilitySchema(ability={"name": "static"})],
        ...     sprites=PokemonSpritesSchema(front_default="https://...")
        ... )
    """
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
        """Valida o nome do Pokémon."""
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
        """Valida os tipos elementais do Pokémon."""
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
        """Valida as estatísticas base do Pokémon."""
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
        """Valida as habilidades do Pokémon."""
        if not v:
            raise ValueError('Pelo menos uma habilidade é obrigatória')

        # Verificar duplicatas
        ability_names = [ability.ability['name'].lower() for ability in v]
        if len(ability_names) != len(set(ability_names)):
            raise ValueError('Não é possível ter habilidades duplicadas')

        return v


class PokemonUpdate(BaseModel):
    """
    Schema para atualização parcial de Pokémon existente.
    
    Este schema permite atualizar apenas os campos especificados,
    mantendo os valores existentes para campos não fornecidos.
    Todos os campos são opcionais, mas quando fornecidos, seguem as
    mesmas validações do schema PokemonCreate.
    
    Attributes:
        name (Optional[str]): Nome do Pokémon (1-50 caracteres)
        height (Optional[int]): Altura em decímetros (1-1000)
        weight (Optional[int]): Peso em hectogramas (1-10000)
        base_experience (Optional[int]): Experiência base ao derrotar (1-1000)
        types (Optional[List[PokemonTypeSchema]]): Lista de tipos elementais (1-2 tipos)
        stats (Optional[List[PokemonStatSchema]]): Lista de estatísticas base (exatamente 6)
        abilities (Optional[List[PokemonAbilitySchema]]): Lista de habilidades (1-3 habilidades)
        sprites (Optional[PokemonSpritesSchema]): URLs das imagens/sprites do Pokémon
    
    Raises:
        ValueError: Quando algum campo fornecido não atende aos critérios de validação
    
    Example:
        >>> # Atualizar apenas nome e peso
        >>> update_data = PokemonUpdate(
        ...     name="Raichu",
        ...     weight=300
        ... )
        >>> 
        >>> # Atualizar todos os campos
        >>> full_update = PokemonUpdate(
        ...     name="Charizard",
        ...     height=17,
        ...     weight=905,
        ...     base_experience=267,
        ...     types=[
        ...         PokemonTypeSchema(type={"name": "fire"}),
        ...         PokemonTypeSchema(type={"name": "flying"})
        ...     ],
        ...     stats=[...],
        ...     abilities=[...],
        ...     sprites=PokemonSpritesSchema(...)
        ... )
    """
    name: Optional[str] = Field(None, min_length=1, max_length=50, description="Nome do Pokemon")
    height: Optional[int] = Field(None, ge=1, le=1000, description="Altura em decímetros")
    weight: Optional[int] = Field(None, ge=1, le=10000, description="Peso em hectogramas")
    base_experience: Optional[int] = Field(None, ge=1, le=1000, description="Experiência base")
    types: Optional[List[PokemonTypeSchema]] = Field(None, min_items=1, max_items=2, description="Tipos do Pokemon")
    stats: Optional[List[PokemonStatSchema]] = Field(None, min_items=6, max_items=6, description="Estatísticas do Pokemon")
    abilities: Optional[List[PokemonAbilitySchema]] = Field(None, min_items=1, max_items=3, description="Habilidades do Pokemon")
    sprites: Optional[PokemonSpritesSchema] = Field(None, description="Sprites/imagens do Pokemon")

    @validator('name')
    def validate_name(cls, v):
        """Valida o nome do Pokémon se fornecido."""
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Nome não pode estar vazio')

            # Converter para lowercase e remover espaços extras
            name = v.strip().lower()

            # Verificar caracteres válidos (apenas letras, números e hífens)
            if not all(c.isalnum() or c in ['-', ' '] for c in name):
                raise ValueError('Nome deve conter apenas letras, números, hífens e espaços')

            return name
        return v

    @validator('types')
    def validate_types(cls, v):
        """Valida os tipos elementais do Pokémon se fornecidos."""
        if v is not None:
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
        return v

    @validator('stats')
    def validate_stats(cls, v):
        """Valida as estatísticas base do Pokémon se fornecidas."""
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
        return v

    @validator('abilities')
    def validate_abilities(cls, v):
        """Valida as habilidades do Pokémon se fornecidas."""
        if v is not None:
            if not v:
                raise ValueError('Pelo menos uma habilidade é obrigatória')

            # Verificar duplicatas
            ability_names = [ability.ability['name'].lower() for ability in v]
            if len(ability_names) != len(set(ability_names)):
                raise ValueError('Não é possível ter habilidades duplicadas')

            return v
        return v


class PokemonResponse(BaseModel):
    """
    Schema para resposta completa de dados de Pokémon.
    
    Representa um Pokémon completo com todas as informações necessárias
    para exibição ou processamento, incluindo ID gerado pelo banco.
    
    Attributes:
        id (int): ID único do Pokémon no banco de dados
        name (str): Nome do Pokémon
        height (int): Altura em decímetros
        weight (int): Peso em hectogramas
        base_experience (int): Experiência base ao derrotar
        types (List[PokemonTypeSchema]): Lista de tipos elementais
        stats (List[PokemonStatSchema]): Lista de estatísticas base
        abilities (List[PokemonAbilitySchema]): Lista de habilidades
        sprites (PokemonSpritesSchema): URLs das imagens/sprites
        
    Example:
        >>> pokemon = PokemonResponse(
        ...     id=1,
        ...     name="pikachu",
        ...     height=4,
        ...     weight=60,
        ...     base_experience=112,
        ...     types=[PokemonTypeSchema(type={"name": "electric"})],
        ...     stats=[...],
        ...     abilities=[...],
        ...     sprites=PokemonSpritesSchema(...)
        ... )
    """
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
    """
    Schema para resposta paginada de lista de Pokémon.
    
    Estrutura padronizada para retornar listas de Pokémon com
    informações de paginação, facilitando a navegação em grandes conjuntos.
    
    Attributes:
        pokemon (List[PokemonResponse]): Lista de Pokémon da página atual
        total (int): Total de Pokémon no sistema
        page (int): Número da página atual (começa em 1)
        total_pages (int): Número total de páginas disponíveis
        
    Example:
        >>> response = PokemonListResponse(
        ...     pokemon=[PokemonResponse(...), PokemonResponse(...)],
        ...     total=150,
        ...     page=1,
        ...     total_pages=15
        ... )
    """
    pokemon: List[PokemonResponse]
    total: int
    page: int
    total_pages: int


class PokemonDeleteResponse(BaseModel):
    """
    Schema para resposta de exclusão de Pokémon.
    
    Fornece feedback detalhado sobre a operação de exclusão,
    incluindo os dados do Pokémon excluído para fins de auditoria.
    
    Attributes:
        success (bool): Indica se a exclusão foi bem-sucedida
        message (str): Mensagem descritiva sobre o resultado
        deleted_pokemon (Optional[PokemonResponse]): Dados do Pokémon excluído
        
    Example:
        >>> response = PokemonDeleteResponse(
        ...     success=True,
        ...     message="Pokémon Pikachu excluído com sucesso",
        ...     deleted_pokemon=PokemonResponse(...)
        ... )
    """
    success: bool
    message: str
    deleted_pokemon: Optional[PokemonResponse] = None


class ApiResponse(BaseModel):
    """
    Schema genérico para respostas padronizadas da API.
    
    Estrutura flexível para retornar respostas consistentes
    em todas as operações da API, suportando sucesso e erro.
    
    Attributes:
        success (bool): Indica se a operação foi bem-sucedida
        message (Optional[str]): Mensagem informativa ou de sucesso
        data (Optional[Any]): Dados da resposta quando aplicável
        error (Optional[str]): Mensagem de erro quando aplicável
        
    Example:
        >>> # Resposta de sucesso
        >>> success_response = ApiResponse(
        ...     success=True,
        ...     message="Operação realizada com sucesso",
        ...     data={"id": 1, "name": "pikachu"}
        ... )
        >>> 
        >>> # Resposta de erro
        >>> error_response = ApiResponse(
        ...     success=False,
        ...     message="Erro na operação",
        ...     error="Pokémon não encontrado"
        ... )
    """
    success: bool
    message: Optional[str] = None
    data: Optional[Any] = None
    error: Optional[str] = None


class PokemonValidationError(BaseModel):
    """
    Schema para detalhamento de erros de validação específicos.
    
    Fornece informações detalhadas sobre campos que falharam na validação,
    facilitando a correção por parte do cliente.
    
    Attributes:
        field (str): Nome do campo que falhou na validação
        message (str): Descrição detalhada do erro
        value (Optional[Any]): Valor fornecido que causou o erro
        
    Example:
        >>> error = PokemonValidationError(
        ...     field="weight",
        ...     message="Peso deve ser entre 1 e 10000 hectogramas",
        ...     value=0
        ... )
    """
    field: str
    message: str
    value: Optional[Any] = None


class PokemonErrorResponse(BaseModel):
    """
    Schema para respostas detalhadas de erro em operações de Pokémon.
    
    Estrutura especializada para retornar erros com detalhes específicos
    sobre quais campos falharam na validação ou outras informações úteis.
    
    Attributes:
        success (bool): Sempre False para indicar erro
        error (str): Mensagem principal de erro
        details (Optional[List[PokemonValidationError]]): Lista de erros específicos por campo
        code (Optional[str]): Código de erro para referência técnica
        
    Example:
        >>> error_response = PokemonErrorResponse(
        ...     success=False,
        ...     error="Erro de validação",
        ...     details=[
        ...         PokemonValidationError(
        ...             field="weight",
        ...             message="Peso deve ser entre 1 e 10000",
        ...             value=0
        ...         )
        ...     ],
        ...     code="VALIDATION_ERROR"
        ... )
    """
    success: bool = False
    error: str
    details: Optional[List[PokemonValidationError]] = None
    code: Optional[str] = None


# Schemas para compatibilidade com frontend
class PokemonManagementCreate(PokemonCreate):
    """
    Alias para compatibilidade com frontend.
    
    Classe de compatibilidade que herda todas as funcionalidades
    do PokemonCreate, mantendo consistência com versões anteriores
    da API ou requisitos específicos do frontend.
    
    Note:
        Esta classe é idêntica ao PokemonCreate e serve apenas
        para manter retrocompatibilidade.
    """
    pass


class PokemonManagementUpdate(PokemonUpdate):
    """
    Alias para compatibilidade com frontend.
    
    Classe de compatibilidade que herda todas as funcionalidades
    do PokemonUpdate, mantendo consistência com versões anteriores
    da API ou requisitos específicos do frontend.
    
    Note:
        Esta classe é idêntica ao PokemonUpdate e serve apenas
        para manter retrocompatibilidade.
    """
    pass
