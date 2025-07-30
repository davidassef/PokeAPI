"""
Módulo de autenticação JWT para o sistema PokeAPI_SYNC.

Este módulo fornece dependências FastAPI para autenticação baseada em JWT,
incluindo validação de tokens, verificação de usuários ativos e
controle de acesso baseado em roles.

Funcionalidades:
- Validação de tokens JWT via Bearer authentication
- Recuperação do usuário atual autenticado
- Verificação de status ativo do usuário
- Controle de acesso para administradores
- Logging detalhado de eventos de autenticação

Exemplo de uso:
    ```python
    from fastapi import Depends, APIRouter
    from app.core.auth import get_current_user, get_current_admin_user
    
    router = APIRouter()
    
    @router.get("/profile")
    async def get_profile(current_user: User = Depends(get_current_user)):
        return {"email": current_user.email}
    
    @router.get("/admin/users")
    async def list_users(admin_user: User = Depends(get_current_admin_user)):
        return {"users": []}
    ```

Dependências:
    - FastAPI: Framework web para APIs
    - SQLAlchemy: ORM para interação com banco de dados
    - python-jose: Biblioteca para JWT
"""
import logging
from datetime import datetime
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User
from app.services.auth_service import auth_service

# Security scheme para JWT
# Instância global do esquema de segurança HTTP Bearer para validação de tokens JWT
# Usada automaticamente pelo FastAPI para extrair o token do header Authorization
security = HTTPBearer()

# Configuração de logging
logger = logging.getLogger(__name__)

# Exceção padrão para credenciais inválidas
# HTTPException pré-configurada para ser usada em casos de autenticação falha
# Inclui headers apropriados para autenticação Bearer conforme RFC 6750
CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Dependência para obter o usuário atual autenticado.

    Args:
        credentials: Credenciais de autenticação (token JWT)
        db: Sessão do banco de dados

    Returns:
        User: O usuário autenticado

    Raises:
        HTTPException: Se as credenciais forem inválidas ou o usuário não existir
    """
    logger.info("Validando autenticação")

    try:
        # Verifica se o token está presente
        if not credentials or not credentials.credentials:
            logger.warning("Token não fornecido")
            raise CREDENTIALS_EXCEPTION

        token = credentials.credentials

        # Verifica se o token está no formato correto
        if not token or not isinstance(token, str) or not token.strip():
            logger.warning("Token inválido: formato incorreto")
            raise CREDENTIALS_EXCEPTION

        logger.info("Token recebido: %s...", token[:15])
        logger.debug("Headers da requisição: %s", dict(credentials.__dict__))

        # Verifica o token
        logger.info("Verificando token JWT")
        token_data = auth_service.verify_token(token)

        if token_data is None:
            logger.warning("Token inválido ou expirado")

            # Tenta decodificar o token para obter mais informações
            try:
                from jose import jwt

                # Decodifica sem verificar a assinatura
                payload = jwt.get_unverified_claims(token)
                logger.warning(
                    "Token inválido - Payload: %s",
                    payload
                )

                if 'exp' in payload:
                    exp_time = datetime.utcfromtimestamp(payload['exp'])
                    current_time = datetime.utcnow()
                    logger.warning(
                        "Token expirou em: %s (UTC), tempo atual: %s (UTC)",
                        exp_time.isoformat(),
                        current_time.isoformat()
                    )

            except Exception as decode_error:
                logger.error(
                    "Erro ao decodificar token: %s",
                    str(decode_error)
                )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido ou expirado",
                headers={"WWW-Authenticate": "Bearer"},
            )

        logger.info(
            "Token válido para o usuário ID: %s",
            token_data.user_id
        )

        # Busca o usuário no banco de dados
        logger.info(
            "Buscando usuário ID: %s",
            token_data.user_id
        )
        user = db.query(User).filter(
            User.id == token_data.user_id
        ).first()

        if user is None:
            logger.warning(
                "Usuário não encontrado para o ID: %s",
                token_data.user_id
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )

        logger.info(
            "Usuário encontrado: %s (ID: %s, Ativo: %s)",
            user.email, user.id, user.is_active
        )

        # Verifica se o usuário está ativo
        if not user.is_active:
            logger.warning("Usuário inativo: %s", user.email)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuário inativo",
            )

        return user

    except Exception as e:
        logger.error("Erro na autenticação: %s", str(e), exc_info=True)
        raise CREDENTIALS_EXCEPTION


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependência para obter o usuário atual ativo.

    Esta função serve como um middleware adicional para garantir que o usuário
    autenticado esteja com o status 'ativo' no sistema. É útil para endpoints
    que requerem autenticação mas não necessariamente privilégios administrativos.

    Args:
        current_user: Usuário autenticado (obtido via get_current_user)

    Returns:
        User: O usuário ativo e validado

    Raises:
        HTTPException: Se o usuário estiver inativo (status code 403)

    Example:
        ```python
        from fastapi import APIRouter, Depends
        from app.core.auth import get_current_active_user
        
        router = APIRouter()
        
        @router.get("/user/profile")
        async def get_user_profile(
            current_user: User = Depends(get_current_active_user)
        ):
            return {
                "email": current_user.email,
                "name": current_user.name,
                "is_active": current_user.is_active
            }
        ```
    """
    if not current_user.is_active:
        logger.warning(
            "Tentativa de acesso de usuário inativo: %s",
            current_user.email
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta de usuário desativada"
        )

    logger.debug(
        "Acesso concedido para usuário ativo: %s",
        current_user.email
    )
    return current_user


def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependência para obter o usuário atual se for administrador.

    Esta função verifica se o usuário autenticado possui privilégios de
    administrador através do campo is_admin do modelo User. Também garante
    que o usuário esteja ativo antes de conceder acesso.

    Args:
        current_user: Usuário autenticado (obtido via get_current_user)

    Returns:
        User: O usuário administrador com privilégios de admin

    Raises:
        HTTPException: Se o usuário não for administrador ou estiver inativo
                      - 403 Forbidden para usuários inativos
                      - 403 Forbidden para usuários não administradores

    Example:
        ```python
        from fastapi import APIRouter, Depends
        from app.core.auth import get_current_admin_user
        
        router = APIRouter()
        
        @router.delete("/users/{user_id}")
        async def delete_user(
            user_id: int,
            admin_user: User = Depends(get_current_admin_user)
        ):
            # Apenas administradores podem executar esta operação
            return {"message": f"User {user_id} deleted by {admin_user.email}"}
        ```
    """
    if not current_user.is_active:
        logger.warning(
            "Tentativa de acesso de admin inativo: %s",
            current_user.email
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta de administrador desativada"
        )

    # Por simplicidade, considera-se que usuários com "admin" no email são admins
    # Em produção, use um campo específico na tabela User
    if "admin" not in current_user.email.lower():
        logger.warning(
            "Tentativa de acesso não autorizado a recurso de admin: %s",
            current_user.email
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissões insuficientes para acessar este recurso"
        )

    logger.debug("Acesso de administrador concedido: %s", current_user.email)
    return current_user


def optional_authentication(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Dependência opcional para autenticação.

    Esta função permite endpoints que funcionam tanto para usuários autenticados
    quanto não autenticados, retornando None em caso de falha de autenticação
    ao invés de levantar exceções. Ideal para funcionalidades que podem ser
    personalizadas baseadas no usuário logado.

    Args:
        credentials: Credenciais de autenticação (opcional)
        db: Sessão do banco de dados

    Returns:
        User: O usuário autenticado e validado, ou None se:
              - Nenhuma credencial for fornecida
              - Token for inválido ou expirado
              - Usuário não for encontrado
              - Usuário estiver inativo

    Example:
        ```python
        from fastapi import APIRouter, Depends
        from app.core.auth import optional_authentication
        
        router = APIRouter()
        
        @router.get("/pokemon")
        async def list_pokemon(
            current_user: Optional[User] = Depends(optional_authentication)
        ):
            if current_user:
                # Usuário autenticado - pode ver Pokémon capturados
                return {"pokemon": [], "user": current_user.email}
            else:
                # Usuário não autenticado - lista pública
                return {"pokemon": [], "message": "Faça login para ver seus Pokémon"}
        ```
    """
    if not credentials or not credentials.credentials:
        logger.debug("Nenhuma credencial fornecida para autenticação opcional")
        return None

    try:
        logger.debug("Token recebido: %s...",
                   credentials.credentials[:20])

        # Verifica o token JWT
        token_data = auth_service.verify_token(
            credentials.credentials
        )
        if token_data is None:
            logger.debug("Token inválido ou expirado na autenticação opcional")
            return None

        logger.info(
            "Token válido para o usuário ID: %s",
            token_data.user_id
        )

        # Busca o usuário no banco de dados
        logger.info(
            "Buscando usuário ID: %s",
            token_data.user_id
        )
        user = db.query(User).filter(User.id == token_data.user_id).first()

        if user is None:
            logger.debug("Usuário não encontrado na autenticação opcional")
            return None

        if not user.is_active:
            logger.debug(
                "Usuário inativo tentou autenticação opcional: %s",
                user.email
            )
            return None

        logger.debug("Autenticação opcional bem-sucedida para: %s", user.email)
        return user

    except Exception as e:
        logger.debug(
            "Erro na autenticação opcional: %s",
            str(e),
            exc_info=logger.level == logging.DEBUG
        )
        return None
