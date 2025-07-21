"""
Sistema de controle de acesso baseado em roles (RBAC).
"""
from enum import Enum
from functools import wraps
from typing import List, Optional, Callable, Any
from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session

from app.models.models import User, UserRole
from app.core.database import get_db
from app.core.auth_middleware import get_current_active_user


class Permission(str, Enum):
    """Enum para permissões do sistema."""

    # Permissões públicas (sem autenticação necessária)
    VIEW_POKEMON_LIST = "view_pokemon_list"
    VIEW_POKEMON_DETAILS = "view_pokemon_details"
    USE_SEARCH_FILTERS = "use_search_filters"
    VIEW_RANKING = "view_ranking"

    # Permissões de usuário autenticado
    CAPTURE_POKEMON = "capture_pokemon"
    MANAGE_PERSONAL_COLLECTION = "manage_personal_collection"
    VIEW_CAPTURED_POKEMON = "view_captured_pokemon"
    UPDATE_PROFILE = "update_profile"
    TRACK_VIEWING_PROGRESS = "track_viewing_progress"

    # Permissões administrativas
    ADD_POKEMON = "add_pokemon"
    EDIT_POKEMON = "edit_pokemon"
    DELETE_POKEMON = "delete_pokemon"
    MANAGE_USERS = "manage_users"
    ACCESS_ADMIN_DASHBOARD = "access_admin_dashboard"
    MANAGE_USER_ROLES = "manage_user_roles"


class RBACService:
    """Serviço para controle de acesso baseado em roles."""

    # Mapeamento de roles para permissões
    ROLE_PERMISSIONS = {
        UserRole.VISITOR: [
            Permission.VIEW_POKEMON_LIST,
            Permission.VIEW_POKEMON_DETAILS,
            Permission.USE_SEARCH_FILTERS,
            Permission.VIEW_RANKING,
        ],
        UserRole.USER: [
            # Inclui todas as permissões de visitante
            Permission.VIEW_POKEMON_LIST,
            Permission.VIEW_POKEMON_DETAILS,
            Permission.USE_SEARCH_FILTERS,
            Permission.VIEW_RANKING,
            # Mais permissões específicas de usuário
            Permission.CAPTURE_POKEMON,
            Permission.MANAGE_PERSONAL_COLLECTION,
            Permission.VIEW_CAPTURED_POKEMON,
            Permission.UPDATE_PROFILE,
            Permission.TRACK_VIEWING_PROGRESS,
        ],
        UserRole.ADMINISTRATOR: [
            # Inclui todas as permissões de usuário
            Permission.VIEW_POKEMON_LIST,
            Permission.VIEW_POKEMON_DETAILS,
            Permission.USE_SEARCH_FILTERS,
            Permission.VIEW_RANKING,
            Permission.CAPTURE_POKEMON,
            Permission.MANAGE_PERSONAL_COLLECTION,
            Permission.VIEW_CAPTURED_POKEMON,
            Permission.UPDATE_PROFILE,
            Permission.TRACK_VIEWING_PROGRESS,
            # Mais permissões administrativas
            Permission.ADD_POKEMON,
            Permission.EDIT_POKEMON,
            Permission.DELETE_POKEMON,
            Permission.MANAGE_USERS,
            Permission.ACCESS_ADMIN_DASHBOARD,
            Permission.MANAGE_USER_ROLES,
        ]
    }

    @classmethod
    def has_permission(cls, user_role: UserRole, permission: Permission) -> bool:
        """Verifica se um role tem uma permissão específica."""
        role_permissions = cls.ROLE_PERMISSIONS.get(user_role, [])
        return permission in role_permissions

    @classmethod
    def get_user_permissions(cls, user_role: UserRole) -> List[Permission]:
        """Obtém todas as permissões de um role."""
        return cls.ROLE_PERMISSIONS.get(user_role, [])

    @classmethod
    def is_admin(cls, user_role: UserRole) -> bool:
        """Verifica se o role é de administrador."""
        return user_role == UserRole.ADMINISTRATOR

    @classmethod
    def can_manage_pokemon(cls, user_role: UserRole) -> bool:
        """Verifica se o usuário pode gerenciar Pokemon."""
        return cls.has_permission(user_role, Permission.ADD_POKEMON) or \
               cls.has_permission(user_role, Permission.EDIT_POKEMON) or \
               cls.has_permission(user_role, Permission.DELETE_POKEMON)

    @classmethod
    def can_manage_users(cls, user_role: UserRole) -> bool:
        """Verifica se o usuário pode gerenciar outros usuários."""
        return cls.has_permission(user_role, Permission.MANAGE_USERS)


def require_role(required_role: UserRole):
    """
    Decorator para exigir um role específico.

    Args:
        required_role: Role mínimo necessário

    Usage:
        @require_role(UserRole.ADMINISTRATOR)
        async def admin_only_endpoint():
            pass
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extrair current_user dos kwargs ou args
            current_user = None

            # Procurar current_user nos kwargs
            if 'current_user' in kwargs:
                current_user = kwargs['current_user']
            else:
                # Procurar nos args (menos comum)
                for arg in args:
                    if isinstance(arg, User):
                        current_user = arg
                        break

            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            user_role = UserRole(current_user.role)

            # Verificar hierarquia de roles
            role_hierarchy = {
                UserRole.VISITOR: 0,
                UserRole.USER: 1,
                UserRole.ADMINISTRATOR: 2
            }

            required_level = role_hierarchy.get(required_role, 0)
            user_level = role_hierarchy.get(user_role, 0)

            if user_level < required_level:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role '{required_role.value}' or higher required"
                )

            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_permission(permission: Permission):
    """
    Decorator para exigir uma permissão específica.

    Args:
        permission: Permissão necessária

    Usage:
        @require_permission(Permission.ADD_POKEMON)
        async def create_pokemon():
            pass
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extrair current_user dos kwargs ou args
            current_user = None

            if 'current_user' in kwargs:
                current_user = kwargs['current_user']
            else:
                for arg in args:
                    if isinstance(arg, User):
                        current_user = arg
                        break

            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            user_role = UserRole(current_user.role)

            if not RBACService.has_permission(user_role, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission '{permission.value}' required"
                )

            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_admin():
    """
    Decorator para exigir role de administrador.

    Usage:
        @require_admin()
        async def admin_endpoint():
            pass
    """
    return require_role(UserRole.ADMINISTRATOR)


def get_current_user_role(
    current_user: User = Depends(get_current_active_user)
) -> UserRole:
    """Dependency para obter o role do usuário atual."""
    return UserRole(current_user.role)


def get_current_user_permissions(
    current_user: User = Depends(get_current_active_user)
) -> List[Permission]:
    """Dependency para obter as permissões do usuário atual."""
    user_role = UserRole(current_user.role)
    return RBACService.get_user_permissions(user_role)


def check_permission(
    permission: Permission,
    current_user: User = Depends(get_current_active_user)
) -> bool:
    """Dependency para verificar se o usuário tem uma permissão específica."""
    user_role = UserRole(current_user.role)
    return RBACService.has_permission(user_role, permission)


def require_authenticated_user():
    """
    Decorator para exigir usuário autenticado (qualquer role).

    Usage:
        @require_authenticated_user()
        async def authenticated_endpoint():
            pass
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = None

            if 'current_user' in kwargs:
                current_user = kwargs['current_user']
            else:
                for arg in args:
                    if isinstance(arg, User):
                        current_user = arg
                        break

            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            if not current_user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User account is inactive"
                )

            return await func(*args, **kwargs)
        return wrapper
    return decorator


# Instância global do serviço RBAC
rbac_service = RBACService()
