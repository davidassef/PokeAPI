"""
Rotas de autenticação JWT.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth_middleware import get_current_active_user
from app.services.auth_service import auth_service
from app.schemas.auth_schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    UserUpdate, PasswordChange, RefreshTokenRequest,
    PasswordResetRequest, SecurityQuestionResponse,
    PasswordResetVerify, PasswordResetComplete
)
from app.models.models import User

router = APIRouter(tags=["auth"])
security = HTTPBearer()


@router.get("/debug/users")
async def debug_users(db: Session = Depends(get_db)):
    """🔍 ENDPOINT TEMPORÁRIO: Verificar usuários de teste"""
    users = db.query(User).all()
    user_data = []
    for user in users:
        user_data.append({
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "is_active": user.is_active
        })

    return {
        "total_users": len(users),
        "users": user_data,
        "test_users_exist": {
            "teste@teste.com": any(u.email == "teste@teste.com" for u in users),
            "teste2@teste.com": any(u.email == "teste2@teste.com" for u in users)
        }
    }


@router.post("/debug/create-test-users")
async def create_test_users(db: Session = Depends(get_db)):
    """🔧 ENDPOINT TEMPORÁRIO: Criar usuários de teste manualmente"""
    try:
        test_users = [
            {
                "name": "Usuário Teste Principal",
                "email": "teste@teste.com",
                "password": "Teste123",
                "security_question": "Qual é o seu Pokémon favorito?",
                "security_answer": "pikachu"
            },
            {
                "name": "Usuário Teste Secundário",
                "email": "teste2@teste.com",
                "password": "Teste123",
                "security_question": "Qual é o seu Pokémon favorito?",
                "security_answer": "charizard"
            }
        ]

        created_users = []
        for user_info in test_users:
            # Verificar se usuário já existe
            existing_user = auth_service.get_user_by_email(db, user_info['email'])
            if existing_user:
                created_users.append(f"❌ {user_info['email']} já existe")
                continue

            # Criar novo usuário
            user_data = UserCreate(
                name=user_info['name'],
                email=user_info['email'],
                password=user_info['password'],
                security_question=user_info['security_question'],
                security_answer=user_info['security_answer']
            )

            new_user = auth_service.create_user(db, user_data)
            created_users.append(f"✅ {new_user.email} criado (ID: {new_user.id})")

        return {
            "message": "Processo de criação concluído",
            "results": created_users
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar usuários de teste: {str(e)}"
        )


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registra um novo usuário.
    """
    import logging
    import time
    logger = logging.getLogger(__name__)

    start_time = time.time()

    try:
        logger.info(f"[REGISTER] 🚀 Iniciando registro para email: {user_data.email}")
        logger.info(f"[REGISTER] 📋 Dados recebidos: name={user_data.name}, security_question={user_data.security_question}")

        # Checkpoint 1: Validação inicial
        logger.info("[REGISTER] ✅ Validação inicial iniciada")

        # Checkpoint 2: Criação do usuário
        creation_start = time.time()
        logger.info("[REGISTER] 👤 Criando usuário no banco de dados...")

        user = auth_service.create_user(db, user_data)
        creation_time = time.time() - creation_start

        logger.info(f"[REGISTER] ✅ Usuário criado com sucesso: ID={user.id}, email={user.email}")
        logger.info(f"[REGISTER] ⏱️ Tempo de criação: {creation_time:.2f}s")

        # Checkpoint 3: Preparação da resposta
        response_start = time.time()
        response = UserResponse.from_orm(user)
        response_time = time.time() - response_start

        total_time = time.time() - start_time
        logger.info("[REGISTER] 🎯 Registro concluído com sucesso!")
        logger.info(f"[REGISTER] ⏱️ Tempo total: {total_time:.2f}s (criação: {creation_time:.2f}s, resposta: {response_time:.2f}s)")

        return response

    except ValueError as e:
        error_time = time.time() - start_time
        logger.error(f"[REGISTER] ❌ Erro de validação após {error_time:.2f}s: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        error_time = time.time() - start_time
        logger.error(f"[REGISTER] 💥 Erro interno após {error_time:.2f}s: {str(e)}")
        logger.error("[REGISTER] 🔍 Stack trace:", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor durante o registro"
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

    # Atualizar último login
    user.last_login = datetime.utcnow()
    db.commit()

    # Criar tokens
    expires_minutes = auth_service.ACCESS_TOKEN_EXPIRE_MINUTES
    token_expires = timedelta(minutes=expires_minutes)
    token_data = {
        "sub": str(user.id),  # JWT subject deve ser string
        "email": user.email,
        "name": user.name,  # Incluir nome no token
        "role": user.role,  # Incluir role no token
        "security_question": user.security_question  # Incluir pergunta de segurança no token
    }
    access_token = auth_service.create_access_token(
        data=token_data,
        expires_delta=token_expires
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.from_orm(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
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
    if not auth_service.verify_password(
        password_data.current_password,
        current_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )

    # Atualizar senha
    auth_service.update_user_password(
        db,
        current_user,
        password_data.new_password
    )

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
    token_data = auth_service.verify_token(
        refresh_data.refresh_token,
        "refresh"
    )

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
    expires_minutes = auth_service.ACCESS_TOKEN_EXPIRE_MINUTES
    token_expires = timedelta(minutes=expires_minutes)
    token_data = {
        "sub": str(user.id),  # JWT subject deve ser string
        "email": user.email,
        "name": user.name,  # Incluir nome no token
        "role": user.role,  # Incluir role no token
        "security_question": user.security_question  # Incluir pergunta de segurança no token
    }
    access_token = auth_service.create_access_token(
        data=token_data,
        expires_delta=token_expires
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


# REMOVED: Debug token endpoint for security


@router.get("/validate-token")
async def validate_token(current_user: User = Depends(get_current_active_user)):
    """
    Valida se o token atual é válido.
    """
    return {
        "valid": True,
        "user": UserResponse.from_orm(current_user)
    }


# REMOVED: Duplicate profile endpoint and mock Google login for security


@router.post("/password-reset/request", response_model=SecurityQuestionResponse)
async def request_password_reset(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Solicita recuperação de senha - retorna pergunta de segurança.
    """
    user = auth_service.get_user_by_email(db, request.email)
    if not user or not user.security_question:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado ou sem pergunta de segurança configurada"
        )

    return SecurityQuestionResponse(
        email=user.email,
        security_question=user.security_question
    )


@router.post("/password-reset/verify")
async def verify_security_answer(
    request: PasswordResetVerify,
    db: Session = Depends(get_db)
):
    """
    Verifica resposta de segurança.
    """
    user = auth_service.get_user_by_email(db, request.email)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if not auth_service.verify_security_answer(user, request.security_answer):
        raise HTTPException(status_code=400, detail="Resposta de segurança incorreta")

    return {"message": "Resposta verificada com sucesso"}


@router.post("/password-reset/complete")
async def complete_password_reset(
    request: PasswordResetComplete,
    db: Session = Depends(get_db)
):
    """
    Completa a redefinição de senha.
    """
    success = auth_service.reset_password_with_security(
        db, request.email, request.security_answer, request.new_password
    )

    if not success:
        raise HTTPException(
            status_code=400,
            detail="Falha ao redefinir senha. Verifique os dados informados."
        )

    return {"message": "Senha redefinida com sucesso"}
