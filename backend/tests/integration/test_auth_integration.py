#!/usr/bin/env python3
"""
Testes de integração para o sistema de autenticação.
Testa fluxos completos de autenticação com banco de dados real.
"""
import pytest
import os
import sys
import tempfile
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from main import app
from app.core.database import Base, get_db
from app.models.models import User, UserRole
from app.services.auth_service import auth_service


class TestAuthIntegration:
    """Testes de integração para autenticação."""
    
    @pytest.fixture(scope="function")
    def test_db(self):
        """Cria um banco de dados temporário para testes."""
        # Criar arquivo temporário para SQLite
        db_fd, db_path = tempfile.mkstemp()
        
        # Configurar engine de teste
        test_engine = create_engine(
            f"sqlite:///{db_path}",
            connect_args={"check_same_thread": False}
        )
        
        # Criar tabelas
        Base.metadata.create_all(bind=test_engine)
        
        # Criar session
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
        
        def override_get_db():
            try:
                db = TestingSessionLocal()
                yield db
            finally:
                db.close()
        
        # Override da dependência
        app.dependency_overrides[get_db] = override_get_db
        
        yield TestingSessionLocal()
        
        # Cleanup
        os.close(db_fd)
        os.unlink(db_path)
        app.dependency_overrides.clear()

    def setup_method(self):
        """Setup executado antes de cada teste."""
        self.client = TestClient(app)
        
        self.test_user_data = {
            "email": "integration@example.com",
            "password": "IntegrationTest123!",
            "name": "Integration Test User",
            "contact": "+5511999999999",
            "security_question": "Qual o nome do seu primeiro pet?",
            "security_answer": "Rex"
        }

    def test_complete_auth_flow(self, test_db):
        """Testa fluxo completo: registro -> login -> acesso protegido -> logout."""
        
        # 1. Registro de usuário
        print("🔄 Testando registro...")
        response = self.client.post("/api/v1/auth/register", json=self.test_user_data)
        assert response.status_code == 201
        
        user_data = response.json()
        assert user_data["email"] == self.test_user_data["email"]
        assert user_data["name"] == self.test_user_data["name"]
        assert user_data["is_active"] is True
        print("✅ Registro bem-sucedido")
        
        # 2. Login
        print("🔄 Testando login...")
        login_data = {
            "email": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        }
        response = self.client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 200
        
        token_data = response.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"
        access_token = token_data["access_token"]
        print("✅ Login bem-sucedido")
        
        # 3. Acesso a rota protegida
        print("🔄 Testando acesso protegido...")
        headers = {"Authorization": f"Bearer {access_token}"}
        response = self.client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 200
        
        profile_data = response.json()
        assert profile_data["email"] == self.test_user_data["email"]
        print("✅ Acesso protegido autorizado")
        
        # 4. Logout
        print("🔄 Testando logout...")
        response = self.client.post("/api/v1/auth/logout", headers=headers)
        assert response.status_code == 200
        print("✅ Logout bem-sucedido")

    def test_password_reset_flow(self, test_db):
        """Testa fluxo completo de reset de senha."""
        
        # 1. Registrar usuário primeiro
        response = self.client.post("/api/v1/auth/register", json=self.test_user_data)
        assert response.status_code == 201
        
        # 2. Solicitar reset de senha
        print("🔄 Testando solicitação de reset...")
        reset_request = {"email": self.test_user_data["email"]}
        response = self.client.post("/api/v1/auth/password-reset/request", json=reset_request)
        assert response.status_code == 200
        
        reset_data = response.json()
        assert "security_question" in reset_data
        assert reset_data["security_question"] == self.test_user_data["security_question"]
        print("✅ Solicitação de reset bem-sucedida")
        
        # 3. Verificar resposta de segurança
        print("🔄 Testando verificação de segurança...")
        verify_data = {
            "email": self.test_user_data["email"],
            "security_answer": self.test_user_data["security_answer"]
        }
        response = self.client.post("/api/v1/auth/password-reset/verify", json=verify_data)
        assert response.status_code == 200
        
        verify_response = response.json()
        assert "reset_token" in verify_response
        reset_token = verify_response["reset_token"]
        print("✅ Verificação de segurança bem-sucedida")
        
        # 4. Completar reset de senha
        print("🔄 Testando reset de senha...")
        new_password = "NewPassword123!"
        complete_data = {
            "reset_token": reset_token,
            "new_password": new_password
        }
        response = self.client.post("/api/v1/auth/password-reset/complete", json=complete_data)
        assert response.status_code == 200
        print("✅ Reset de senha bem-sucedido")
        
        # 5. Testar login com nova senha
        print("🔄 Testando login com nova senha...")
        login_data = {
            "email": self.test_user_data["email"],
            "password": new_password
        }
        response = self.client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 200
        print("✅ Login com nova senha bem-sucedido")

    def test_refresh_token_flow(self, test_db):
        """Testa fluxo de refresh token."""
        
        # 1. Registrar e fazer login
        response = self.client.post("/api/v1/auth/register", json=self.test_user_data)
        assert response.status_code == 201
        
        login_data = {
            "email": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        }
        response = self.client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 200
        
        # 2. Criar refresh token manualmente (simulando)
        user = test_db.query(User).filter(User.email == self.test_user_data["email"]).first()
        refresh_token_data = {
            "sub": str(user.id),
            "email": user.email
        }
        refresh_token = auth_service.create_refresh_token(refresh_token_data)
        
        # 3. Usar refresh token para obter novo access token
        print("🔄 Testando refresh token...")
        refresh_data = {"refresh_token": refresh_token}
        response = self.client.post("/api/v1/auth/refresh", json=refresh_data)
        assert response.status_code == 200
        
        new_token_data = response.json()
        assert "access_token" in new_token_data
        assert new_token_data["token_type"] == "bearer"
        print("✅ Refresh token bem-sucedido")

    def test_invalid_scenarios(self, test_db):
        """Testa cenários de erro e validação."""
        
        # 1. Login com usuário inexistente
        print("🔄 Testando login com usuário inexistente...")
        login_data = {
            "email": "nonexistent@example.com",
            "password": "anypassword"
        }
        response = self.client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401
        print("✅ Login rejeitado corretamente")
        
        # 2. Registro com email duplicado
        print("🔄 Testando registro duplicado...")
        response = self.client.post("/api/v1/auth/register", json=self.test_user_data)
        assert response.status_code == 201  # Primeiro registro
        
        response = self.client.post("/api/v1/auth/register", json=self.test_user_data)
        assert response.status_code == 400  # Segundo registro deve falhar
        print("✅ Registro duplicado rejeitado corretamente")
        
        # 3. Acesso sem token
        print("🔄 Testando acesso sem token...")
        response = self.client.get("/api/v1/auth/me")
        assert response.status_code == 401
        print("✅ Acesso sem token rejeitado corretamente")
        
        # 4. Acesso com token inválido
        print("🔄 Testando acesso com token inválido...")
        headers = {"Authorization": "Bearer invalid_token"}
        response = self.client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 401
        print("✅ Token inválido rejeitado corretamente")

    def test_user_deactivation(self, test_db):
        """Testa desativação de usuário."""
        
        # 1. Registrar usuário
        response = self.client.post("/api/v1/auth/register", json=self.test_user_data)
        assert response.status_code == 201
        
        # 2. Fazer login
        login_data = {
            "email": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        }
        response = self.client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 200
        
        token_data = response.json()
        access_token = token_data["access_token"]
        
        # 3. Desativar usuário diretamente no banco
        user = test_db.query(User).filter(User.email == self.test_user_data["email"]).first()
        user.is_active = False
        test_db.commit()
        
        # 4. Tentar acessar rota protegida
        print("🔄 Testando acesso com usuário desativado...")
        headers = {"Authorization": f"Bearer {access_token}"}
        response = self.client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 401
        print("✅ Usuário desativado rejeitado corretamente")

    def test_token_expiration_simulation(self, test_db):
        """Testa simulação de token expirado."""
        
        # 1. Registrar usuário
        response = self.client.post("/api/v1/auth/register", json=self.test_user_data)
        assert response.status_code == 201
        
        # 2. Criar token expirado manualmente
        from datetime import timedelta
        user = test_db.query(User).filter(User.email == self.test_user_data["email"]).first()
        
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
        
        # Token com expiração no passado
        expired_token = auth_service.create_access_token(
            token_data, 
            expires_delta=timedelta(minutes=-1)
        )
        
        # 3. Tentar usar token expirado
        print("🔄 Testando token expirado...")
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = self.client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 401
        print("✅ Token expirado rejeitado corretamente")


if __name__ == "__main__":
    # Executar testes
    pytest.main([__file__, "-v", "--tb=short", "-s"])
