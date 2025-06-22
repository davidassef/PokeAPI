"""
Serviços de negócio para usuários.
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.models import User
from app.schemas.schemas import UserCreate, UserUpdate


class UserService:
    """Serviço para operações com usuários."""

    @staticmethod
    def get_user(db: Session, user_id: int) -> Optional[User]:
        """Busca usuário por ID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Busca usuário por email."""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """Busca usuário por username."""
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """Lista usuários com paginação."""
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def create_user(db: Session, user: UserCreate) -> User:
        """Cria novo usuário."""
        db_user = User(
            username=user.username,
            email=user.email
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
        """Atualiza usuário."""
        db_user = UserService.get_user(db, user_id)
        if not db_user:
            return None

        update_data = user_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_user, field, value)

        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        """Deleta usuário."""
        db_user = UserService.get_user(db, user_id)
        if not db_user:
            return False

        db.delete(db_user)
        db.commit()
        return True
