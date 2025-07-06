#!/usr/bin/env python3
"""
Teste de validação de autenticação usando o cliente de teste do FastAPI.
"""
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_auth_flow():
    print("🔧 Testando fluxo de autenticação completo")

    # 1. Registro
    print("\n1️⃣ Testando registro...")
    user_data = {
        "email": "teste.auth@exemplo.com",
        "password": "senha123",
        "name": "Usuario Auth Test",
        "contact": "(11) 99999-9999"
    }

    register_response = client.post("/api/v1/auth/register", json=user_data)
    print(f"Status registro: {register_response.status_code}")

    if register_response.status_code == 201:
        print("✅ Registro realizado com sucesso!")
        user_info = register_response.json()
        print(f"   ID: {user_info['id']}")
        print(f"   Email: {user_info['email']}")
        print(f"   Nome: {user_info['name']}")
    elif register_response.status_code == 400:
        print("⚠️  Email já existe, tentando fazer login...")
    else:
        print(f"❌ Erro no registro: {register_response.text}")
        return

    # 2. Login
    print("\n2️⃣ Testando login...")
    login_data = {
        "email": user_data["email"],
        "password": user_data["password"]
    }

    login_response = client.post("/api/v1/auth/login", json=login_data)
    print(f"Status login: {login_response.status_code}")

    if login_response.status_code == 200:
        print("✅ Login realizado com sucesso!")
        token_info = login_response.json()
        access_token = token_info["access_token"]
        print(f"   Token: {access_token[:50]}...")
        print(f"   Expira em: {token_info['expires_in']} segundos")

        # 3. Acesso ao perfil
        print("\n3️⃣ Testando acesso ao perfil...")
        headers = {"Authorization": f"Bearer {access_token}"}
        profile_response = client.get("/api/v1/auth/me", headers=headers)
        print(f"Status perfil: {profile_response.status_code}")

        if profile_response.status_code == 200:
            print("✅ Perfil acessado com sucesso!")
            profile = profile_response.json()
            print(f"   Email: {profile['email']}")
            print(f"   Nome: {profile['name']}")
            print(f"   Contato: {profile.get('contact', 'N/A')}")
        else:
            print(f"❌ Erro ao acessar perfil: {profile_response.text}")
            print(f"Headers enviados: {headers}")
    else:
        print(f"❌ Erro no login: {login_response.text}")

if __name__ == "__main__":
    test_auth_flow()
