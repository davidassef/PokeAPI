"""
Script para adicionar campos de segurança à tabela users.
Adiciona security_question e security_answer_hash para recuperação de senha.
"""
import sqlite3
import os
from datetime import datetime

# Caminho do banco de dados
DB_PATH = "backend/data/pokemon_app.db"
BACKUP_PATH = f"backend/data/pokemon_app_security_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"

def migrate_security_fields():
    """Adiciona campos de segurança à tabela users."""

    if not os.path.exists(DB_PATH):
        print("❌ Banco de dados não encontrado.")
        return False

    print(f"🔄 Iniciando migração dos campos de segurança...")

    # Fazer backup
    if os.path.exists(BACKUP_PATH):
        os.remove(BACKUP_PATH)

    import shutil
    shutil.copy2(DB_PATH, BACKUP_PATH)
    print(f"📋 Backup criado: {BACKUP_PATH}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Verificar se os campos de segurança já existem
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]

        if 'security_question' not in columns:
            print("🔄 Adicionando campo security_question...")
            cursor.execute("ALTER TABLE users ADD COLUMN security_question VARCHAR(50)")

        if 'security_answer_hash' not in columns:
            print("🔄 Adicionando campo security_answer_hash...")
            cursor.execute("ALTER TABLE users ADD COLUMN security_answer_hash VARCHAR(255)")

        conn.commit()
        print("✅ Migração dos campos de segurança concluída!")

        # Verificar estrutura final
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"📋 Campos da tabela users: {', '.join(columns)}")

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
    success = migrate_security_fields()
    if success:
        print("\n🎉 Migração concluída! Campos de segurança adicionados.")
        print("🔐 Novos usuários podem configurar pergunta de segurança")
        print("🔑 Recuperação de senha disponível via pergunta secreta")
    else:
        print("\n❌ Migração falhou. Verifique os logs acima.")
