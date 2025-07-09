import sqlite3
import shutil
from datetime import datetime
import os

def migrate_users_table():
    """Migra a tabela users do formato antigo para o novo formato"""

    db_path = 'pokemon_app.db'

    # Backup do banco atual
    backup_path = f"pokemon_app_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    shutil.copy2(db_path, backup_path)
    print(f"📋 Backup criado: {backup_path}")

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Verificar estrutura atual
        cursor.execute("PRAGMA table_info(users)")
        current_columns = {col[1]: col for col in cursor.fetchall()}
        print(f"📋 Estrutura atual: {list(current_columns.keys())}")

        # Backup dos dados existentes
        cursor.execute("SELECT * FROM users")
        existing_users = cursor.fetchall()
        print(f"👥 Usuários existentes: {len(existing_users)}")

        # Criar nova tabela com estrutura correta
        cursor.execute("""
            CREATE TABLE users_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                contact VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ Nova tabela users_new criada")

        # Migrar dados existentes
        for user in existing_users:
            user_id, username, email, created_at, is_active = user

            # Dados padrão para campos novos
            password_hash = "$2b$12$dummy.hash.for.migration.purposes"  # Hash temporário
            name = username  # Usar username como nome inicial
            contact = None   # Contato vazio

            cursor.execute("""
                INSERT INTO users_new (id, email, password_hash, name, contact, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, email, password_hash, name, contact, is_active, created_at, created_at))

        print(f"✅ {len(existing_users)} usuários migrados")

        # Renomear tabelas
        cursor.execute("DROP TABLE users")
        cursor.execute("ALTER TABLE users_new RENAME TO users")

        print("✅ Tabela users atualizada com sucesso")

        # Verificar resultado
        cursor.execute("PRAGMA table_info(users)")
        new_columns = cursor.fetchall()
        print(f"📋 Nova estrutura: {[col[1] for col in new_columns]}")

        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        print(f"👥 Usuários após migração: {count}")

        conn.commit()
        conn.close()

        print("🎉 Migração concluída com sucesso!")
        print("⚠️  IMPORTANTE: Todos os usuários terão senha temporária. Eles precisarão redefinir suas senhas.")

    except Exception as e:
        print(f"❌ Erro durante a migração: {e}")
        print("🔄 Restaurando backup...")
        shutil.copy2(backup_path, db_path)
        print("✅ Backup restaurado")
        raise

if __name__ == "__main__":
    migrate_users_table()
