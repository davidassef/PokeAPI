"""
Schemas para autenticação JWT.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    """Schema para registro de usuário."""
    username: str = Field(..., min_length=3, max_length=50, description="Nome de usuário único")
    email: EmailStr = Field(..., description="Email válido")
    password: str = Field(..., min_length=6, description="Senha com pelo menos 6 caracteres")
    full_name: Optional[str] = Field(None, max_length=100, description="Nome completo do usuário")


class UserLogin(BaseModel):
    """Schema para login de usuário."""
    username: str = Field(..., description="Nome de usuário")
    password: str = Field(..., description="Senha")


class Token(BaseModel):
    """Schema para token JWT."""
    access_token: str = Field(..., description="Token de acesso JWT")
    token_type: str = Field(default="bearer", description="Tipo do token")
    expires_in: int = Field(..., description="Tempo de expiração em segundos")
    user: "UserProfile" = Field(..., description="Dados do usuário")


class TokenData(BaseModel):
    """Schema para dados do token JWT."""
    user_id: Optional[int] = None
    username: Optional[str] = None


class UserProfile(BaseModel):
    """Schema para perfil do usuário."""
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
    """Schema para mudança de senha."""
    current_password: str = Field(..., description="Senha atual")
    new_password: str = Field(..., min_length=6, description="Nova senha com pelo menos 6 caracteres")


class PasswordReset(BaseModel):
    """Schema para reset de senha."""
    email: EmailStr = Field(..., description="Email para reset de senha")


class TokenRefresh(BaseModel):
    """Schema para refresh do token."""
    refresh_token: str = Field(..., description="Token de refresh")
