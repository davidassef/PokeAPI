"""
Teste específico para o endpoint de registro com dados corretos.
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_registration():
    print("🔧 Testando endpoint de registro com dados corretos")

    # Dados de teste com security question e answer
    user_data = {
        "email": "teste@registro.com",
        "password": "minhasenha123",
        "name": "Usuario Teste",
        "contact": "(11) 98888-8888",
        "security_question": "Qual é o nome do seu primeiro animal de estimação?",
        "security_answer": "Rex"
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
            print(f"   Role: {user_response.get('role', 'N/A')}")
        else:
            print(f"❌ Erro no registro: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        return False

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
            return True
        else:
            print(f"❌ Erro no login: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        return False

if __name__ == "__main__":
    success = test_registration()
    if success:
        print("\n🎉 Teste de registro concluído com sucesso!")
    else:
        print("\n❌ Teste de registro falhou!")
