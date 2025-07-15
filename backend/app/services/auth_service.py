"""
Serviço de autenticação JWT para gerenciamento de usuários e tokens.

Este módulo fornece funcionalidades completas de autenticação incluindo:
- Criação e verificação de tokens JWT (access e refresh)
- Hash e verificação de senhas com bcrypt
- Gerenciamento de usuários (criar, buscar, atualizar)
- Recuperação de senha via pergunta de segurança
- Ativação/desativação de usuários
"""
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from core.config import settings
from app.models.models import User
from app.schemas.auth_schemas import UserCreate, TokenData


class AuthService:
    """
    Serviço de autenticação JWT para gerenciamento completo de usuários.

    Este serviço implementa todas as funcionalidades necessárias para autenticação
    segura, incluindo hash de senhas, criação de tokens, verificação de credenciais
    e gerenciamento de sessões de usuário.
    """

    def __init__(self):
        # Configurações JWT
        self.SECRET_KEY = os.getenv("JWT_SECRET_KEY", settings.secret_key)
        self.ALGORITHM = "HS256"
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        self.REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

        # Configuração de hash de senha com rounds mais seguros
        self.pwd_context = CryptContext(
            schemes=["bcrypt"],
            deprecated="auto",
            bcrypt__rounds=settings.bcrypt_rounds
        )

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verifica se a senha em texto plano corresponde ao hash armazenado.

        Args:
            plain_password: Senha em texto plano fornecida pelo usuário
            hashed_password: Hash da senha armazenado no banco de dados

        Returns:
            True se a senha estiver correta, False caso contrário
        """
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """
        Gera hash seguro de uma senha usando bcrypt.

        Args:
            password: Senha em texto plano para ser hasheada

        Returns:
            Hash da senha gerado com bcrypt
        """
        return self.pwd_context.hash(password)

    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """
        Cria token de acesso JWT com dados do usuário.

        Args:
            data: Dicionário com dados do usuário (user_id, email, role, etc.)
            expires_delta: Tempo de expiração personalizado (opcional)

        Returns:
            Token JWT codificado em string
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, self.SECRET_KEY, algorithm=self.ALGORITHM)
        return encoded_jwt

    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """
        Cria token de refresh JWT para renovação de sessão.

        Args:
            data: Dicionário com dados do usuário

        Returns:
            Token de refresh JWT codificado em string
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=self.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, self.SECRET_KEY, algorithm=self.ALGORITHM)
        return encoded_jwt

    def verify_token(self, token: str, token_type: str = "access") -> Optional[TokenData]:
        """
        Verifica e decodifica token JWT, validando sua autenticidade.

        Args:
            token: Token JWT em string
            token_type: Tipo do token ('access' ou 'refresh')

        Returns:
            TokenData com informações do usuário se válido, None caso contrário
        """
        try:
            # Primeiro, vamos decodificar sem verificar para debug
            from datetime import datetime
            import logging
            logger = logging.getLogger(__name__)

            unverified_payload = jwt.get_unverified_claims(token)
            if 'exp' in unverified_payload:
                exp_time = datetime.utcfromtimestamp(unverified_payload['exp'])
                current_time = datetime.utcnow()
                logger.info(
                    "DEBUG - Token exp: %s (UTC), current: %s (UTC), diff: %s seconds",
                    exp_time.isoformat(),
                    current_time.isoformat(),
                    (exp_time - current_time).total_seconds()
                )

            payload = jwt.decode(token, self.SECRET_KEY, algorithms=[self.ALGORITHM])

            # Verifica tipo do token
            if payload.get("type") != token_type:
                logger.warning("Token type mismatch: expected %s, got %s", token_type, payload.get("type"))
                return None

            user_id_str: str = payload.get("sub")
            email: str = payload.get("email")
            role: str = payload.get("role", "user")  # Role padrão se não especificado

            if user_id_str is None or email is None:
                logger.warning("Token missing required fields: user_id=%s, email=%s", user_id_str, email)
                return None

            try:
                user_id = int(user_id_str)
            except (ValueError, TypeError):
                logger.warning("Invalid user_id format in token: %s", user_id_str)
                return None

            logger.info("Token successfully verified for user %s", email)
            token_data = TokenData(user_id=user_id, email=email, role=role)
            return token_data

        except JWTError as e:
            logger.error("JWT decode error: %s", str(e))
            return None

    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        """
        Autentica usuário verificando email e senha.

        Args:
            db: Sessão do banco de dados
            email: Email do usuário
            password: Senha em texto plano

        Returns:
            Objeto User se autenticação for bem-sucedida, None caso contrário
        """
        user = db.query(User).filter(User.email == email).first()
        if not user or not self.verify_password(password, user.password_hash):
            return None
        return user

    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """
        Busca usuário no banco de dados pelo email.

        Args:
            db: Sessão do banco de dados
            email: Email do usuário

        Returns:
            Objeto User se encontrado, None caso contrário
        """
        return db.query(User).filter(User.email == email).first()

    def get_user_by_id(self, db: Session, user_id: int) -> Optional[User]:
        """
        Busca usuário no banco de dados pelo ID.

        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário

        Returns:
            Objeto User se encontrado, None caso contrário
        """
        return db.query(User).filter(User.id == user_id).first()

    def create_user(self, db: Session, user_create: UserCreate) -> User:
        """
        Cria novo usuário no sistema com senha hasheada.

        Args:
            db: Sessão do banco de dados
            user_create: Dados do usuário para criação

        Returns:
            Objeto User criado

        Raises:
            ValueError: Se o email já estiver em uso
        """
        # Verifica se email já existe
        if self.get_user_by_email(db, user_create.email):
            raise ValueError("Email já está em uso")

        # Cria hash da senha
        password_hash = self.get_password_hash(user_create.password)

        # Cria hash da resposta de segurança
        security_answer_hash = self.get_password_hash(user_create.security_answer.lower().strip())

        # Cria usuário
        user = User(
            email=user_create.email,
            password_hash=password_hash,
            name=user_create.name,
            contact=user_create.contact,
            security_question=user_create.security_question,
            security_answer_hash=security_answer_hash,
            is_active=True
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    def update_user_password(self, db: Session, user: User, new_password: str):
        """
        Atualiza a senha de um usuário existente.

        Args:
            db: Sessão do banco de dados
            user: Objeto User a ser atualizado
            new_password: Nova senha em texto plano
        """
        user.password_hash = self.get_password_hash(new_password)
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)

    def deactivate_user(self, db: Session, user: User):
        """
        Desativa um usuário no sistema.

        Args:
            db: Sessão do banco de dados
            user: Objeto User a ser desativado
        """
        user.is_active = False
        db.commit()
        db.refresh(user)

    def activate_user(self, db: Session, user: User):
        """
        Ativa um usuário previamente desativado.

        Args:
            db: Sessão do banco de dados
            user: Objeto User a ser ativado
        """
        user.is_active = True
        db.commit()
        db.refresh(user)

    def generate_secure_secret_key(self) -> str:
        """
        Gera uma chave secreta segura para uso em JWT.

        Returns:
            String com chave secreta segura
        """
        return secrets.token_urlsafe(32)

    def verify_security_answer(self, user: User, security_answer: str) -> bool:
        """
        Verifica se a resposta de segurança está correta.

        Args:
            user: Objeto User
            security_answer: Resposta de segurança fornecida

        Returns:
            True se a resposta estiver correta, False caso contrário
        """
        if not user.security_answer_hash:
            return False
        normalized_answer = security_answer.lower().strip()
        return self.verify_password(normalized_answer, user.security_answer_hash)

    def reset_password_with_security(self, db: Session, email: str, security_answer: str, new_password: str) -> bool:
        """
        Redefine senha de usuário usando pergunta de segurança.

        Args:
            db: Sessão do banco de dados
            email: Email do usuário
            security_answer: Resposta da pergunta de segurança
            new_password: Nova senha

        Returns:
            True se a redefinição for bem-sucedida, False caso contrário
        """
        user = self.get_user_by_email(db, email)
        if not user:
            return False

        if not self.verify_security_answer(user, security_answer):
            return False

        self.update_user_password(db, user, new_password)
        return True


# Instância singleton do serviço de autenticação
auth_service = AuthService()
