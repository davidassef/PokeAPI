"""
Teste rápido do sistema de autenticação simplificado.
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_auth():
    print("🔧 Testando novo sistema de autenticação (email + nome)")

    # Dados de teste
    user_data = {
        "email": "novo@teste.com",
        "password": "minhasenha123",
        "name": "Usuario Novo",
        "contact": "(11) 98888-8888"
    }

    print("\n1️⃣ Testando registro de usuário...")
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        print(f"Status: {response.status_code}")
        print(f"Resposta: {response.text}")

        if response.status_code == 201:
            print("✅ Registro realizado com sucesso!")
            user_response = response.json()
            print(f"   ID: {user_response['id']}")
            print(f"   Email: {user_response['email']}")
            print(f"   Nome: {user_response['name']}")
            print(f"   Contato: {user_response.get('contact', 'N/A')}")
        else:
            print(f"❌ Erro no registro: {response.text}")
            return

    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        return

    print("\n2️⃣ Testando login...")
    login_data = {
        "email": user_data["email"],
        "password": user_data["password"]
    }

    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            print("✅ Login realizado com sucesso!")
            token_response = response.json()
            token = token_response["access_token"]
            print(f"   Token: {token[:50]}...")
            print(f"   Expira em: {token_response['expires_in']} segundos")

            # Testar acesso ao perfil
            print("\n3️⃣ Testando acesso ao perfil...")
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(f"{BASE_URL}/auth/me", headers=headers)

            if response.status_code == 200:
                print("✅ Acesso ao perfil autorizado!")
                profile = response.json()
                print(f"   Email: {profile['email']}")
                print(f"   Nome: {profile['name']}")
                print(f"   Contato: {profile.get('contact', 'N/A')}")
            else:
                print(f"❌ Erro ao acessar perfil: {response.text}")
        else:
            print(f"❌ Erro no login: {response.text}")

    except Exception as e:
        print(f"❌ Erro na requisição: {e}")

if __name__ == "__main__":
    test_auth()
