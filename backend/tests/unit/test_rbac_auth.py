"""
Testes unitários para sistema RBAC de autenticação.
"""
import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.services.auth_service import auth_service
from app.models.models import User
from app.schemas.auth_schemas import UserCreate, UserLogin


class TestRBACAuthentication:
    """Testes para autenticação com sistema de roles."""

    def test_create_user_default_role(self, db_session: Session):
        """Testa se novos usuários recebem role padrão."""
        user_data = UserCreate(
            name="Test User",
            email="test@example.com",
            password="password123",
            security_question="Test question?",
            security_answer="Test answer"
        )
        
        user = auth_service.create_user(db_session, user_data)
        
        assert user.email == "test@example.com"
        assert user.name == "Test User"
        # TODO: Verificar role padrão quando implementado
        # assert user.role == "user"

    def test_create_admin_user(self, db_session: Session):
        """Testa criação de usuário administrador."""
        user_data = UserCreate(
            name="Admin User",
            email="admin@example.com",
            password="admin123",
            security_question="Admin question?",
            security_answer="Admin answer"
        )
        
        user = auth_service.create_user(db_session, user_data)
        
        # TODO: Implementar lógica para definir admin
        # if user.email == "admin@example.com":
        #     user.role = "administrator"
        #     db_session.commit()
        
        assert user.email == "admin@example.com"
        assert user.name == "Admin User"

    def test_authenticate_user_success(self, db_session: Session):
        """Testa autenticação bem-sucedida."""
        # Criar usuário
        user_data = UserCreate(
            name="Test User",
            email="test@example.com",
            password="password123",
            security_question="Test question?",
            security_answer="Test answer"
        )
        user = auth_service.create_user(db_session, user_data)
        
        # Autenticar
        authenticated_user = auth_service.authenticate_user(
            db_session, "test@example.com", "password123"
        )
        
        assert authenticated_user is not None
        assert authenticated_user.email == "test@example.com"
        assert authenticated_user.is_active is True

    def test_authenticate_user_wrong_password(self, db_session: Session):
        """Testa autenticação com senha incorreta."""
        # Criar usuário
        user_data = UserCreate(
            name="Test User",
            email="test@example.com",
            password="password123",
            security_question="Test question?",
            security_answer="Test answer"
        )
        auth_service.create_user(db_session, user_data)
        
        # Tentar autenticar com senha errada
        authenticated_user = auth_service.authenticate_user(
            db_session, "test@example.com", "wrongpassword"
        )
        
        assert authenticated_user is None

    def test_authenticate_user_not_found(self, db_session: Session):
        """Testa autenticação com usuário inexistente."""
        authenticated_user = auth_service.authenticate_user(
            db_session, "nonexistent@example.com", "password123"
        )
        
        assert authenticated_user is None

    def test_create_access_token(self):
        """Testa criação de token JWT."""
        token_data = {
            "sub": "user123",
            "email": "test@example.com",
            "role": "user"  # TODO: Incluir role no token
        }
        
        token = auth_service.create_access_token(data=token_data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_verify_token_valid(self):
        """Testa verificação de token válido."""
        token_data = {
            "sub": "user123",
            "email": "test@example.com",
            "role": "user"
        }
        
        token = auth_service.create_access_token(data=token_data)
        verified_data = auth_service.verify_token(token)
        
        assert verified_data is not None
        assert verified_data.user_id == "user123"

    def test_verify_token_invalid(self):
        """Testa verificação de token inválido."""
        invalid_token = "invalid.token.here"
        
        verified_data = auth_service.verify_token(invalid_token)
        
        assert verified_data is None

    def test_verify_password_correct(self):
        """Testa verificação de senha correta."""
        password = "password123"
        hashed = auth_service.get_password_hash(password)
        
        is_valid = auth_service.verify_password(password, hashed)
        
        assert is_valid is True

    def test_verify_password_incorrect(self):
        """Testa verificação de senha incorreta."""
        password = "password123"
        wrong_password = "wrongpassword"
        hashed = auth_service.get_password_hash(password)
        
        is_valid = auth_service.verify_password(wrong_password, hashed)
        
        assert is_valid is False

    def test_get_user_by_email(self, db_session: Session):
        """Testa busca de usuário por email."""
        # Criar usuário
        user_data = UserCreate(
            name="Test User",
            email="test@example.com",
            password="password123",
            security_question="Test question?",
            security_answer="Test answer"
        )
        created_user = auth_service.create_user(db_session, user_data)
        
        # Buscar por email
        found_user = auth_service.get_user_by_email(db_session, "test@example.com")
        
        assert found_user is not None
        assert found_user.id == created_user.id
        assert found_user.email == "test@example.com"

    def test_get_user_by_email_not_found(self, db_session: Session):
        """Testa busca de usuário por email inexistente."""
        found_user = auth_service.get_user_by_email(db_session, "nonexistent@example.com")
        
        assert found_user is None

    def test_update_user_password(self, db_session: Session):
        """Testa atualização de senha do usuário."""
        # Criar usuário
        user_data = UserCreate(
            name="Test User",
            email="test@example.com",
            password="password123",
            security_question="Test question?",
            security_answer="Test answer"
        )
        user = auth_service.create_user(db_session, user_data)
        old_password_hash = user.password_hash
        
        # Atualizar senha
        auth_service.update_user_password(db_session, user, "newpassword123")
        
        # Verificar se a senha foi alterada
        db_session.refresh(user)
        assert user.password_hash != old_password_hash
        assert auth_service.verify_password("newpassword123", user.password_hash)

    def test_verify_security_answer_correct(self, db_session: Session):
        """Testa verificação de resposta de segurança correta."""
        # Criar usuário
        user_data = UserCreate(
            name="Test User",
            email="test@example.com",
            password="password123",
            security_question="Test question?",
            security_answer="Test answer"
        )
        user = auth_service.create_user(db_session, user_data)
        
        # Verificar resposta de segurança
        is_valid = auth_service.verify_security_answer(user, "Test answer")
        
        assert is_valid is True

    def test_verify_security_answer_incorrect(self, db_session: Session):
        """Testa verificação de resposta de segurança incorreta."""
        # Criar usuário
        user_data = UserCreate(
            name="Test User",
            email="test@example.com",
            password="password123",
            security_question="Test question?",
            security_answer="Test answer"
        )
        user = auth_service.create_user(db_session, user_data)
        
        # Verificar resposta de segurança incorreta
        is_valid = auth_service.verify_security_answer(user, "Wrong answer")
        
        assert is_valid is False

    def test_reset_password_with_security(self, db_session: Session):
        """Testa redefinição de senha com pergunta de segurança."""
        # Criar usuário
        user_data = UserCreate(
            name="Test User",
            email="test@example.com",
            password="password123",
            security_question="Test question?",
            security_answer="Test answer"
        )
        user = auth_service.create_user(db_session, user_data)
        old_password_hash = user.password_hash
        
        # Redefinir senha
        success = auth_service.reset_password_with_security(
            db_session, "test@example.com", "Test answer", "newpassword123"
        )
        
        assert success is True
        
        # Verificar se a senha foi alterada
        db_session.refresh(user)
        assert user.password_hash != old_password_hash
        assert auth_service.verify_password("newpassword123", user.password_hash)

    def test_reset_password_with_security_wrong_answer(self, db_session: Session):
        """Testa redefinição de senha com resposta de segurança incorreta."""
        # Criar usuário
        user_data = UserCreate(
            name="Test User",
            email="test@example.com",
            password="password123",
            security_question="Test question?",
            security_answer="Test answer"
        )
        auth_service.create_user(db_session, user_data)
        
        # Tentar redefinir senha com resposta errada
        success = auth_service.reset_password_with_security(
            db_session, "test@example.com", "Wrong answer", "newpassword123"
        )
        
        assert success is False


@pytest.mark.integration
class TestRBACAuthenticationIntegration:
    """Testes de integração para autenticação RBAC."""

    def test_full_authentication_flow(self, db_session: Session):
        """Testa fluxo completo de autenticação."""
        # 1. Criar usuário
        user_data = UserCreate(
            name="Test User",
            email="test@example.com",
            password="password123",
            security_question="Test question?",
            security_answer="Test answer"
        )
        user = auth_service.create_user(db_session, user_data)
        
        # 2. Autenticar
        authenticated_user = auth_service.authenticate_user(
            db_session, "test@example.com", "password123"
        )
        
        # 3. Criar token
        token_data = {
            "sub": authenticated_user.id,
            "email": authenticated_user.email
        }
        token = auth_service.create_access_token(data=token_data)
        
        # 4. Verificar token
        verified_data = auth_service.verify_token(token)
        
        assert authenticated_user is not None
        assert token is not None
        assert verified_data is not None
        assert verified_data.user_id == authenticated_user.id

    def test_password_reset_flow(self, db_session: Session):
        """Testa fluxo completo de redefinição de senha."""
        # 1. Criar usuário
        user_data = UserCreate(
            name="Test User",
            email="test@example.com",
            password="password123",
            security_question="What is your favorite color?",
            security_answer="Blue"
        )
        auth_service.create_user(db_session, user_data)
        
        # 2. Buscar usuário por email
        user = auth_service.get_user_by_email(db_session, "test@example.com")
        assert user is not None
        assert user.security_question == "What is your favorite color?"
        
        # 3. Verificar resposta de segurança
        is_valid = auth_service.verify_security_answer(user, "Blue")
        assert is_valid is True
        
        # 4. Redefinir senha
        success = auth_service.reset_password_with_security(
            db_session, "test@example.com", "Blue", "newpassword456"
        )
        assert success is True
        
        # 5. Autenticar com nova senha
        authenticated_user = auth_service.authenticate_user(
            db_session, "test@example.com", "newpassword456"
        )
        assert authenticated_user is not None
