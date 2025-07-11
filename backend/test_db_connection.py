#!/usr/bin/env python3
"""
Teste simples para verificar conectividade com o banco de dados.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import SessionLocal, engine
from app.models.models import User
from app.services.auth_service import auth_service
from app.schemas.user import UserCreate

def test_db_connection():
    """Testa a conexão com o banco de dados."""
    print("🔍 Testando conexão com o banco de dados...")
    
    try:
        # Testa conexão básica
        db = SessionLocal()
        print("✅ Conexão com banco estabelecida")
        
        # Testa consulta simples
        users = db.query(User).all()
        print(f"✅ Consulta executada: {len(users)} usuários encontrados")
        
        # Testa criação de usuário
        print("🔄 Testando criação de usuário...")
        
        user_data = UserCreate(
            name="Test User DB",
            email="testdb@example.com",
            password="password123",
            security_question="What is your favorite color?",
            security_answer="blue"
        )
        
        # Verifica se usuário já existe
        existing_user = auth_service.get_user_by_email(db, user_data.email)
        if existing_user:
            print(f"⚠️ Usuário {user_data.email} já existe, removendo...")
            db.delete(existing_user)
            db.commit()
        
        # Cria novo usuário
        new_user = auth_service.create_user(db, user_data)
        print(f"✅ Usuário criado com sucesso: {new_user.email}")
        
        # Remove usuário de teste
        db.delete(new_user)
        db.commit()
        print("✅ Usuário de teste removido")
        
        db.close()
        print("🎉 Teste de banco de dados concluído com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste de banco: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_db_connection()
    sys.exit(0 if success else 1)
