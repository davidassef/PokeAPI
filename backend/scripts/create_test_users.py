#!/usr/bin/env python3
"""
Script para criar usuários de teste em produção.
Este script cria os usuários teste@teste.com e teste2@teste.com
que são documentados no README e usados para demonstração.
"""
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import Settings
from app.models.models import Base, User
from app.services.auth_service import auth_service
from app.schemas.auth_schemas import UserCreate


def create_test_users():
    """Cria os usuários de teste padrão."""
    print("🔧 Criando usuários de teste para produção...")
    
    # Configurações
    settings = Settings()
    print(f"📋 Database URL: {settings.database_url}")
    
    # Criar engine
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Criar tabelas se não existirem
    Base.metadata.create_all(bind=engine)
    
    # Sessão do banco
    db = SessionLocal()
    
    try:
        # Usuários de teste para criar
        test_users = [
            {
                "name": "Usuário Teste Principal",
                "email": "teste@teste.com",
                "password": "Teste123",
                "security_question": "Qual é o seu Pokémon favorito?",
                "security_answer": "pikachu"
            },
            {
                "name": "Usuário Teste Secundário", 
                "email": "teste2@teste.com",
                "password": "Teste123",
                "security_question": "Qual é o seu Pokémon favorito?",
                "security_answer": "charizard"
            }
        ]
        
        for user_info in test_users:
            print(f"\n👤 Processando usuário: {user_info['email']}")
            
            # Verificar se usuário já existe
            existing_user = auth_service.get_user_by_email(db, user_info['email'])
            if existing_user:
                print(f"✅ Usuário {user_info['email']} já existe")
                continue
            
            # Criar novo usuário
            user_data = UserCreate(
                name=user_info['name'],
                email=user_info['email'],
                password=user_info['password'],
                security_question=user_info['security_question'],
                security_answer=user_info['security_answer']
            )
            
            new_user = auth_service.create_user(db, user_data)
            print(f"✅ Usuário criado: {new_user.email} (ID: {new_user.id})")
        
        print("\n🎉 Usuários de teste criados com sucesso!")
        print("\n📋 Credenciais disponíveis:")
        print("   Email: teste@teste.com | Senha: Teste123")
        print("   Email: teste2@teste.com | Senha: Teste123")
        
    except Exception as e:
        print(f"❌ Erro ao criar usuários: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()
    
    return True


if __name__ == "__main__":
    success = create_test_users()
    sys.exit(0 if success else 1)
