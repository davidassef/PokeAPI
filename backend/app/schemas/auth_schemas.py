"""
Schemas para autenticação JWT.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, validator


class UserCreate(BaseModel):
    """Schema para criação de usuário."""
    email: EmailStr
    password: str
    name: str  # Nome obrigatório
    contact: Optional[str] = None  # Contato opcional
    security_question: str  # Pergunta de segurança obrigatória
    security_answer: str  # Resposta de segurança obrigatória

    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Nome deve ter pelo menos 2 caracteres')
        if len(v) > 100:
            raise ValueError('Nome deve ter no máximo 100 caracteres')
        return v.strip()

    @validator('contact')
    def validate_contact(cls, v):
        if v and len(v) > 100:
            raise ValueError('Contato deve ter no máximo 100 caracteres')
        return v.strip() if v else None

    @validator('password')
    def validate_password(cls, v):
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
        valid_questions = ['pet', 'city', 'school', 'mother']
        if v not in valid_questions:
            raise ValueError('Pergunta de segurança inválida')
        return v

    @validator('security_answer')
    def validate_security_answer(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Resposta de segurança deve ter pelo menos 2 caracteres')
        if len(v) > 100:
            raise ValueError('Resposta de segurança deve ter no máximo 100 caracteres')
        return v.strip().lower()  # Normalizar para comparação


class UserLogin(BaseModel):
    """Schema para login de usuário."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema para resposta de usuário."""
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
    """Schema para resposta de token JWT."""
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse


class TokenData(BaseModel):
    """Schema para dados do token JWT."""
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = "user"  # Role do usuário


class UserUpdate(BaseModel):
    """Schema para atualização de usuário."""
    name: Optional[str] = None
    contact: Optional[str] = None

    @validator('name')
    def validate_name(cls, v):
        if v and len(v.strip()) < 2:
            raise ValueError('Nome deve ter pelo menos 2 caracteres')
        if v and len(v) > 100:
            raise ValueError('Nome deve ter no máximo 100 caracteres')
        return v.strip() if v else None

    @validator('contact')
    def validate_contact(cls, v):
        if v and len(v) > 100:
            raise ValueError('Contato deve ter no máximo 100 caracteres')
        return v.strip() if v else None


class PasswordChange(BaseModel):
    """Schema para mudança de senha."""
    current_password: str
    new_password: str

    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 6:
            raise ValueError('Nova senha deve ter pelo menos 6 caracteres')
        return v


class PasswordReset(BaseModel):
    """Schema para reset de senha."""
    email: EmailStr


class RefreshTokenRequest(BaseModel):
    """Schema para requisição de refresh token."""
    refresh_token: str


class PasswordResetRequest(BaseModel):
    """Schema para solicitação de recuperação de senha."""
    email: EmailStr


class SecurityQuestionResponse(BaseModel):
    """Schema para resposta da pergunta de segurança."""
    email: str
    security_question: str


class PasswordResetVerify(BaseModel):
    """Schema para verificação da resposta de segurança."""
    email: EmailStr
    security_answer: str


class PasswordResetComplete(BaseModel):
    """Schema para completar a redefinição de senha."""
    email: EmailStr
    security_answer: str
    new_password: str

    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 6:
            raise ValueError('Nova senha deve ter pelo menos 6 caracteres')
        if len(v) > 100:
            raise ValueError('Nova senha deve ter no máximo 100 caracteres')
        return v
