#!/usr/bin/env python3
"""
Testes unitários para o middleware de autenticação.
Testa validação de tokens, obtenção de usuários, etc.
"""
import pytest
import os
import sys
from datetime import datetime
from unittest.mock import Mock, patch
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from app.core.auth_middleware import (
    get_current_user, 
    get_current_active_user, 
    verify_admin_user,
    optional_current_user
)
from app.models.models import User, UserRole
from app.services.auth_service import auth_service
from app.schemas.auth_schemas import TokenData


class TestAuthMiddleware:
    """Testes para o middleware de autenticação."""
    
    def setup_method(self):
        """Setup executado antes de cada teste."""
        self.test_user = User(
            id=1,
            email="test@example.com",
            password_hash="$2b$12$hashed_password",
            name="Test User",
            contact="+5511999999999",
            security_question="Qual o nome do seu primeiro pet?",
            security_answer_hash="$2b$12$hashed_answer",
            role=UserRole.USER.value,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        self.inactive_user = User(
            id=2,
            email="inactive@example.com",
            password_hash="$2b$12$hashed_password",
            name="Inactive User",
            role=UserRole.USER.value,
            is_active=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Token válido
        token_data = {
            "sub": str(self.test_user.id),
            "email": self.test_user.email,
            "name": self.test_user.name,
            "role": self.test_user.role
        }
        self.valid_token = auth_service.create_access_token(token_data)
        
        # Credentials mock
        self.valid_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=self.valid_token
        )
        
        self.invalid_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="invalid_token"
        )

    def test_get_current_user_success(self):
        """Testa obtenção do usuário atual com token válido."""
        mock_db = Mock()
        
        with patch.object(auth_service, 'verify_token') as mock_verify, \
             patch.object(auth_service, 'get_user_by_id') as mock_get_user:
            
            # Mock do token válido
            token_data = TokenData(
                user_id=self.test_user.id,
                email=self.test_user.email,
                role=self.test_user.role
            )
            mock_verify.return_value = token_data
            mock_get_user.return_value = self.test_user
            
            user = get_current_user(self.valid_credentials, mock_db)
            
            assert user is not None
            assert user.id == self.test_user.id
            assert user.email == self.test_user.email
            assert user.is_active is True

    def test_get_current_user_invalid_token(self):
        """Testa obtenção do usuário com token inválido."""
        mock_db = Mock()
        
        with patch.object(auth_service, 'verify_token') as mock_verify:
            mock_verify.return_value = None  # Token inválido
            
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(self.invalid_credentials, mock_db)
            
            assert exc_info.value.status_code == 401
            assert "Could not validate credentials" in str(exc_info.value.detail)

    def test_get_current_user_user_not_found(self):
        """Testa obtenção do usuário quando usuário não existe no banco."""
        mock_db = Mock()
        
        with patch.object(auth_service, 'verify_token') as mock_verify, \
             patch.object(auth_service, 'get_user_by_id') as mock_get_user:
            
            token_data = TokenData(
                user_id=999,  # ID inexistente
                email="nonexistent@example.com",
                role="user"
            )
            mock_verify.return_value = token_data
            mock_get_user.return_value = None  # Usuário não encontrado
            
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(self.valid_credentials, mock_db)
            
            assert exc_info.value.status_code == 401

    def test_get_current_user_inactive_user(self):
        """Testa obtenção do usuário inativo."""
        mock_db = Mock()
        
        with patch.object(auth_service, 'verify_token') as mock_verify, \
             patch.object(auth_service, 'get_user_by_id') as mock_get_user:
            
            token_data = TokenData(
                user_id=self.inactive_user.id,
                email=self.inactive_user.email,
                role=self.inactive_user.role
            )
            mock_verify.return_value = token_data
            mock_get_user.return_value = self.inactive_user
            
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(self.valid_credentials, mock_db)
            
            assert exc_info.value.status_code == 401
            assert "User is not active" in str(exc_info.value.detail)

    def test_get_current_active_user_success(self):
        """Testa obtenção do usuário ativo."""
        user = get_current_active_user(self.test_user)
        
        assert user is not None
        assert user.id == self.test_user.id
        assert user.is_active is True

    def test_get_current_active_user_inactive(self):
        """Testa obtenção do usuário inativo."""
        with pytest.raises(HTTPException) as exc_info:
            get_current_active_user(self.inactive_user)
        
        assert exc_info.value.status_code == 401
        assert "User is not active" in str(exc_info.value.detail)

    def test_verify_admin_user_success(self):
        """Testa verificação de usuário admin."""
        # Por enquanto, todos os usuários ativos são considerados admin
        admin_user = verify_admin_user(self.test_user)
        
        assert admin_user is not None
        assert admin_user.id == self.test_user.id

    def test_verify_admin_user_inactive(self):
        """Testa verificação de admin com usuário inativo."""
        with pytest.raises(HTTPException) as exc_info:
            verify_admin_user(self.inactive_user)
        
        assert exc_info.value.status_code == 401
        assert "User is not active" in str(exc_info.value.detail)

    def test_optional_current_user_success(self):
        """Testa obtenção opcional do usuário com token válido."""
        mock_db = Mock()
        
        with patch.object(auth_service, 'verify_token') as mock_verify, \
             patch.object(auth_service, 'get_user_by_id') as mock_get_user:
            
            token_data = TokenData(
                user_id=self.test_user.id,
                email=self.test_user.email,
                role=self.test_user.role
            )
            mock_verify.return_value = token_data
            mock_get_user.return_value = self.test_user
            
            user = optional_current_user(self.valid_credentials, mock_db)
            
            assert user is not None
            assert user.id == self.test_user.id

    def test_optional_current_user_invalid_token(self):
        """Testa obtenção opcional do usuário com token inválido."""
        mock_db = Mock()
        
        with patch.object(auth_service, 'verify_token') as mock_verify:
            mock_verify.return_value = None  # Token inválido
            
            user = optional_current_user(self.invalid_credentials, mock_db)
            
            assert user is None

    def test_optional_current_user_no_credentials(self):
        """Testa obtenção opcional do usuário sem credenciais."""
        mock_db = Mock()
        
        user = optional_current_user(None, mock_db)
        
        assert user is None

    def test_optional_current_user_inactive(self):
        """Testa obtenção opcional do usuário inativo."""
        mock_db = Mock()
        
        with patch.object(auth_service, 'verify_token') as mock_verify, \
             patch.object(auth_service, 'get_user_by_id') as mock_get_user:
            
            token_data = TokenData(
                user_id=self.inactive_user.id,
                email=self.inactive_user.email,
                role=self.inactive_user.role
            )
            mock_verify.return_value = token_data
            mock_get_user.return_value = self.inactive_user
            
            user = optional_current_user(self.valid_credentials, mock_db)
            
            assert user is None  # Usuário inativo retorna None

    def test_optional_current_user_exception(self):
        """Testa obtenção opcional do usuário com exceção."""
        mock_db = Mock()
        
        with patch.object(auth_service, 'verify_token') as mock_verify:
            mock_verify.side_effect = Exception("Database error")
            
            user = optional_current_user(self.valid_credentials, mock_db)
            
            assert user is None  # Exceções retornam None


if __name__ == "__main__":
    # Executar testes
    pytest.main([__file__, "-v", "--tb=short"])
