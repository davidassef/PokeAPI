"""
Testes unitários para UserService.
"""
import pytest
from sqlalchemy.orm import Session
from app.services.user_service import UserService
from app.schemas.schemas import UserCreate, UserUpdate
from app.models.models import User


@pytest.mark.unit
class TestUserService:
    """Classe de testes para UserService."""

    def test_create_user(self, db_session: Session):
        """Testa criação de usuário."""
        user_data = UserCreate(
            username="newuser",
            email="newuser@example.com"
        )

        user = UserService.create_user(db_session, user_data)

        assert user.id is not None
        assert user.username == "newuser"
        assert user.email == "newuser@example.com"
        assert user.is_active is True
        assert user.created_at is not None

    def test_get_user_by_id(self, db_session: Session, sample_user: User):
        """Testa busca de usuário por ID."""
        user = UserService.get_user(db_session, sample_user.id)

        assert user is not None
        assert user.id == sample_user.id
        assert user.username == sample_user.username

    def test_get_user_by_id_not_found(self, db_session: Session):
        """Testa busca de usuário inexistente."""
        user = UserService.get_user(db_session, 999)

        assert user is None

    def test_get_user_by_email(self, db_session: Session, sample_user: User):
        """Testa busca de usuário por email."""
        user = UserService.get_user_by_email(db_session, sample_user.email)

        assert user is not None
        assert user.email == sample_user.email

    def test_get_user_by_username(self, db_session: Session, sample_user: User):
        """Testa busca de usuário por username."""
        user = UserService.get_user_by_username(db_session, sample_user.username)

        assert user is not None
        assert user.username == sample_user.username

    def test_get_users_pagination(self, db_session: Session, sample_users):
        """Testa listagem de usuários com paginação."""
        # Teste sem paginação
        users = UserService.get_users(db_session)
        assert len(users) == 3

        # Teste com limite
        users = UserService.get_users(db_session, limit=2)
        assert len(users) == 2

        # Teste com offset
        users = UserService.get_users(db_session, skip=1, limit=2)
        assert len(users) == 2

    def test_update_user(self, db_session: Session, sample_user: User):
        """Testa atualização de usuário."""
        update_data = UserUpdate(
            username="updated_user",
            email="updated@example.com"
        )

        updated_user = UserService.update_user(
            db_session, sample_user.id, update_data
        )

        assert updated_user is not None
        assert updated_user.username == "updated_user"
        assert updated_user.email == "updated@example.com"

    def test_update_user_not_found(self, db_session: Session):
        """Testa atualização de usuário inexistente."""
        update_data = UserUpdate(username="newname")

        result = UserService.update_user(db_session, 999, update_data)

        assert result is None

    def test_update_user_partial(self, db_session: Session, sample_user: User):
        """Testa atualização parcial de usuário."""
        original_email = sample_user.email
        update_data = UserUpdate(username="new_username")

        updated_user = UserService.update_user(
            db_session, sample_user.id, update_data
        )

        assert updated_user.username == "new_username"
        assert updated_user.email == original_email  # Não mudou

    def test_delete_user(self, db_session: Session, sample_user: User):
        """Testa deleção de usuário."""
        user_id = sample_user.id

        result = UserService.delete_user(db_session, user_id)

        assert result is True

        # Verifica se foi deletado
        deleted_user = UserService.get_user(db_session, user_id)
        assert deleted_user is None

    def test_delete_user_not_found(self, db_session: Session):
        """Testa deleção de usuário inexistente."""
        result = UserService.delete_user(db_session, 999)

        assert result is False
