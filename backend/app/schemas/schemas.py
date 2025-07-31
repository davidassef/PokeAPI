"""
Schemas Pydantic para validação e serialização de dados da API.

Este módulo define todos os schemas utilizados para validação de entrada,
serialização de saída e documentação automática da API usando Pydantic.
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional, Union


# ===== SCHEMAS DE USUÁRIO =====

class UserBase(BaseModel):
    """
    Schema base para dados de usuário.

    Contém os campos comuns compartilhados entre diferentes operações de usuário.

    Attributes:
        username: Nome de usuário único no sistema
        email: Endereço de email válido para login e comunicação
    """
    username: str
    email: EmailStr


class UserCreate(UserBase):
    """
    Schema para criação de novo usuário.

    Herda os campos base e pode ser estendido com campos específicos
    para o processo de registro.
    """
    pass


class UserUpdate(BaseModel):
    """
    Schema para atualização de dados de usuário.

    Todos os campos são opcionais para permitir atualizações parciais.

    Attributes:
        username: Novo nome de usuário (opcional)
        email: Novo endereço de email (opcional)
        is_active: Status ativo/inativo da conta (opcional)
    """
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class User(UserBase):
    """
    Schema de resposta completo do usuário.

    Inclui todos os dados do usuário que podem ser retornados pela API,
    excluindo informações sensíveis como senhas.

    Attributes:
        id: Identificador único do usuário
        created_at: Data e hora de criação da conta
        is_active: Status atual da conta
    """
    id: int
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


# ===== SCHEMAS DE POKÉMONS FAVORITOS =====

class FavoritePokemonBase(BaseModel):
    """
    Schema base para Pokémons favoritos.

    Contém os dados essenciais de um Pokémon favoritado.

    Attributes:
        pokemon_id: ID do Pokémon na PokeAPI (1-1010+)
        pokemon_name: Nome do Pokémon para facilitar consultas
    """
    pokemon_id: int
    pokemon_name: str


class FavoritePokemonCreate(FavoritePokemonBase):
    """
    Schema para adicionar um Pokémon aos favoritos.

    Inclui a referência ao usuário que está favoritando o Pokémon.

    Attributes:
        user_id: ID do usuário que está favoritando
    """
    user_id: int


class FavoritePokemon(FavoritePokemonBase):
    """
    Schema de resposta completo de um Pokémon favorito.

    Inclui todos os dados do favorito incluindo metadados de auditoria.

    Attributes:
        id: Identificador único do registro de favorito
        user_id: ID do usuário proprietário
        added_at: Data e hora quando foi favoritado
    """
    id: int
    user_id: int
    added_at: datetime

    class Config:
        from_attributes = True


class CheckCapturedRequest(BaseModel):
    """
    Schema para verificação em lote de Pokémons capturados.

    Permite verificar o status de múltiplos Pokémons de uma só vez
    para otimizar a performance da interface.

    Attributes:
        pokemon_ids: Lista de IDs dos Pokémons a serem verificados
    """
    pokemon_ids: List[int]


# ===== SCHEMAS DE RANKING =====

class PokemonRankingBase(BaseModel):
    """
    Schema base para dados de ranking de Pokémons.

    Contém os dados essenciais de um item do ranking global.

    Attributes:
        pokemon_id: ID único do Pokémon na PokeAPI
        pokemon_name: Nome do Pokémon para facilitar consultas
        favorite_count: Número total de vezes que foi favoritado
    """
    pokemon_id: int
    pokemon_name: str
    favorite_count: int


class PokemonRanking(PokemonRankingBase):
    """
    Schema de resposta completo do ranking.

    Inclui metadados adicionais sobre o item do ranking.

    Attributes:
        id: Identificador único do registro de ranking
        last_updated: Data e hora da última atualização
    """
    id: int
    last_updated: datetime

    class Config:
        from_attributes = True


# ===== SCHEMAS DE SINCRONIZAÇÃO =====

class SyncPayload(BaseModel):
    """
    Schema para dados adicionais de sincronização.

    Contém metadados opcionais que acompanham uma operação de sincronização.

    Attributes:
        pokemonName: Nome do Pokémon (opcional, para facilitar debug)
        removed: Indica se é uma operação de remoção (padrão: False)
    """
    pokemonName: Optional[str] = None
    removed: Optional[bool] = False


class SyncCaptureRequest(BaseModel):
    """
    Schema para requisição individual de sincronização.

    Representa uma única operação de captura/favorito a ser sincronizada.
    
    Este schema é usado para sincronizar ações entre dispositivos cliente
    e servidor, garantindo que as operações sejam registradas com
    timestamp preciso para evitar conflitos de sincronização.

    Attributes:
        pokemonId (int): ID do Pokémon na PokeAPI (1-1010+)
        action (str): Tipo de ação ('capture', 'favorite' ou 'unfavorite')
        timestamp (int): Timestamp Unix da operação no cliente (milisegundos)
        payload (Optional[SyncPayload]): Dados adicionais opcionais
        user_id (int): ID do usuário (padrão: 1 para compatibilidade)

    Example:
        >>> request = SyncCaptureRequest(
        ...     pokemonId=25,
        ...     action="favorite",
        ...     timestamp=1704067200000,
        ...     payload=SyncPayload(pokemonName="Pikachu")
        ... )
    """
    pokemonId: int
    action: str
    timestamp: int
    payload: Optional[SyncPayload] = None
    user_id: int = 1


class SyncBatchRequest(BaseModel):
    """
    Schema para sincronização em lote.

    Permite enviar múltiplas operações de sincronização em uma única requisição
    para otimizar a performance e reduzir latência. Ideal para sincronização
    inicial ou quando há múltiplas operações pendentes.

    Attributes:
        requests (List[SyncCaptureRequest]): Lista de requisições individuais de sincronização
        batch_id (Optional[str]): Identificador único do lote para rastreamento (opcional)
        client_timestamp (Optional[int]): Timestamp do cliente quando o lote foi criado

    Example:
        >>> batch_request = SyncBatchRequest(
        ...     requests=[
        ...         SyncCaptureRequest(
        ...             pokemonId=25,
        ...             action="favorite",
        ...             timestamp=1704067200000
        ...         ),
        ...         SyncCaptureRequest(
        ...             pokemonId=6,
        ...             action="capture",
        ...             timestamp=1704067201000
        ...         )
        ...     ],
        ...     batch_id="batch_123",
        ...     client_timestamp=1704067200000
        ... )
    """
    requests: List[SyncCaptureRequest]
    batch_id: Optional[str] = None
    client_timestamp: Optional[int] = None


class SyncBatchResponse(BaseModel):
    """
    Schema de resposta da sincronização em lote.

    Fornece informações detalhadas sobre o resultado do processamento
    do lote de sincronização, incluindo métricas de sucesso e falha.

    Attributes:
        success (bool): Indica se o lote foi processado com sucesso
        processed_count (int): Número de requisições processadas com sucesso
        failed_count (int): Número de requisições que falharam
        errors (List[str]): Lista de mensagens de erro detalhadas
        batch_id (Optional[str]): ID do lote processado (se fornecido)

    Example:
        >>> response = SyncBatchResponse(
        ...     success=True,
        ...     processed_count=10,
        ...     failed_count=2,
        ...     errors=["Pokémon 999 não encontrado", "Timestamp inválido"],
        ...     batch_id="batch_123"
        ... )
    """
    success: bool
    processed_count: int
    failed_count: int
    errors: List[str] = []
    batch_id: Optional[str] = None


# ===== SCHEMAS COMPOSTOS E UTILITÁRIOS =====

class UserWithFavorites(User):
    """
    Schema estendido do usuário incluindo seus Pokémons favoritos.

    Útil para endpoints que precisam retornar o usuário com sua lista
    completa de favoritos em uma única resposta.

    Attributes:
        favorites: Lista de Pokémons favoritos do usuário
    """
    favorites: List[FavoritePokemon] = []


class Message(BaseModel):
    """
    Schema para respostas simples com mensagem.

    Usado para endpoints que retornam apenas uma mensagem de confirmação
    ou informação simples.

    Attributes:
        message: Texto da mensagem a ser exibida
    """
    message: str


# ===== SCHEMAS DO SISTEMA PULL-BASED =====

class CaptureData(BaseModel):
    """
    Schema para dados individuais de captura no sistema pull-based.

    Representa uma única operação de captura/favorito armazenada
    no cliente aguardando sincronização com o servidor.

    Este schema é usado para transferir dados entre clientes e o servidor
    no sistema de sincronização pull-based, mantendo rastreabilidade
    completa de cada operação.

    Attributes:
        capture_id (str): Identificador único da captura no cliente (UUID)
        pokemon_id (int): ID do Pokémon na PokeAPI (1-1010+)
        pokemon_name (str): Nome do Pokémon para referência
        action (str): Tipo de ação ('capture', 'favorite' ou 'unfavorite')
        timestamp (Union[int, str]): Timestamp da operação (Unix ou ISO string)
        synced (bool): Status de sincronização (padrão: False)
        created_at (Optional[datetime]): Data de criação no cliente
        metadata (Optional[dict]): Dados adicionais opcionais
        user_id (Optional[str]): ID do usuário associado

    Example:
        >>> capture = CaptureData(
        ...     capture_id="uuid-123-456",
        ...     pokemon_id=25,
        ...     pokemon_name="Pikachu",
        ...     action="favorite",
        ...     timestamp=1704067200000,
        ...     synced=False,
        ...     user_id="user_123"
        ... )
    """
    capture_id: str
    pokemon_id: int
    pokemon_name: str
    action: str
    timestamp: Union[int, str]
    synced: bool = False
    created_at: Optional[datetime] = None
    metadata: Optional[dict] = None
    user_id: Optional[str] = None


class ClientSyncData(BaseModel):
    """
    Schema para dados completos de sincronização de um cliente.

    Representa o estado atual de sincronização de um cliente específico
    incluindo todas as capturas pendentes. Usado para transferir o estado
    completo de um cliente para o servidor.

    Attributes:
        user_id (str): ID do usuário proprietário dos dados
        client_url (Optional[str]): URL do cliente para comunicação
        captures (List[CaptureData]): Lista de capturas pendentes de sincronização
        last_sync (Optional[datetime]): Data e hora da última sincronização bem-sucedida
        total_pending (int): Número total de capturas pendentes

    Example:
        >>> client_data = ClientSyncData(
        ...     user_id="user_123",
        ...     client_url="https://client1.example.com",
        ...     captures=[
        ...         CaptureData(...),
        ...         CaptureData(...)
        ...     ],
        ...     last_sync=datetime(2024, 1, 1, 12, 0, 0),
        ...     total_pending=2
        ... )
    """
    user_id: str
    client_url: Optional[str] = None
    captures: List[CaptureData] = []
    last_sync: Optional[datetime] = None
    total_pending: int = 0


class PullRequest(BaseModel):
    """
    Schema para requisição de pull de dados dos clientes.

    Permite ao servidor solicitar dados de múltiplos clientes
    com filtros opcionais para otimizar a sincronização e reduzir
    a quantidade de dados transferidos.

    Attributes:
        client_urls (List[str]): Lista de URLs dos clientes a serem consultados
        since (Optional[datetime]): Data limite para buscar apenas dados recentes (opcional)
        max_captures (Optional[int]): Número máximo de capturas por cliente (padrão: 100)

    Example:
        >>> pull_request = PullRequest(
        ...     client_urls=[
        ...         "https://client1.example.com",
        ...         "https://client2.example.com"
        ...     ],
        ...     since=datetime(2024, 1, 1, 12, 0, 0),
        ...     max_captures=50
        ... )
    """
    client_urls: List[str] = []
    since: Optional[datetime] = None
    max_captures: Optional[int] = 100


class PullResponse(BaseModel):
    """
    Schema de resposta do processo de pull de dados.

    Fornece informações detalhadas sobre o resultado da operação
    de pull de dados de múltiplos clientes, incluindo métricas
    de performance e detalhes de falhas.

    Attributes:
        success (bool): Indica se a operação foi bem-sucedida
        clients_processed (int): Número de clientes processados com sucesso
        total_captures (int): Total de capturas coletadas
        failed_clients (List[str]): Lista de URLs de clientes que falharam
        errors (List[str]): Lista de mensagens de erro detalhadas
        processing_time (Optional[float]): Tempo total de processamento em segundos

    Example:
        >>> response = PullResponse(
        ...     success=True,
        ...     clients_processed=3,
        ...     total_captures=150,
        ...     failed_clients=["https://client4.example.com"],
        ...     errors=["Timeout ao conectar ao cliente4"],
        ...     processing_time=2.5
        ... )
    """
    success: bool
    clients_processed: int
    total_captures: int
    failed_clients: List[str] = []
    errors: List[str] = []
    processing_time: Optional[float] = None


class ClientRegistration(BaseModel):
    """
    Schema para registro de novo cliente no sistema pull-based.

    Permite que clientes se registrem no servidor para participar
    do processo de sincronização pull-based, estabelecendo uma
    conexão bidirecional para sincronização de dados.

    Attributes:
        client_url (str): URL base do cliente para comunicação HTTPS
        user_id (str): ID do usuário associado ao cliente
        client_type (Optional[str]): Tipo do cliente (padrão: "web")
        capabilities (List[str]): Lista de capacidades suportadas pelo cliente

    Example:
        >>> registration = ClientRegistration(
        ...     client_url="https://mobile-app.example.com",
        ...     user_id="user_123",
        ...     client_type="mobile",
        ...     capabilities=["offline_sync", "push_notifications", "background_sync"]
        ... )
    """
    client_url: str
    user_id: str
    client_type: Optional[str] = "web"
    capabilities: List[str] = []


# ===== SCHEMAS DE ESTATÍSTICAS =====

class PokemonStats(BaseModel):
    """
    Schema para estatísticas detalhadas de um Pokémon.

    Contém todas as estatísticas base de um Pokémon conforme
    a API oficial do Pokémon, representando os valores base
    de cada atributo que determinam o potencial do Pokémon.

    Attributes:
        hp (int): Pontos de vida (Hit Points) do Pokémon
        attack (int): Poder de ataque físico do Pokémon
        defense (int): Resistência física do Pokémon
        special_attack (int): Poder de ataque especial do Pokémon
        special_defense (int): Resistência especial do Pokémon
        speed (int): Velocidade do Pokémon

    Example:
        >>> stats = PokemonStats(
        ...     hp=78,
        ...     attack=84,
        ...     defense=78,
        ...     special_attack=109,
        ...     special_defense=85,
        ...     speed=100
        ... )
    """
    hp: int
    attack: int
    defense: int
    special_attack: int
    special_defense: int
    speed: int
