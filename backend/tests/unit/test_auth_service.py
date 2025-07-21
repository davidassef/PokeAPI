#!/usr/bin/env python3
"""
Testes unitários para o AuthService.
Testa todas as funcionalidades de autenticação de forma isolada.
"""
import pytest
import os
import sys
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy.orm import Session

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from app.services.auth_service import AuthService
from app.models.models import User, UserRole
from app.schemas.auth_schemas import UserCreate, TokenData


class TestAuthService:
    """Testes para o serviço de autenticação."""

    def setup_method(self):
        """Setup executado antes de cada teste."""
        self.auth_service = AuthService()
        self.mock_db = Mock(spec=Session)

        # Dados de teste
        self.test_user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "name": "Test User",
            "contact": "+5511999999999",
            "security_question": "pet",  # Usar pergunta válida
            "security_answer": "Rex"
        }

        self.test_user = User(
            id=1,
            email=self.test_user_data["email"],
            password_hash="$2b$12$hashed_password",
            name=self.test_user_data["name"],
            contact=self.test_user_data["contact"],
            security_question=self.test_user_data["security_question"],
            security_answer_hash="$2b$12$hashed_answer",
            role=UserRole.USER.value,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

    def test_password_hashing(self):
        """Testa hash e verificação de senhas."""
        password = "TestPassword123!"

        # Testar hash
        hashed = self.auth_service.get_password_hash(password)
        assert hashed is not None
        assert hashed != password
        assert hashed.startswith("$2b$")

        # Testar verificação correta
        assert self.auth_service.verify_password(password, hashed) is True

        # Testar verificação incorreta
        assert self.auth_service.verify_password("wrong_password", hashed) is False

    def test_create_access_token(self):
        """Testa criação de token de acesso."""
        data = {
            "sub": "1",
            "email": "test@example.com",
            "name": "Test User",
            "role": "user"
        }

        token = self.auth_service.create_access_token(data)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 50  # JWT tokens são longos

        # Verificar se o token pode ser decodificado
        token_data = self.auth_service.verify_token(token)
        assert token_data is not None
        assert token_data.email == data["email"]
        assert token_data.user_id == int(data["sub"])

    def test_create_refresh_token(self):
        """Testa criação de token de refresh."""
        data = {
            "sub": "1",
            "email": "test@example.com"
        }

        token = self.auth_service.create_refresh_token(data)

        assert token is not None
        assert isinstance(token, str)

        # Verificar se é um token de refresh
        token_data = self.auth_service.verify_token(token, "refresh")
        assert token_data is not None

    def test_verify_token_valid(self):
        """Testa verificação de token válido."""
        data = {
            "sub": "1",
            "email": "test@example.com",
            "name": "Test User",
            "role": "user"
        }

        token = self.auth_service.create_access_token(data)
        token_data = self.auth_service.verify_token(token)

        assert token_data is not None
        assert token_data.user_id == 1
        assert token_data.email == "test@example.com"
        assert token_data.role == "user"

    def test_verify_token_invalid(self):
        """Testa verificação de token inválido."""
        # Token malformado
        invalid_token = "invalid.token.here"
        token_data = self.auth_service.verify_token(invalid_token)
        assert token_data is None

        # Token vazio
        token_data = self.auth_service.verify_token("")
        assert token_data is None

        # Token None
        token_data = self.auth_service.verify_token(None)
        assert token_data is None

    def test_verify_token_expired(self):
        """Testa verificação de token expirado."""
        data = {
            "sub": "1",
            "email": "test@example.com",
            "role": "user"
        }

        # Criar token com expiração no passado
        expired_delta = timedelta(minutes=-1)
        token = self.auth_service.create_access_token(data, expired_delta)

        token_data = self.auth_service.verify_token(token)
        assert token_data is None

    def test_authenticate_user_success(self):
        """Testa autenticação de usuário com sucesso."""
        # Mock do usuário no banco
        self.mock_db.query.return_value.filter.return_value.first.return_value = self.test_user

        # Mock da verificação de senha
        with patch.object(self.auth_service, 'verify_password', return_value=True):
            user = self.auth_service.authenticate_user(
                self.mock_db,
                self.test_user_data["email"],
                self.test_user_data["password"]
            )

            assert user is not None
            assert user.email == self.test_user_data["email"]
            assert user.id == 1

    def test_authenticate_user_wrong_password(self):
        """Testa autenticação com senha incorreta."""
        self.mock_db.query.return_value.filter.return_value.first.return_value = self.test_user

        with patch.object(self.auth_service, 'verify_password', return_value=False):
            user = self.auth_service.authenticate_user(
                self.mock_db,
                self.test_user_data["email"],
                "wrong_password"
            )

            assert user is None

    def test_authenticate_user_not_found(self):
        """Testa autenticação com usuário inexistente."""
        self.mock_db.query.return_value.filter.return_value.first.return_value = None

        user = self.auth_service.authenticate_user(
            self.mock_db,
            "nonexistent@example.com",
            "any_password"
        )

        assert user is None

    def test_get_user_by_email(self):
        """Testa busca de usuário por email."""
        self.mock_db.query.return_value.filter.return_value.first.return_value = self.test_user

        user = self.auth_service.get_user_by_email(self.mock_db, self.test_user_data["email"])

        assert user is not None
        assert user.email == self.test_user_data["email"]

    def test_get_user_by_id(self):
        """Testa busca de usuário por ID."""
        self.mock_db.query.return_value.filter.return_value.first.return_value = self.test_user

        user = self.auth_service.get_user_by_id(self.mock_db, 1)

        assert user is not None
        assert user.id == 1

    def test_create_user_success(self):
        """Testa criação de usuário com sucesso."""
        user_create = UserCreate(**self.test_user_data)

        # Mock para verificar se email já existe (não existe)
        self.mock_db.query.return_value.filter.return_value.first.return_value = None

        # Mock para simular criação no banco
        self.mock_db.add = Mock()
        self.mock_db.commit = Mock()
        self.mock_db.refresh = Mock()

        with patch.object(self.auth_service, 'get_password_hash') as mock_hash:
            mock_hash.return_value = "$2b$12$mocked_hash"

            user = self.auth_service.create_user(self.mock_db, user_create)

            # Verificar se os métodos do banco foram chamados
            self.mock_db.add.assert_called_once()
            self.mock_db.commit.assert_called_once()
            self.mock_db.refresh.assert_called_once()

    def test_create_user_email_exists(self):
        """Testa criação de usuário com email já existente."""
        user_create = UserCreate(**self.test_user_data)

        # Mock para simular email já existente
        self.mock_db.query.return_value.filter.return_value.first.return_value = self.test_user

        with pytest.raises(ValueError, match="Email já está em uso"):
            self.auth_service.create_user(self.mock_db, user_create)

    def test_verify_security_answer(self):
        """Testa verificação de resposta de segurança."""
        with patch.object(self.auth_service, 'verify_password', return_value=True):
            result = self.auth_service.verify_security_answer(
                self.test_user,  # Apenas usuário e resposta
                "rex"  # resposta normalizada
            )

            assert result is True

    def test_token_data_creation(self):
        """Testa criação de TokenData."""
        token_data = TokenData(
            user_id=1,
            email="test@example.com",
            role="user"
        )

        assert token_data.user_id == 1
        assert token_data.email == "test@example.com"
        assert token_data.role == "user"


if __name__ == "__main__":
    # Executar testes
    pytest.main([__file__, "-v", "--tb=short"])
