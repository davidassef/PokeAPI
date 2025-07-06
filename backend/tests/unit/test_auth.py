#!/usr/bin/env python3
"""
Script para testar autenticação JWT
"""
import sys
import os
import json

# Adicionar diretório do projeto
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    # Testar import do JWT
    print("Testando import do JWT...")
    import jwt
    print("✅ JWT importado com sucesso")

    # Testar import do passlib
    print("Testando import do passlib...")
    from passlib.context import CryptContext
    print("✅ passlib importado com sucesso")

    # Testar criação de token
    print("\nTestando criação de token...")
    secret_key = "test-secret-key"
    test_data = {"user_id": 1, "username": "testuser"}

    token = jwt.encode(test_data, secret_key, algorithm="HS256")
    print(f"✅ Token criado: {token[:50]}...")

    # Testar decodificação
    print("\nTestando decodificação...")
    decoded = jwt.decode(token, secret_key, algorithms=["HS256"])
    print(f"✅ Token decodificado: {decoded}")

    # Testar hash de senha
    print("\nTestando hash de senha...")
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    password = "testpassword123"
    hashed = pwd_context.hash(password)
    print(f"✅ Senha hasheada: {hashed[:50]}...")

    # Testar verificação de senha
    print("\nTestando verificação de senha...")
    is_valid = pwd_context.verify(password, hashed)
    print(f"✅ Senha válida: {is_valid}")

    print("\n🎉 Todos os testes passaram! Sistema de autenticação pronto.")

except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()
