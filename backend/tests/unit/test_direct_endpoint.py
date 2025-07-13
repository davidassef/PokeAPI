#!/usr/bin/env python3
"""
Teste direto do endpoint de registro sem passar pelo FastAPI.
"""
import time
import asyncio
from sqlalchemy.orm import Session
from core.database import get_db
from app.services.auth_service import auth_service
from app.schemas.auth_schemas import UserCreate

async def test_direct_endpoint():
    """Testa diretamente a lógica do endpoint sem FastAPI."""
    print("🔍 Testando lógica do endpoint diretamente...")
    
    # Dados de teste
    user_data = UserCreate(
        email="direct_test@example.com",
        password="test123",
        name="Direct Test User",
        security_question="pet",
        security_answer="dog"
    )
    
    print(f"📋 Dados de teste: {user_data}")
    
    # Teste 1: Obter sessão do banco
    print("\n🧪 Teste 1: Conexão com banco de dados")
    try:
        start_time = time.time()
        db = next(get_db())
        db_time = time.time() - start_time
        print(f"✅ Conexão estabelecida em {db_time:.3f}s")
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return
    
    # Teste 2: Verificar se email já existe
    print("\n🧪 Teste 2: Verificação de email existente")
    try:
        start_time = time.time()
        existing_user = auth_service.get_user_by_email(db, user_data.email)
        email_check_time = time.time() - start_time
        print(f"✅ Verificação em {email_check_time:.3f}s - Usuário {'encontrado' if existing_user else 'não encontrado'}")
        
        # Se usuário existe, remover para teste
        if existing_user:
            print("🧹 Removendo usuário existente para teste...")
            db.delete(existing_user)
            db.commit()
            print("✅ Usuário removido")
    except Exception as e:
        print(f"❌ Erro na verificação: {e}")
        db.close()
        return
    
    # Teste 3: Criar usuário diretamente
    print("\n🧪 Teste 3: Criação direta do usuário")
    try:
        start_time = time.time()
        
        # Simular exatamente o que o endpoint faz
        print("   📋 Verificando email novamente...")
        if auth_service.get_user_by_email(db, user_data.email):
            raise ValueError("Email já está em uso")
        
        print("   🔐 Gerando hash da senha...")
        password_hash_start = time.time()
        password_hash = auth_service.get_password_hash(user_data.password)
        password_hash_time = time.time() - password_hash_start
        print(f"   ✅ Hash da senha em {password_hash_time:.3f}s")
        
        print("   🔐 Gerando hash da resposta...")
        answer_hash_start = time.time()
        security_answer_hash = auth_service.get_password_hash(user_data.security_answer.lower().strip())
        answer_hash_time = time.time() - answer_hash_start
        print(f"   ✅ Hash da resposta em {answer_hash_time:.3f}s")
        
        print("   💾 Criando usuário no banco...")
        user_creation_start = time.time()
        user = auth_service.create_user(db, user_data)
        user_creation_time = time.time() - user_creation_start
        print(f"   ✅ Usuário criado em {user_creation_time:.3f}s")
        
        total_time = time.time() - start_time
        print(f"✅ Criação completa em {total_time:.3f}s")
        print(f"   - Hash senha: {password_hash_time:.3f}s")
        print(f"   - Hash resposta: {answer_hash_time:.3f}s")
        print(f"   - Criação usuário: {user_creation_time:.3f}s")
        
        # Limpeza
        print("🧹 Removendo usuário de teste...")
        db.delete(user)
        db.commit()
        print("✅ Usuário removido")
        
    except Exception as e:
        creation_time = time.time() - start_time
        print(f"❌ Erro na criação após {creation_time:.3f}s: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
    
    print("\n📊 Diagnóstico:")
    if total_time > 5:
        print("❌ PROBLEMA: Operação muito lenta!")
        print("💡 Possíveis causas:")
        print("   - Problema de I/O do banco de dados")
        print("   - Configuração de bcrypt muito alta")
        print("   - Deadlock ou lock no banco")
    else:
        print("✅ Performance adequada para lógica do endpoint")
        print("💡 O problema pode estar no FastAPI, middleware ou rede")

if __name__ == "__main__":
    asyncio.run(test_direct_endpoint())
