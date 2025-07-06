import sqlite3
import sys

def check_table_structure():
    try:
        conn = sqlite3.connect('pokemon_app.db')
        cursor = conn.cursor()

        # Verificar se a tabela users existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        table_exists = cursor.fetchone()

        if table_exists:
            print("✅ Tabela users encontrada")

            # Verificar estrutura da tabela
            cursor.execute("PRAGMA table_info(users)")
            columns = cursor.fetchall()

            print("\n📋 Estrutura atual da tabela users:")
            for col in columns:
                print(f"  - {col[1]} ({col[2]}) - PK: {col[5]}, NOT NULL: {col[3]}, DEFAULT: {col[4]}")

            # Verificar dados existentes
            cursor.execute("SELECT COUNT(*) FROM users")
            count = cursor.fetchone()[0]
            print(f"\n👥 Número de usuários: {count}")

            if count > 0:
                print("\n📋 Primeiros 3 usuários:")
                cursor.execute("SELECT * FROM users LIMIT 3")
                users = cursor.fetchall()
                for user in users:
                    print(f"  - {user}")

        else:
            print("❌ Tabela users não encontrada")

        conn.close()

    except Exception as e:
        print(f"❌ Erro: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_table_structure()
