#!/usr/bin/env python3
"""
Script para testar o endpoint de registro de usuário.
"""
import requests
import json
import sys

def test_health():
    """Testa o endpoint de health check."""
    try:
        print("🔍 Testando health check...")
        response = requests.get("http://localhost:8000/health", timeout=5)
        print(f"✅ Health check: {response.status_code} - {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Erro no health check: {e}")
        return False

def test_register():
    """Testa o endpoint de registro."""
    try:
        print("\n🔍 Testando endpoint de registro...")
        
        # Dados de teste
        user_data = {
            "email": "test@example.com",
            "password": "123456",
            "name": "Test User",
            "security_question": "pet",
            "security_answer": "dog"
        }
        
        print(f"📤 Enviando dados: {json.dumps(user_data, indent=2)}")
        
        response = requests.post(
            "http://localhost:8000/api/v1/auth/register",
            json=user_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"📥 Status: {response.status_code}")
        print(f"📥 Headers: {dict(response.headers)}")
        
        if response.status_code == 201:
            print("✅ Registro realizado com sucesso!")
            user_response = response.json()
            print(f"📋 Resposta: {json.dumps(user_response, indent=2)}")
            return True
        else:
            print(f"❌ Erro no registro: {response.status_code}")
            print(f"📋 Resposta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        return False

def main():
    """Função principal."""
    print("🚀 Iniciando testes do sistema de autenticação...")
    
    # Teste 1: Health check
    if not test_health():
        print("❌ Backend não está respondendo. Verifique se está rodando na porta 8000.")
        sys.exit(1)
    
    # Teste 2: Registro
    if test_register():
        print("\n✅ Todos os testes passaram!")
    else:
        print("\n❌ Falha nos testes de registro.")
        sys.exit(1)

if __name__ == "__main__":
    main()
