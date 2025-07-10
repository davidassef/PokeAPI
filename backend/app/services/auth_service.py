"""
Serviço de autenticação JWT.
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
    """Serviço de autenticação JWT."""

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
        """Verifica se a senha está correta."""
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Gera hash da senha."""
        return self.pwd_context.hash(password)

    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Cria token de acesso JWT."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, self.SECRET_KEY, algorithm=self.ALGORITHM)
        return encoded_jwt

    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """Cria token de refresh JWT."""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=self.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, self.SECRET_KEY, algorithm=self.ALGORITHM)
        return encoded_jwt

    def verify_token(self, token: str, token_type: str = "access") -> Optional[TokenData]:
        """Verifica e decodifica token JWT."""
        try:
            payload = jwt.decode(token, self.SECRET_KEY, algorithms=[self.ALGORITHM])

            # Verifica tipo do token
            if payload.get("type") != token_type:
                return None

            user_id: int = payload.get("sub")
            email: str = payload.get("email")

            if user_id is None or email is None:
                return None

            token_data = TokenData(user_id=user_id, email=email)
            return token_data

        except JWTError:
            return None

    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        """Autentica usuário."""
        user = db.query(User).filter(User.email == email).first()
        if not user or not self.verify_password(password, user.password_hash):
            return None
        return user

    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """Busca usuário por email."""
        return db.query(User).filter(User.email == email).first()

    def get_user_by_id(self, db: Session, user_id: int) -> Optional[User]:
        """Busca usuário por ID."""
        return db.query(User).filter(User.id == user_id).first()

    def create_user(self, db: Session, user_create: UserCreate) -> User:
        """Cria novo usuário."""
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
        """Atualiza senha do usuário."""
        user.password_hash = self.get_password_hash(new_password)
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)

    def deactivate_user(self, db: Session, user: User):
        """Desativa usuário."""
        user.is_active = False
        db.commit()
        db.refresh(user)

    def activate_user(self, db: Session, user: User):
        """Ativa usuário."""
        user.is_active = True
        db.commit()
        db.refresh(user)

    def generate_secure_secret_key(self) -> str:
        """Gera uma chave secreta segura."""
        return secrets.token_urlsafe(32)

    def verify_security_answer(self, user: User, security_answer: str) -> bool:
        """Verifica se a resposta de segurança está correta."""
        if not user.security_answer_hash:
            return False
        normalized_answer = security_answer.lower().strip()
        return self.verify_password(normalized_answer, user.security_answer_hash)

    def reset_password_with_security(self, db: Session, email: str, security_answer: str, new_password: str) -> bool:
        """Redefine senha usando pergunta de segurança."""
        user = self.get_user_by_email(db, email)
        if not user:
            return False

        if not self.verify_security_answer(user, security_answer):
            return False

        self.update_user_password(db, user, new_password)
        return True


# Instância singleton do serviço de autenticação
auth_service = AuthService()
