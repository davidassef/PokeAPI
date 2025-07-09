"""
Rotas de autenticação JWT.
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse

from app.core.database import get_db
from app.core.auth_middleware import get_current_user, get_current_active_user
from app.services.auth_service import auth_service
from app.schemas.auth_schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    UserUpdate, PasswordChange, RefreshTokenRequest
)
from app.models.models import User
from app.core.config import settings
from jose import jwt

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registra um novo usuário.
    """
    try:
        user = auth_service.create_user(db, user_data)
        return UserResponse.from_orm(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=TokenResponse)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Autentica um usuário e retorna o token JWT.
    """
    user = auth_service.authenticate_user(
        db, user_credentials.email, user_credentials.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário inativo"
        )

    # Criar tokens
    access_token_expires = timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=access_token_expires
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.from_orm(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """
    Obtém o perfil do usuário atual.
    """
    return UserResponse.from_orm(current_user)


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    updated_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Atualiza o perfil do usuário atual.
    """
    # Atualizar campos permitidos
    if updated_data.name is not None:
        current_user.name = updated_data.name

    if updated_data.contact is not None:
        current_user.contact = updated_data.contact

    db.commit()
    db.refresh(current_user)

    return UserResponse.from_orm(current_user)


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Altera a senha do usuário atual.
    """
    # Verificar senha atual
    if not auth_service.verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )

    # Atualizar senha
    auth_service.update_user_password(db, current_user, password_data.new_password)

    return {"message": "Password updated successfully"}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Atualiza o token JWT usando o refresh token.
    """
    # Verificar refresh token
    token_data = auth_service.verify_token(refresh_data.refresh_token, "refresh")

    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Buscar usuário
    user = auth_service.get_user_by_id(db, token_data.user_id)

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    # Criar novo token de acesso
    access_token_expires = timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=access_token_expires
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.from_orm(user)
    )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    """
    Logout do usuário (no cliente, remove o token).
    """
    return {"message": "Logout successful"}


@router.get("/validate-token")
async def validate_token(current_user: User = Depends(get_current_active_user)):
    """
    Valida se o token atual é válido.
    """
    return {
        "valid": True,
        "user": UserResponse.from_orm(current_user)
    }


@router.put("/profile")
async def update_profile(
    updated_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Atualiza o perfil do usuário autenticado (nome/email).
    Retorna novo token JWT se houver alteração.
    """
    if updated_data.name is not None:
        current_user.name = updated_data.name
    if updated_data.contact is not None:
        current_user.contact = updated_data.contact
    db.commit()
    db.refresh(current_user)
    # Gerar novo token JWT
    access_token = auth_service.create_access_token(
        data={"sub": current_user.id, "email": current_user.email, "name": current_user.name},
        expires_delta=timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"token": access_token, "user": UserResponse.from_orm(current_user)}

@router.get("/google")
async def login_with_google():
    """
    Mock de login social Google. Em produção, implemente OAuth2.
    """
    # Simula usuário Google
    user_id = 9999
    email = "googleuser@pokeapi.com"
    name = "Google User"
    access_token = auth_service.create_access_token(
        data={"sub": user_id, "email": email, "name": name},
        expires_delta=timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"token": access_token, "user": {"id": user_id, "email": email, "name": name}}
