#!/usr/bin/env python3
"""
Script para testar persistência de dados.
Cria usuários de teste e verifica se persistem entre execuções.
"""
import os
import sys
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import Settings
from app.models.models import Base, User
from app.services.auth_service import auth_service
from app.schemas.auth_schemas import UserCreate


def test_persistence():
    """Testa a persistência de dados."""
    print("🧪 TESTE DE PERSISTÊNCIA DE DADOS")
    print("=" * 50)
    print(f"⏰ Timestamp: {datetime.now()}")
    
    # Configurações
    settings = Settings()
    database_url = settings.get_database_url
    print(f"📋 Database URL: {database_url}")
    
    # Verificar tipo de armazenamento
    if "/opt/render/project/data/" in database_url:
        print("✅ Usando volume persistente do Render")
        data_dir = "/opt/render/project/data"
        if os.path.exists(data_dir):
            print(f"📁 Diretório de dados existe: {data_dir}")
            files = os.listdir(data_dir)
            print(f"📋 Arquivos no diretório: {files}")
        else:
            print(f"❌ Diretório de dados não existe: {data_dir}")
    elif "sqlite" in database_url:
        print("⚠️  Usando SQLite local (dados temporários)")
    else:
        print("✅ Usando banco externo (persistente)")
    
    # Criar engine e sessão
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Criar tabelas
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Verificar usuários existentes
        existing_users = db.query(User).all()
        print(f"\n👥 Usuários existentes: {len(existing_users)}")
        
        for user in existing_users:
            print(f"  - {user.email} (ID: {user.id}, Criado: {getattr(user, 'created_at', 'N/A')})")
        
        # Criar usuário de teste de persistência
        test_email = f"persistence_test_{int(datetime.now().timestamp())}@test.com"
        
        user_data = UserCreate(
            name="Teste de Persistência",
            email=test_email,
            password="TestePersistencia123",
            security_question="Teste de persistência?",
            security_answer="sim"
        )
        
        new_user = auth_service.create_user(db, user_data)
        print(f"\n✅ Usuário de teste criado: {new_user.email} (ID: {new_user.id})")
        
        # Verificar total após criação
        final_count = db.query(User).count()
        print(f"👥 Total de usuários após teste: {final_count}")
        
        # Instruções para verificação
        print(f"\n📋 INSTRUÇÕES PARA VERIFICAR PERSISTÊNCIA:")
        print(f"1. Aguarde alguns minutos")
        print(f"2. Execute este script novamente")
        print(f"3. Verifique se o usuário {test_email} ainda existe")
        print(f"4. Se existir, a persistência está funcionando!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro durante teste: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = test_persistence()
    sys.exit(0 if success else 1)
