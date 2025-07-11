#!/usr/bin/env python3
"""
Script de migração para adicionar campos RBAC ao banco de dados.

Este script:
1. Adiciona campo 'role' à tabela users
2. Adiciona campo 'last_login' à tabela users
3. Atualiza usuários existentes com role padrão 'user'
4. Cria usuário administrador padrão
5. Faz backup do banco antes das alterações

Uso:
    python scripts/migrate_rbac_schema.py
"""

import os
import sys
import sqlite3
import shutil
from datetime import datetime
from pathlib import Path

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from core.database import engine, SessionLocal
    from app.models.models import User, UserRole
    from app.services.auth_service import auth_service
    from sqlalchemy import text
    from sqlalchemy.orm import Session
except ImportError as e:
    print(f"❌ Erro ao importar módulos: {e}")
    print("Certifique-se de que está executando dentro do diretório backend.")
    sys.exit(1)


def backup_database():
    """Cria backup do banco de dados antes da migração."""
    db_path = "data/pokemon_app.db"
    if os.path.exists(db_path):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"data/pokemon_app_rbac_backup_{timestamp}.db"
        shutil.copy2(db_path, backup_path)
        print(f"✅ Backup criado: {backup_path}")
        return backup_path
    else:
        print("⚠️ Arquivo de banco não encontrado, criando novo banco")
        return None


def check_column_exists(db: Session, table_name: str, column_name: str) -> bool:
    """Verifica se uma coluna existe na tabela."""
    try:
        result = db.execute(text(f"PRAGMA table_info({table_name})"))
        columns = [row[1] for row in result.fetchall()]
        return column_name in columns
    except Exception as e:
        print(f"❌ Erro ao verificar coluna {column_name}: {e}")
        return False


def add_role_column(db: Session):
    """Adiciona coluna 'role' à tabela users."""
    if check_column_exists(db, "users", "role"):
        print("✅ Coluna 'role' já existe")
        return True
    
    try:
        print("🔄 Adicionando coluna 'role' à tabela users...")
        db.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'"))
        db.commit()
        print("✅ Coluna 'role' adicionada com sucesso")
        return True
    except Exception as e:
        print(f"❌ Erro ao adicionar coluna 'role': {e}")
        db.rollback()
        return False


def add_last_login_column(db: Session):
    """Adiciona coluna 'last_login' à tabela users."""
    if check_column_exists(db, "users", "last_login"):
        print("✅ Coluna 'last_login' já existe")
        return True
    
    try:
        print("🔄 Adicionando coluna 'last_login' à tabela users...")
        db.execute(text("ALTER TABLE users ADD COLUMN last_login TIMESTAMP"))
        db.commit()
        print("✅ Coluna 'last_login' adicionada com sucesso")
        return True
    except Exception as e:
        print(f"❌ Erro ao adicionar coluna 'last_login': {e}")
        db.rollback()
        return False


def update_existing_users_roles(db: Session):
    """Atualiza usuários existentes com role padrão."""
    try:
        print("🔄 Atualizando roles de usuários existentes...")
        
        # Verificar quantos usuários não têm role definido
        result = db.execute(text("SELECT COUNT(*) FROM users WHERE role IS NULL OR role = ''"))
        count = result.scalar()
        
        if count > 0:
            # Atualizar usuários sem role para 'user'
            db.execute(text("UPDATE users SET role = 'user' WHERE role IS NULL OR role = ''"))
            db.commit()
            print(f"✅ {count} usuários atualizados com role 'user'")
        else:
            print("✅ Todos os usuários já têm roles definidos")
        
        return True
    except Exception as e:
        print(f"❌ Erro ao atualizar roles: {e}")
        db.rollback()
        return False


def create_admin_user(db: Session):
    """Cria usuário administrador padrão se não existir."""
    try:
        print("🔄 Verificando usuário administrador...")
        
        # Verificar se já existe um admin
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        
        if admin_user:
            # Atualizar role para administrator se necessário
            if admin_user.role != UserRole.ADMINISTRATOR.value:
                admin_user.role = UserRole.ADMINISTRATOR.value
                db.commit()
                print("✅ Usuário admin existente atualizado para role 'administrator'")
            else:
                print("✅ Usuário administrador já existe")
            return True
        
        # Criar novo usuário admin
        print("🔄 Criando usuário administrador padrão...")
        
        password_hash = auth_service.get_password_hash("admin")
        security_answer_hash = auth_service.get_password_hash("admin")
        
        admin_user = User(
            name="Administrator",
            email="admin@example.com",
            password_hash=password_hash,
            role=UserRole.ADMINISTRATOR.value,
            security_question="What is the admin password?",
            security_answer_hash=security_answer_hash,
            is_active=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Usuário administrador criado:")
        print(f"   Email: admin@example.com")
        print(f"   Senha: admin")
        print(f"   Role: {admin_user.role}")
        print(f"   ID: {admin_user.id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar usuário admin: {e}")
        db.rollback()
        return False


def verify_migration(db: Session):
    """Verifica se a migração foi bem-sucedida."""
    try:
        print("🔍 Verificando migração...")
        
        # Verificar estrutura da tabela
        result = db.execute(text("PRAGMA table_info(users)"))
        columns = {row[1]: row[2] for row in result.fetchall()}
        
        required_columns = ["role", "last_login"]
        missing_columns = [col for col in required_columns if col not in columns]
        
        if missing_columns:
            print(f"❌ Colunas faltando: {missing_columns}")
            return False
        
        # Verificar usuários
        total_users = db.query(User).count()
        admin_users = db.query(User).filter(User.role == UserRole.ADMINISTRATOR.value).count()
        regular_users = db.query(User).filter(User.role == UserRole.USER.value).count()
        
        print("✅ Verificação da migração:")
        print(f"   Total de usuários: {total_users}")
        print(f"   Administradores: {admin_users}")
        print(f"   Usuários regulares: {regular_users}")
        print(f"   Colunas adicionadas: {', '.join(required_columns)}")
        
        # Verificar se existe pelo menos um admin
        if admin_users == 0:
            print("⚠️ Nenhum usuário administrador encontrado!")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Erro na verificação: {e}")
        return False


def main():
    """Função principal da migração."""
    print("🚀 Iniciando migração RBAC do banco de dados...")
    print("=" * 60)
    
    # Criar backup
    backup_path = backup_database()
    
    # Conectar ao banco
    db = SessionLocal()
    
    try:
        # Executar migrações
        steps = [
            ("Adicionar coluna 'role'", lambda: add_role_column(db)),
            ("Adicionar coluna 'last_login'", lambda: add_last_login_column(db)),
            ("Atualizar roles existentes", lambda: update_existing_users_roles(db)),
            ("Criar usuário administrador", lambda: create_admin_user(db)),
            ("Verificar migração", lambda: verify_migration(db))
        ]
        
        for step_name, step_func in steps:
            print(f"\n📋 {step_name}...")
            if not step_func():
                print(f"❌ Falha na etapa: {step_name}")
                if backup_path:
                    print(f"💾 Backup disponível em: {backup_path}")
                return False
        
        print("\n" + "=" * 60)
        print("🎉 Migração RBAC concluída com sucesso!")
        print("\n📋 Resumo:")
        print("✅ Schema do banco atualizado")
        print("✅ Usuário administrador criado/atualizado")
        print("✅ Roles de usuários configurados")
        print("\n🔐 Credenciais do administrador:")
        print("   Email: admin@example.com")
        print("   Senha: admin")
        print("\n⚠️ IMPORTANTE: Altere a senha do administrador após o primeiro login!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Erro durante a migração: {e}")
        if backup_path:
            print(f"💾 Backup disponível em: {backup_path}")
        return False
        
    finally:
        db.close()


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
