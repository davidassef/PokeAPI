"""
Middleware e dependências para autenticação JWT.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..services.auth_service import auth_service
from ..models.models import User


# Esquema de autenticação Bearer
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Middleware para obter o usuário atual autenticado.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Verificar token
        token_data = auth_service.verify_token(credentials.credentials)
        if token_data is None:
            raise credentials_exception

        # Buscar usuário no banco
        user = auth_service.get_user_by_id(db, token_data.user_id)
        if user is None:
            raise credentials_exception

        # Verificar se usuário está ativo
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is not active"
            )

        return user

    except Exception:
        raise credentials_exception


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Middleware para obter o usuário atual e verificar se está ativo.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is not active"
        )
    return current_user


def verify_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Middleware para verificar se o usuário atual é admin.
    Nota: Por enquanto, todos os usuários são considerados admin.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is not active"
        )

    # TODO: Implementar sistema de roles/permissões
    # Por enquanto, todos os usuários autenticados são admin
    return current_user


def optional_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User | None:
    """
    Middleware para obter o usuário atual opcional (pode ser None).
    """
    try:
        # Verificar se tem token
        if not credentials:
            return None

        # Verificar token
        token_data = auth_service.verify_token(credentials.credentials)
        if token_data is None:
            return None

        # Buscar usuário no banco
        user = auth_service.get_user_by_id(db, token_data.user_id)
        if user is None or not user.is_active:
            return None

        return user

    except Exception:
        return None
