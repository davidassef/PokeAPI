"""
Script para migrar o banco de dados do schema antigo (username) para o novo (email + name).
"""
import sqlite3
import os
from datetime import datetime

# Caminho do banco de dados
DB_PATH = "pokemon_app.db"
BACKUP_PATH = f"pokemon_app_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"

def migrate_database():
    """Migra o banco de dados para o novo schema."""

    if not os.path.exists(DB_PATH):
        print("❌ Banco de dados não encontrado. Criando novo schema...")
        return True

    print(f"🔄 Iniciando migração do banco de dados...")

    # Fazer backup
    if os.path.exists(BACKUP_PATH):
        os.remove(BACKUP_PATH)

    import shutil
    shutil.copy2(DB_PATH, BACKUP_PATH)
    print(f"📋 Backup criado: {BACKUP_PATH}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Verificar se a tabela users existe e tem a estrutura antiga
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]

        if 'username' in columns and 'name' not in columns:
            print("🔄 Migrando estrutura da tabela users...")

            # Criar nova tabela com a estrutura atualizada
            cursor.execute("""
                CREATE TABLE users_new (
                    id INTEGER PRIMARY KEY,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    contact VARCHAR(100),
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Migrar dados existentes
            cursor.execute("""
                INSERT INTO users_new (id, email, password_hash, name, is_active, created_at, updated_at)
                SELECT
                    id,
                    email,
                    password_hash,
                    COALESCE(full_name, username) as name,
                    is_active,
                    created_at,
                    updated_at
                FROM users
            """)

            # Remover tabela antiga e renomear nova
            cursor.execute("DROP TABLE users")
            cursor.execute("ALTER TABLE users_new RENAME TO users")

            print("✅ Migração da tabela users concluída")

        else:
            print("ℹ️  Tabela users já está na estrutura correta ou não existe")

        conn.commit()
        print("✅ Migração concluída com sucesso!")

    except Exception as e:
        print(f"❌ Erro durante a migração: {e}")
        conn.rollback()

        # Restaurar backup
        conn.close()
        if os.path.exists(BACKUP_PATH):
            shutil.copy2(BACKUP_PATH, DB_PATH)
            print(f"🔄 Backup restaurado")
        return False

    finally:
        conn.close()

    return True

if __name__ == "__main__":
    success = migrate_database()
    if success:
        print("\n🎉 Migração concluída! O sistema agora usa email + nome ao invés de username.")
        print("📧 Login: email + senha")
        print("👤 Perfil: nome (obrigatório) + contato (opcional)")
    else:
        print("\n❌ Migração falhou. Verifique os logs acima.")
