#!/usr/bin/env python3
"""
SCRIPT DE DIAGNÓSTICO URGENTE - PERDA DE DADOS
Este script investiga e documenta a perda de dados dos usuários de teste.
"""
import os
import sys
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import Settings
from app.models.models import Base, User
from app.services.auth_service import auth_service


def diagnose_data_loss():
    """Diagnóstica o problema de perda de dados."""
    print("🚨 DIAGNÓSTICO URGENTE - PERDA DE DADOS")
    print("=" * 60)
    print(f"⏰ Timestamp: {datetime.now()}")
    
    # Configurações
    settings = Settings()
    print(f"📋 Database URL: {settings.database_url}")
    
    # Verificar tipo de banco
    if "sqlite" in settings.database_url:
        print("⚠️  PROBLEMA CRÍTICO: Usando SQLite (dados temporários)")
        db_file = settings.database_url.replace("sqlite:///", "").replace("./", "")
        print(f"📁 Arquivo do banco: {db_file}")
        
        if os.path.exists(db_file):
            size = os.path.getsize(db_file)
            mtime = datetime.fromtimestamp(os.path.getmtime(db_file))
            print(f"📊 Tamanho: {size} bytes")
            print(f"🕐 Última modificação: {mtime}")
        else:
            print("❌ ARQUIVO DO BANCO NÃO EXISTE!")
    else:
        print("✅ Usando banco persistente")
    
    # Criar engine e sessão
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Criar tabelas se não existirem
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        print("\n🔍 INVESTIGAÇÃO DO BANCO DE DADOS")
        print("-" * 40)
        
        # Verificar tabelas
        result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = [row[0] for row in result.fetchall()]
        print(f"📋 Tabelas: {tables}")
        
        # Verificar usuários
        users = db.query(User).all()
        print(f"👥 Total de usuários: {len(users)}")
        
        if users:
            print("\n📋 Usuários encontrados:")
            for user in users:
                print(f"  - ID: {user.id}")
                print(f"    Nome: {user.name}")
                print(f"    Email: {user.email}")
                print(f"    Ativo: {user.is_active}")
                print(f"    Criado: {getattr(user, 'created_at', 'N/A')}")
                print()
        else:
            print("❌ NENHUM USUÁRIO ENCONTRADO!")
            print("🔍 Verificando se usuários de teste existem...")
            
            test_emails = ["teste@teste.com", "teste2@teste.com"]
            for email in test_emails:
                user = auth_service.get_user_by_email(db, email)
                if user:
                    print(f"✅ {email} encontrado")
                else:
                    print(f"❌ {email} NÃO ENCONTRADO")
        
        print("\n🔧 AÇÕES RECOMENDADAS")
        print("-" * 40)
        print("1. 🚨 URGENTE: Migrar para PostgreSQL")
        print("2. 🔒 Configurar DATABASE_URL no Render")
        print("3. 🛡️  Implementar backup automático")
        print("4. 📊 Monitorar persistência de dados")
        print("5. 🧪 Testar com dados reais")
        
    except Exception as e:
        print(f"❌ Erro durante diagnóstico: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    diagnose_data_loss()
