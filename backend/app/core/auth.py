"""
Dependências para autenticação JWT.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User
from app.services.auth_service import auth_service

# Security scheme para JWT
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependência para obter o usuário atual autenticado.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        token_data = auth_service.verify_token(token)

        if token_data is None:
            raise credentials_exception

        user = db.query(User).filter(User.id == token_data.user_id).first()

        if user is None:
            raise credentials_exception

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Inactive user"
            )

        return user

    except Exception:
        raise credentials_exception


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependência para obter o usuário atual ativo.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependência para obter o usuário atual se for admin.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # Por simplicidade, vamos considerar que usuários com email contendo "admin" são administradores
    # Em uma implementação real, isso seria um campo específico na tabela User
    if "admin" not in current_user.email.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    return current_user


def optional_authentication(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependência opcional para autenticação.
    Retorna o usuário se autenticado, None caso contrário.
    """
    if not credentials:
        return None

    try:
        token = credentials.credentials
        token_data = auth_service.verify_token(token)

        if token_data is None:
            return None

        user = db.query(User).filter(User.id == token_data.user_id).first()

        if user is None or not user.is_active:
            return None

        return user

    except Exception:
        return None
