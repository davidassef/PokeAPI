#!/usr/bin/env python3
"""
Teste específico para validação de schema Pydantic.
"""
import time
import json
from app.schemas.auth_schemas import UserCreate

def test_schema_validation():
    """Testa a validação do schema UserCreate."""
    print("🔍 Testando validação do schema UserCreate...")
    
    # Dados de teste
    test_data = {
        "email": "test@example.com",
        "password": "test123",
        "name": "Test User",
        "security_question": "pet",
        "security_answer": "dog"
    }
    
    print(f"📋 Dados de teste: {test_data}")
    
    # Teste 1: Validação direta
    print("\n🧪 Teste 1: Validação direta do schema")
    try:
        start_time = time.time()
        user_create = UserCreate(**test_data)
        validation_time = time.time() - start_time
        print(f"✅ Validação bem-sucedida em {validation_time:.3f}s")
        print(f"📋 Objeto criado: {user_create}")
    except Exception as e:
        validation_time = time.time() - start_time
        print(f"❌ Erro na validação após {validation_time:.3f}s: {e}")
        return
    
    # Teste 2: Validação com JSON
    print("\n🧪 Teste 2: Validação via JSON")
    try:
        start_time = time.time()
        json_str = json.dumps(test_data)
        json_data = json.loads(json_str)
        user_create = UserCreate(**json_data)
        json_validation_time = time.time() - start_time
        print(f"✅ Validação JSON bem-sucedida em {json_validation_time:.3f}s")
    except Exception as e:
        json_validation_time = time.time() - start_time
        print(f"❌ Erro na validação JSON após {json_validation_time:.3f}s: {e}")
        return
    
    # Teste 3: Validação com dados inválidos
    print("\n🧪 Teste 3: Validação com dados inválidos")
    invalid_data = test_data.copy()
    invalid_data["security_question"] = "invalid_question"
    
    try:
        start_time = time.time()
        user_create = UserCreate(**invalid_data)
        invalid_validation_time = time.time() - start_time
        print(f"⚠️ Validação inválida passou em {invalid_validation_time:.3f}s (não deveria!)")
    except Exception as e:
        invalid_validation_time = time.time() - start_time
        print(f"✅ Erro esperado capturado em {invalid_validation_time:.3f}s: {e}")
    
    # Teste 4: Múltiplas validações
    print("\n🧪 Teste 4: Múltiplas validações consecutivas")
    try:
        start_time = time.time()
        for i in range(10):
            test_data_copy = test_data.copy()
            test_data_copy["email"] = f"test{i}@example.com"
            user_create = UserCreate(**test_data_copy)
        multiple_validation_time = time.time() - start_time
        print(f"✅ 10 validações consecutivas em {multiple_validation_time:.3f}s")
        print(f"📊 Média por validação: {multiple_validation_time/10:.3f}s")
    except Exception as e:
        multiple_validation_time = time.time() - start_time
        print(f"❌ Erro em validações múltiplas após {multiple_validation_time:.3f}s: {e}")
    
    print("\n📊 Resumo dos testes:")
    print(f"   - Validação direta: {validation_time:.3f}s")
    print(f"   - Validação JSON: {json_validation_time:.3f}s")
    print(f"   - Validação inválida: {invalid_validation_time:.3f}s")
    print(f"   - Múltiplas validações: {multiple_validation_time:.3f}s")
    
    if max(validation_time, json_validation_time, multiple_validation_time) > 1.0:
        print("❌ PROBLEMA: Validação muito lenta!")
    else:
        print("✅ Performance de validação adequada")

if __name__ == "__main__":
    test_schema_validation()
