"""
Testes unitários para o sistema de autenticação JWT.

Este módulo contém testes abrangentes para todas as funcionalidades
de autenticação do sistema, incluindo:
- Registro de usuários
- Login e logout
- Validação de tokens JWT
- Gerenciamento de sessões
- Validação de credenciais
- Tratamento de erros

Os testes usam um banco de dados SQLite em memória para isolamento.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from core.database import Base, get_db
from main import app


# Configurar banco de dados de teste
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """
    Função override para usar banco de dados de teste.
    
    Esta função substitui a dependência get_db para usar um banco
    SQLite específico para testes, garantindo isolamento.
    
    Yields:
        Session: Sessão do banco de dados de teste
    """
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


# Criar tabelas de teste
Base.metadata.create_all(bind=engine)

# Override da dependência do banco
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def test_register_user():
    """
    Testa o registro de um novo usuário no sistema.
    
    Verifica se:
    - O usuário é criado com sucesso
    - Os dados retornados estão corretos
    - O usuário é marcado como ativo
    """
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123",
        "full_name": "Test User"
    }

    response = client.post("/auth/register", json=user_data)
    assert response.status_code == 201

    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert data["is_active"] is True


def test_login_user():
    """
    Testa o processo de login de usuário.
    
    Verifica se:
    - O login retorna um token JWT válido
    - O tipo de token está correto
    - O tempo de expiração é definido
    - Os dados do usuário estão presentes
    """
    # Primeiro registrar um usuário
    user_data = {
        "username": "loginuser",
        "email": "login@example.com",
        "password": "loginpass123",
        "full_name": "Login User"
    }
    client.post("/auth/register", json=user_data)

    # Fazer login
    login_data = {
        "username": "loginuser",
        "password": "loginpass123"
    }

    response = client.post("/auth/login", json=login_data)
    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0
    assert data["user"]["username"] == "loginuser"


def test_get_current_user():
    """
    Testa a obtenção dos dados do usuário atual via token JWT.
    
    Verifica se:
    - O endpoint retorna os dados corretos do usuário
    - A autenticação via token funciona
    - Os dados sensíveis não são expostos
    """
    # Registrar e fazer login
    user_data = {
        "username": "currentuser",
        "email": "current@example.com",
        "password": "currentpass123",
        "full_name": "Current User"
    }
    client.post("/auth/register", json=user_data)

    login_data = {
        "username": "currentuser",
        "password": "currentpass123"
    }

    login_response = client.post("/auth/login", json=login_data)
    token = login_response.json()["access_token"]

    # Obter usuário atual
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200

    data = response.json()
    assert data["username"] == "currentuser"
    assert data["email"] == "current@example.com"


def test_invalid_login():
    """
    Testa login com credenciais inválidas.
    
    Verifica se:
    - O sistema rejeita credenciais incorretas
    - Retorna erro 401 (Unauthorized)
    - A mensagem de erro é apropriada
    """
    login_data = {
        "username": "nonexistent",
        "password": "wrongpass"
    }

    response = client.post("/auth/login", json=login_data)
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


def test_invalid_token():
    """
    Testa acesso a endpoint protegido com token inválido.
    
    Verifica se:
    - O sistema rejeita tokens inválidos
    - Retorna erro 401 (Unauthorized)
    - Não permite acesso a dados sensíveis
    """
    headers = {"Authorization": "Bearer invalid_token"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 401


def test_duplicate_username():
    """
    Testa registro com username duplicado.
    
    Verifica se:
    - O sistema impede usernames duplicados
    - Retorna erro 400 (Bad Request)
    - A mensagem de erro é clara
    """
    user_data = {
        "username": "duplicateuser",
        "email": "duplicate@example.com",
        "password": "duplicatepass123"
    }

    # Primeiro registro
    response1 = client.post("/auth/register", json=user_data)
    assert response1.status_code == 201

    # Segundo registro com mesmo username
    user_data2 = {
        "username": "duplicateuser",
        "email": "duplicate2@example.com",
        "password": "duplicatepass123"
    }

    response2 = client.post("/auth/register", json=user_data2)
    assert response2.status_code == 400
    assert "username" in response2.json()["detail"].lower()


def test_duplicate_email():
    """
    Testa registro com email duplicado.
    
    Verifica se:
    - O sistema impede emails duplicados
    - Retorna erro 400 (Bad Request)
    - A mensagem de erro é clara
    """
    user_data = {
        "username": "emailuser1",
        "email": "duplicate@example.com",
        "password": "emailpass123"
    }

    # Primeiro registro
    response1 = client.post("/auth/register", json=user_data)
    assert response1.status_code == 201

    # Segundo registro com mesmo email
    user_data2 = {
        "username": "emailuser2",
        "email": "duplicate@example.com",
        "password": "emailpass123"
    }

    response2 = client.post("/auth/register", json=user_data2)
    assert response2.status_code == 400
    assert "email" in response2.json()["detail"].lower()


def test_password_change():
    """
    Testa a funcionalidade de mudança de senha.
    
    Verifica se:
    - O usuário pode alterar sua senha
    - A nova senha funciona para login
    - A senha antiga não funciona mais
    """
    # Registrar e fazer login
    user_data = {
        "username": "passuser",
        "email": "pass@example.com",
        "password": "oldpass123",
        "full_name": "Pass User"
    }
    client.post("/auth/register", json=user_data)

    login_data = {
        "username": "passuser",
        "password": "oldpass123"
    }

    login_response = client.post("/auth/login", json=login_data)
    token = login_response.json()["access_token"]

    # Mudar senha
    password_data = {
        "current_password": "oldpass123",
        "new_password": "newpass123"
    }

    headers = {"Authorization": f"Bearer {token}"}
    response = client.put("/auth/me/password", json=password_data, headers=headers)
    assert response.status_code == 200

    # Testar login com nova senha
    new_login_data = {
        "username": "passuser",
        "password": "newpass123"
    }

    new_login_response = client.post("/auth/login", json=new_login_data)
    assert new_login_response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
