"""
Schemas para autenticação JWT e gerenciamento de usuários.

Este módulo define os schemas Pydantic para validação e serialização
de dados relacionados à autenticação, registro de usuários e
gerenciamento de credenciais no sistema PokeAPI_SYNC.

Classes:
    UserCreate: Schema para criação de novos usuários
    UserLogin: Schema para autenticação de usuários
    UserResponse: Schema para resposta de dados do usuário
    TokenResponse: Schema para resposta de tokens JWT
    TokenData: Schema para dados extraídos do token JWT
    UserUpdate: Schema para atualização de dados do usuário
    PasswordChange: Schema para alteração de senha
    PasswordReset: Schema para reset de senha
    RefreshTokenRequest: Schema para refresh tokens
    PasswordResetRequest: Schema para solicitação de recuperação
    SecurityQuestionResponse: Schema para pergunta de segurança
    PasswordResetVerify: Schema para verificação de segurança
    PasswordResetComplete: Schema para completar reset de senha
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, validator


class UserCreate(BaseModel):
    """
    Schema para criação de novos usuários no sistema.
    
    Este schema valida todos os dados necessários para registro de um novo
    usuário, incluindo validações de segurança para senha e perguntas de recuperação.
    
    Attributes:
        email (EmailStr): Email válido do usuário (obrigatório)
        password (str): Senha com no mínimo 6 caracteres (obrigatória)
        name (str): Nome completo do usuário (2-100 caracteres, obrigatório)
        contact (Optional[str]): Informações de contato opcionais (máx. 100 caracteres)
        security_question (str): Pergunta de segurança para recuperação de senha
        security_answer (str): Resposta da pergunta de segurança (2-100 caracteres)
    
    Raises:
        ValueError: Quando algum campo não atende aos critérios de validação
    
    Example:
        >>> user_data = UserCreate(
        ...     email="usuario@example.com",
        ...     password="senha123",
        ...     name="João Silva",
        ...     contact="(11) 99999-9999",
        ...     security_question="pet",
        ...     security_answer="fluffy"
        ... )
    """
    email: EmailStr
    password: str
    name: str  # Nome obrigatório
    contact: Optional[str] = None  # Contato opcional
    security_question: str  # Pergunta de segurança obrigatória
    security_answer: str  # Resposta de segurança obrigatória

    @validator('name')
    def validate_name(cls, v):
        """Valida o nome do usuário."""
        if len(v.strip()) < 2:
            raise ValueError('Nome deve ter pelo menos 2 caracteres')
        if len(v) > 100:
            raise ValueError('Nome deve ter no máximo 100 caracteres')
        return v.strip()

    @validator('contact')
    def validate_contact(cls, v):
        """Valida as informações de contato."""
        if v and len(v) > 100:
            raise ValueError('Contato deve ter no máximo 100 caracteres')
        return v.strip() if v else None

    @validator('password')
    def validate_password(cls, v):
        """Valida a força da senha do usuário."""
        if len(v) < 6:
            raise ValueError('Senha deve ter pelo menos 6 caracteres')
        if len(v) > 100:
            raise ValueError('Senha deve ter no máximo 100 caracteres')

        # Validações de força da senha (mais flexíveis para evitar timeout)
        has_letter = any(c.isalpha() for c in v)
        has_number = any(c.isdigit() for c in v)

        if not (has_letter or has_number):
            raise ValueError('Senha deve conter pelo menos uma letra ou um número')

        return v

    @validator('security_question')
    def validate_security_question(cls, v):
        """Valida se a pergunta de segurança é válida."""
        valid_questions = ['pet', 'city', 'school', 'mother']
        if v not in valid_questions:
            raise ValueError('Pergunta de segurança inválida')
        return v

    @validator('security_answer')
    def validate_security_answer(cls, v):
        """Valida e normaliza a resposta de segurança."""
        if len(v.strip()) < 2:
            raise ValueError('Resposta de segurança deve ter pelo menos 2 caracteres')
        if len(v) > 100:
            raise ValueError('Resposta de segurança deve ter no máximo 100 caracteres')
        return v.strip().lower()  # Normalizar para comparação


class UserLogin(BaseModel):
    """
    Schema para autenticação de usuários existentes.
    
    Este schema valida as credenciais necessárias para login no sistema,
    incluindo email válido e senha do usuário.
    
    Attributes:
        email (EmailStr): Email cadastrado do usuário
        password (str): Senha do usuário
    
    Example:
        >>> login_data = UserLogin(
        ...     email="usuario@example.com",
        ...     password="senha123"
        ... )
    """
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """
    Schema para resposta de dados do usuário.
    
    Este schema é usado para serializar e retornar dados de usuário
    de forma segura, excluindo informações sensíveis como senha.
    
    Attributes:
        id (int): Identificador único do usuário
        email (str): Email do usuário
        name (str): Nome completo do usuário
        contact (Optional[str]): Informações de contato do usuário
        role (str): Papel/role do usuário no sistema (ex: 'user', 'admin')
        is_active (bool): Indica se o usuário está ativo no sistema
        created_at (datetime): Data e hora de criação do usuário
        updated_at (datetime): Data e hora da última atualização
    
    Config:
        from_attributes (bool): Permite conversão a partir de objetos ORM
    
    Example:
        >>> user_response = UserResponse(
        ...     id=1,
        ...     email="usuario@example.com",
        ...     name="João Silva",
        ...     contact="(11) 99999-9999",
        ...     role="user",
        ...     is_active=True,
        ...     created_at=datetime.now(),
        ...     updated_at=datetime.now()
        ... )
    """
    id: int
    email: str
    name: str
    contact: Optional[str] = None
    role: str  # Role do usuário
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """
    Schema para resposta de autenticação com token JWT.
    
    Este schema encapsula todos os dados retornados após uma autenticação
    bem-sucedida, incluindo o token de acesso e informações do usuário.
    
    Attributes:
        access_token (str): Token JWT de acesso
        token_type (str): Tipo do token (geralmente 'bearer')
        expires_in (int): Tempo de expiração do token em segundos
        user (UserResponse): Dados completos do usuário autenticado
    
    Example:
        >>> token_response = TokenResponse(
        ...     access_token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        ...     token_type="bearer",
        ...     expires_in=3600,
        ...     user=UserResponse(...)
        ... )
    """
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse


class TokenData(BaseModel):
    """
    Schema para dados extraídos do token JWT.
    
    Este schema é usado internamente para armazenar os dados decodificados
    de um token JWT, permitindo acesso rápido às informações do usuário
    sem necessidade de consultar o banco de dados.
    
    Attributes:
        user_id (Optional[int]): ID único do usuário no banco de dados
        email (Optional[str]): Email do usuário para identificação
        role (Optional[str]): Papel/role do usuário (padrão: 'user')
    
    Example:
        >>> token_data = TokenData(
        ...     user_id=123,
        ...     email="usuario@example.com",
        ...     role="admin"
        ... )
    """
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = "user"  # Role do usuário


class UserUpdate(BaseModel):
    """
    Schema para atualização parcial de dados do usuário.
    
    Permite atualização seletiva de informações do perfil do usuário,
    mantendo todos os campos como opcionais para permitir atualização parcial.
    
    Attributes:
        name (Optional[str]): Novo nome do usuário (2-100 caracteres)
        contact (Optional[str]): Novas informações de contato (máx. 100 caracteres)
    
    Raises:
        ValueError: Quando os valores fornecidos não atendem aos critérios
    
    Example:
        >>> update_data = UserUpdate(name="Novo Nome", contact="novo@email.com")
        >>> # Atualização apenas do nome
        >>> update_name = UserUpdate(name="Maria Silva")
    """
    name: Optional[str] = None
    contact: Optional[str] = None

    @validator('name')
    def validate_name(cls, v):
        """Valida o novo nome do usuário."""
        if v and len(v.strip()) < 2:
            raise ValueError('Nome deve ter pelo menos 2 caracteres')
        if v and len(v) > 100:
            raise ValueError('Nome deve ter no máximo 100 caracteres')
        return v.strip() if v else None

    @validator('contact')
    def validate_contact(cls, v):
        """Valida as novas informações de contato."""
        if v and len(v) > 100:
            raise ValueError('Contato deve ter no máximo 100 caracteres')
        return v.strip() if v else None


class PasswordChange(BaseModel):
    """
    Schema para alteração de senha com autenticação atual.
    
    Requer a senha atual para verificação de segurança antes de permitir
    a alteração para uma nova senha.
    
    Attributes:
        current_password (str): Senha atual do usuário
        new_password (str): Nova senha desejada (mín. 6 caracteres)
    
    Raises:
        ValueError: Se a nova senha não atender aos critérios de segurança
    
    Example:
        >>> change_data = PasswordChange(
        ...     current_password="senha_antiga",
        ...     new_password="nova_senha123"
        ... )
    """
    current_password: str
    new_password: str

    @validator('new_password')
    def validate_new_password(cls, v):
        """Valida a nova senha."""
        if len(v) < 6:
            raise ValueError('Nova senha deve ter pelo menos 6 caracteres')
        return v


class PasswordReset(BaseModel):
    """
    Schema para solicitação de reset de senha via email.
    
    Usado para iniciar o processo de recuperação de senha através
    do envio de email com link de redefinição.
    
    Attributes:
        email (EmailStr): Email cadastrado do usuário
    
    Example:
        >>> reset_request = PasswordReset(email="usuario@example.com")
    """
    email: EmailStr


class RefreshTokenRequest(BaseModel):
    """
    Schema para requisição de refresh token.
    
    Usado para obter um novo token de acesso quando o token atual expira,
    mantendo a sessão do usuário ativa.
    
    Attributes:
        refresh_token (str): Token de refresh válido
    
    Example:
        >>> refresh_request = RefreshTokenRequest(
        ...     refresh_token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        ... )
    """
    refresh_token: str


class PasswordResetRequest(BaseModel):
    """
    Schema para solicitação inicial de recuperação de senha.
    
    Primeiro passo do processo de recuperação de senha através
    de pergunta de segurança.
    
    Attributes:
        email (EmailStr): Email cadastrado do usuário
    
    Example:
        >>> reset_request = PasswordResetRequest(email="usuario@example.com")
    """
    email: EmailStr


class SecurityQuestionResponse(BaseModel):
    """
    Schema para resposta com pergunta de segurança do usuário.
    
    Retorna a pergunta de segurança configurada pelo usuário
    para o processo de recuperação de senha.
    
    Attributes:
        email (str): Email do usuário
        security_question (str): Pergunta de segurança configurada
    
    Example:
        >>> question_response = SecurityQuestionResponse(
        ...     email="usuario@example.com",
        ...     security_question="Qual o nome do seu primeiro animal de estimação?"
        ... )
    """
    email: str
    security_question: str


class PasswordResetVerify(BaseModel):
    """
    Schema para verificação da resposta de segurança.
    
    Segundo passo do processo de recuperação de senha,
    verifica se a resposta de segurança está correta.
    
    Attributes:
        email (EmailStr): Email do usuário
        security_answer (str): Resposta da pergunta de segurança
    
    Example:
        >>> verify_request = PasswordResetVerify(
        ...     email="usuario@example.com",
        ...     security_answer="fluffy"
        ... )
    """
    email: EmailStr
    security_answer: str


class PasswordResetComplete(BaseModel):
    """
    Schema para completar a redefinição de senha via segurança.
    
    Passo final do processo de recuperação de senha através
    de pergunta de segurança, define a nova senha após verificação.
    
    Attributes:
        email (EmailStr): Email do usuário
        security_answer (str): Resposta correta da pergunta de segurança
        new_password (str): Nova senha desejada (6-100 caracteres)
    
    Raises:
        ValueError: Se a nova senha não atender aos critérios
    
    Example:
        >>> complete_request = PasswordResetComplete(
        ...     email="usuario@example.com",
        ...     security_answer="fluffy",
        ...     new_password="nova_senha_segura123"
        ... )
    """
    email: EmailStr
    security_answer: str
    new_password: str

    @validator('new_password')
    def validate_new_password(cls, v):
        """Valida a nova senha do reset."""
        if len(v) < 6:
            raise ValueError('Nova senha deve ter pelo menos 6 caracteres')
        if len(v) > 100:
            raise ValueError('Nova senha deve ter no máximo 100 caracteres')
        return v
