#!/usr/bin/env python3
"""
Teste de conexão com banco de dados para identificar problemas.
"""
import time
from sqlalchemy.orm import Session
from core.database import get_db
from app.models.models import User
from app.services.auth_service import AuthService
from app.schemas.auth_schemas import UserCreate

def test_database_operations():
    """Testa operações básicas do banco de dados."""
    print("🔍 Testando operações do banco de dados...")

    # Teste 1: Conexão básica
    print("\n🧪 Teste 1: Conexão com banco de dados")
    try:
        start_time = time.time()
        db = next(get_db())
        connection_time = time.time() - start_time
        print(f"✅ Conexão estabelecida em {connection_time:.3f}s")
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return

    # Teste 2: Query simples
    print("\n🧪 Teste 2: Query simples")
    try:
        start_time = time.time()
        user_count = db.query(User).count()
        query_time = time.time() - start_time
        print(f"✅ Query executada em {query_time:.3f}s - {user_count} usuários encontrados")
    except Exception as e:
        print(f"❌ Erro na query: {e}")
        db.close()
        return

    # Teste 3: Verificação de email (operação do registro)
    print("\n🧪 Teste 3: Verificação de email existente")
    try:
        start_time = time.time()
        auth_service = AuthService()
        existing_user = auth_service.get_user_by_email(db, "test@example.com")
        email_check_time = time.time() - start_time
        print(f"✅ Verificação de email em {email_check_time:.3f}s - Usuário {'encontrado' if existing_user else 'não encontrado'}")
    except Exception as e:
        print(f"❌ Erro na verificação de email: {e}")
        db.close()
        return

    # Teste 4: Criação de usuário (operação completa)
    print("\n🧪 Teste 4: Criação de usuário de teste")
    try:
        test_email = f"test_db_{int(time.time())}@example.com"
        user_data = UserCreate(
            email=test_email,
            password="123456",
            name="Test DB User",
            security_question="pet",
            security_answer="dog"
        )

        start_time = time.time()

        # Simula o processo completo de registro
        print("   📋 Verificando email...")
        if auth_service.get_user_by_email(db, user_data.email):
            print("   ⚠️ Email já existe (normal para teste)")
            db.close()
            return

        print("   🔐 Gerando hash da senha...")
        password_hash_start = time.time()
        password_hash = auth_service.get_password_hash(user_data.password)
        password_hash_time = time.time() - password_hash_start
        print(f"   ✅ Hash da senha gerado em {password_hash_time:.3f}s")

        print("   🔐 Gerando hash da resposta de segurança...")
        answer_hash_start = time.time()
        security_answer_hash = auth_service.get_password_hash(user_data.security_answer.lower().strip())
        answer_hash_time = time.time() - answer_hash_start
        print(f"   ✅ Hash da resposta gerado em {answer_hash_time:.3f}s")

        print("   💾 Criando usuário no banco...")
        db_insert_start = time.time()
        user = User(
            email=user_data.email,
            password_hash=password_hash,
            name=user_data.name,
            contact=user_data.contact,
            security_question=user_data.security_question,
            security_answer_hash=security_answer_hash,
            is_active=True
        )

        db.add(user)
        db.commit()
        db.refresh(user)
        db_insert_time = time.time() - db_insert_start
        print(f"   ✅ Usuário inserido no banco em {db_insert_time:.3f}s")

        total_time = time.time() - start_time
        print(f"✅ Criação completa em {total_time:.3f}s")
        print(f"   - Hash senha: {password_hash_time:.3f}s")
        print(f"   - Hash resposta: {answer_hash_time:.3f}s")
        print(f"   - Inserção DB: {db_insert_time:.3f}s")

        # Limpeza
        print("   🧹 Removendo usuário de teste...")
        db.delete(user)
        db.commit()
        print("   ✅ Usuário de teste removido")

    except Exception as e:
        print(f"❌ Erro na criação de usuário: {e}")
        print(f"   Tipo do erro: {type(e).__name__}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

    print("\n📊 Diagnóstico:")
    if total_time > 10:
        print("❌ PROBLEMA: Operação muito lenta!")
        print("💡 Possíveis causas:")
        print("   - Problema de performance no banco de dados")
        print("   - Lock/deadlock em transações")
        print("   - Problema de I/O do disco")
    else:
        print("✅ Performance adequada para operações de banco")

if __name__ == "__main__":
    test_database_operations()
