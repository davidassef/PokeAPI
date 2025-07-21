#!/usr/bin/env python3
"""
Testes unitários para as rotas de autenticação.
Testa endpoints de login, registro, refresh token, etc.
"""
import pytest
import os
import sys
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import HTTPException

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from main import app
from app.models.models import User, UserRole
from app.services.auth_service import auth_service


class TestAuthRoutes:
    """Testes para as rotas de autenticação."""
    
    def setup_method(self):
        """Setup executado antes de cada teste."""
        self.client = TestClient(app)
        
        # Dados de teste
        self.test_user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "name": "Test User",
            "contact": "+5511999999999",
            "security_question": "Qual o nome do seu primeiro pet?",
            "security_answer": "Rex"
        }
        
        self.test_login_data = {
            "email": "test@example.com",
            "password": "TestPassword123!"
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
            updated_at=datetime.utcnow(),
            last_login=None
        )

    def test_register_success(self):
        """Testa registro de usuário com sucesso."""
        with patch('app.routes.auth.get_db') as mock_get_db, \
             patch.object(auth_service, 'create_user') as mock_create_user:
            
            mock_db = Mock()
            mock_get_db.return_value = mock_db
            mock_create_user.return_value = self.test_user
            
            response = self.client.post("/api/v1/auth/register", json=self.test_user_data)
            
            assert response.status_code == 201
            data = response.json()
            assert data["email"] == self.test_user_data["email"]
            assert data["name"] == self.test_user_data["name"]
            assert "password" not in data  # Senha não deve ser retornada

    def test_register_invalid_email(self):
        """Testa registro com email inválido."""
        invalid_data = self.test_user_data.copy()
        invalid_data["email"] = "invalid-email"
        
        response = self.client.post("/api/v1/auth/register", json=invalid_data)
        
        assert response.status_code == 422  # Validation error

    def test_register_weak_password(self):
        """Testa registro com senha fraca."""
        weak_data = self.test_user_data.copy()
        weak_data["password"] = "123"  # Senha muito fraca
        
        response = self.client.post("/api/v1/auth/register", json=weak_data)
        
        assert response.status_code == 422  # Validation error

    def test_register_email_already_exists(self):
        """Testa registro com email já existente."""
        with patch('app.routes.auth.get_db') as mock_get_db, \
             patch.object(auth_service, 'create_user') as mock_create_user:
            
            mock_db = Mock()
            mock_get_db.return_value = mock_db
            mock_create_user.side_effect = ValueError("Email já está em uso")
            
            response = self.client.post("/api/v1/auth/register", json=self.test_user_data)
            
            assert response.status_code == 400
            data = response.json()
            assert "Email já está em uso" in data["detail"]

    def test_login_success(self):
        """Testa login com sucesso."""
        with patch('app.routes.auth.get_db') as mock_get_db, \
             patch.object(auth_service, 'authenticate_user') as mock_auth:
            
            mock_db = Mock()
            mock_get_db.return_value = mock_db
            mock_auth.return_value = self.test_user
            
            # Mock do commit para atualizar last_login
            mock_db.commit = Mock()
            
            response = self.client.post("/api/v1/auth/login", json=self.test_login_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"
            assert "expires_in" in data
            assert "user" in data
            assert data["user"]["email"] == self.test_user_data["email"]

    def test_login_invalid_credentials(self):
        """Testa login com credenciais inválidas."""
        with patch('app.routes.auth.get_db') as mock_get_db, \
             patch.object(auth_service, 'authenticate_user') as mock_auth:
            
            mock_db = Mock()
            mock_get_db.return_value = mock_db
            mock_auth.return_value = None  # Credenciais inválidas
            
            response = self.client.post("/api/v1/auth/login", json=self.test_login_data)
            
            assert response.status_code == 401
            data = response.json()
            assert "Credenciais inválidas" in data["detail"]

    def test_login_inactive_user(self):
        """Testa login com usuário inativo."""
        inactive_user = self.test_user
        inactive_user.is_active = False
        
        with patch('app.routes.auth.get_db') as mock_get_db, \
             patch.object(auth_service, 'authenticate_user') as mock_auth:
            
            mock_db = Mock()
            mock_get_db.return_value = mock_db
            mock_auth.return_value = inactive_user
            
            response = self.client.post("/api/v1/auth/login", json=self.test_login_data)
            
            assert response.status_code == 401
            data = response.json()
            assert "Usuário inativo" in data["detail"]

    def test_get_current_user_success(self):
        """Testa obtenção do usuário atual com token válido."""
        # Criar token válido
        token_data = {
            "sub": str(self.test_user.id),
            "email": self.test_user.email,
            "name": self.test_user.name,
            "role": self.test_user.role
        }
        token = auth_service.create_access_token(token_data)
        
        with patch('app.core.auth_middleware.get_db') as mock_get_db, \
             patch.object(auth_service, 'get_user_by_id') as mock_get_user:
            
            mock_db = Mock()
            mock_get_db.return_value = mock_db
            mock_get_user.return_value = self.test_user
            
            headers = {"Authorization": f"Bearer {token}"}
            response = self.client.get("/api/v1/auth/me", headers=headers)
            
            assert response.status_code == 200
            data = response.json()
            assert data["email"] == self.test_user.email
            assert data["name"] == self.test_user.name

    def test_get_current_user_invalid_token(self):
        """Testa obtenção do usuário atual com token inválido."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = self.client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 401

    def test_get_current_user_no_token(self):
        """Testa obtenção do usuário atual sem token."""
        response = self.client.get("/api/v1/auth/me")
        
        assert response.status_code == 401

    def test_refresh_token_success(self):
        """Testa renovação de token com sucesso."""
        # Criar refresh token válido
        token_data = {
            "sub": str(self.test_user.id),
            "email": self.test_user.email
        }
        refresh_token = auth_service.create_refresh_token(token_data)
        
        with patch('app.routes.auth.get_db') as mock_get_db, \
             patch.object(auth_service, 'get_user_by_id') as mock_get_user:
            
            mock_db = Mock()
            mock_get_db.return_value = mock_db
            mock_get_user.return_value = self.test_user
            
            refresh_data = {"refresh_token": refresh_token}
            response = self.client.post("/api/v1/auth/refresh", json=refresh_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"

    def test_refresh_token_invalid(self):
        """Testa renovação com refresh token inválido."""
        refresh_data = {"refresh_token": "invalid_refresh_token"}
        response = self.client.post("/api/v1/auth/refresh", json=refresh_data)
        
        assert response.status_code == 401

    def test_password_reset_request_success(self):
        """Testa solicitação de reset de senha com sucesso."""
        with patch('app.routes.auth.get_db') as mock_get_db, \
             patch.object(auth_service, 'get_user_by_email') as mock_get_user:
            
            mock_db = Mock()
            mock_get_db.return_value = mock_db
            mock_get_user.return_value = self.test_user
            
            reset_data = {"email": self.test_user.email}
            response = self.client.post("/api/v1/auth/password-reset/request", json=reset_data)
            
            assert response.status_code == 200
            data = response.json()
            assert "security_question" in data

    def test_password_reset_request_user_not_found(self):
        """Testa solicitação de reset para usuário inexistente."""
        with patch('app.routes.auth.get_db') as mock_get_db, \
             patch.object(auth_service, 'get_user_by_email') as mock_get_user:
            
            mock_db = Mock()
            mock_get_db.return_value = mock_db
            mock_get_user.return_value = None
            
            reset_data = {"email": "nonexistent@example.com"}
            response = self.client.post("/api/v1/auth/password-reset/request", json=reset_data)
            
            assert response.status_code == 404

    def test_logout_success(self):
        """Testa logout com sucesso."""
        # Criar token válido
        token_data = {
            "sub": str(self.test_user.id),
            "email": self.test_user.email,
            "name": self.test_user.name,
            "role": self.test_user.role
        }
        token = auth_service.create_access_token(token_data)
        
        with patch('app.core.auth_middleware.get_db') as mock_get_db, \
             patch.object(auth_service, 'get_user_by_id') as mock_get_user:
            
            mock_db = Mock()
            mock_get_db.return_value = mock_db
            mock_get_user.return_value = self.test_user
            
            headers = {"Authorization": f"Bearer {token}"}
            response = self.client.post("/api/v1/auth/logout", headers=headers)
            
            assert response.status_code == 200
            data = response.json()
            assert "Logout realizado com sucesso" in data["message"]


if __name__ == "__main__":
    # Executar testes
    pytest.main([__file__, "-v", "--tb=short"])
