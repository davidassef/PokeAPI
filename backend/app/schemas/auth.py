"""
Schemas Pydantic para autenticação JWT no sistema PokeAPI_SYNC.

Este módulo define todos os schemas necessários para autenticação,
registro, login e gerenciamento de tokens JWT.

Classes:
    UserRegister: Schema para registro de novos usuários
    UserLogin: Schema para autenticação de usuários existentes
    Token: Schema para resposta de tokens JWT
    TokenData: Schema para dados decodificados do token
    UserProfile: Schema para perfil público do usuário
    PasswordChange: Schema para alteração de senha
    PasswordReset: Schema para solicitação de reset de senha
    TokenRefresh: Schema para renovação de tokens

Example:
    >>> from app.schemas.auth import UserRegister
    >>> user_data = UserRegister(
    ...     username="pokeuser",
    ...     email="user@example.com",
    ...     password="securepass123",
    ...     full_name="Pokémon User"
    ... )
"""


class UserRegister(BaseModel):
    """
    Schema para registro de novos usuários no sistema.
    
    Este schema valida todos os dados necessários para criar uma nova conta,
    garantindo que o username seja único, email válido e senha segura.
    
    Attributes:
        username: Nome de usuário único no sistema (3-50 caracteres)
        email: Endereço de email válido e único
        password: Senha com no mínimo 6 caracteres
        full_name: Nome completo opcional do usuário (máx. 100 caracteres)
        
    Raises:
        ValueError: Se username ou email já existirem no sistema
        
    Example:
        >>> user = UserRegister(
        ...     username="ashketchum",
        ...     email="ash@pokemon.com",
        ...     password="pikachu123",
        ...     full_name="Ash Ketchum"
        ... )
    """
    username: str = Field(..., min_length=3, max_length=50, description="Nome de usuário único")
    email: EmailStr = Field(..., description="Email válido")
    password: str = Field(..., min_length=6, description="Senha com pelo menos 6 caracteres")
    full_name: Optional[str] = Field(None, max_length=100, description="Nome completo do usuário")


class UserLogin(BaseModel):
    """
    Schema para autenticação de usuários existentes.
    
    Define os dados mínimos necessários para realizar login no sistema,
    validando credenciais contra o banco de dados.
    
    Attributes:
        username: Nome de usuário cadastrado no sistema
        password: Senha do usuário (em texto plano, será verificada com hash)
        
    Example:
        >>> login = UserLogin(
        ...     username="ashketchum",
        ...     password="pikachu123"
        ... )
    """
    username: str = Field(..., description="Nome de usuário")
    password: str = Field(..., description="Senha")


class Token(BaseModel):
    """
    Schema para resposta de autenticação bem-sucedida.
    
    Contém o token JWT gerado após login bem-sucedido, incluindo
    informações sobre expiração e perfil do usuário autenticado.
    
    Attributes:
        access_token: Token JWT de acesso para autenticação nas APIs
        token_type: Tipo do token (sempre 'bearer' para JWT)
        expires_in: Tempo de expiração do token em segundos
        user: Perfil completo do usuário autenticado
        
    Example:
        >>> token = Token(
        ...     access_token="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        ...     token_type="bearer",
        ...     expires_in=3600,
        ...     user=UserProfile(...)
        ... )
    """
    access_token: str = Field(..., description="Token de acesso JWT")
    token_type: str = Field(default="bearer", description="Tipo do token")
    expires_in: int = Field(..., description="Tempo de expiração em segundos")
    user: "UserProfile" = Field(..., description="Dados do usuário")


class TokenData(BaseModel):
    """
    Schema para dados decodificados de um token JWT.
    
    Representa as informações extraídas de um token JWT válido,
    usadas internamente para identificar o usuário autenticado.
    
    Attributes:
        user_id: ID único do usuário no banco de dados
        username: Nome de usuário para referência
        
    Example:
        >>> token_data = TokenData(
        ...     user_id=123,
        ...     username="ashketchum"
        ... )
    """
    user_id: Optional[int] = Field(None, description="ID único do usuário")
    username: Optional[str] = Field(None, description="Nome de usuário")


class UserProfile(BaseModel):
    """
    Schema para perfil público do usuário.
    
    Representa os dados do usuário que podem ser retornados
    publicamente após autenticação, sem expor informações sensíveis.
    
    Attributes:
        id: Identificador único do usuário no sistema
        username: Nome de usuário único
        email: Endereço de email do usuário
        full_name: Nome completo do usuário (opcional)
        is_active: Status de ativação da conta
        created_at: Data e hora do registro do usuário
        updated_at: Data e hora da última atualização
        
    Example:
        >>> profile = UserProfile(
        ...     id=123,
        ...     username="ashketchum",
        ...     email="ash@pokemon.com",
        ...     full_name="Ash Ketchum",
        ...     is_active=True,
        ...     created_at=datetime(2024, 1, 1, 10, 0, 0),
        ...     updated_at=datetime(2024, 1, 15, 14, 30, 0)
        ... )
    """
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PasswordChange(BaseModel):
    """
    Schema para alteração de senha por usuário autenticado.
    
    Requer a senha atual para verificação e a nova senha
    que deve atender aos requisitos mínimos de segurança.
    
    Attributes:
        current_password: Senha atual do usuário (para verificação)
        new_password: Nova senha com no mínimo 6 caracteres
        
    Example:
        >>> change = PasswordChange(
        ...     current_password="oldpass123",
        ...     new_password="newsecurepass456"
        ... )
    """
    current_password: str = Field(..., description="Senha atual")
    new_password: str = Field(..., min_length=6, description="Nova senha com pelo menos 6 caracteres")


class PasswordReset(BaseModel):
    """
    Schema para solicitação de reset de senha.
    
    Usado quando o usuário esqueceu a senha e deseja
    receber um email com instruções para redefinição.
    
    Attributes:
        email: Endereço de email cadastrado no sistema
        
    Example:
        >>> reset = PasswordReset(
        ...     email="user@example.com"
        ... )
    """
    email: EmailStr = Field(..., description="Email para reset de senha")


class TokenRefresh(BaseModel):
    """
    Schema para renovação de tokens JWT expirados.
    
    Permite que usuários autenticados obtenham um novo token
    de acesso sem precisar fazer login novamente.
    
    Attributes:
        refresh_token: Token de refresh válido previamente fornecido
        
    Example:
        >>> refresh = TokenRefresh(
        ...     refresh_token="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
        ... )
    """
    refresh_token: str = Field(..., description="Token de refresh")
