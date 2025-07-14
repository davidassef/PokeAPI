#!/usr/bin/env python3
"""
Script para verificar a estrutura da tabela de usuários no banco de dados.

Este script conecta ao banco de dados SQLite e verifica:
- Se a tabela 'users' existe
- A estrutura completa da tabela (colunas, tipos, constraints)
- Quantidade de usuários cadastrados
- Amostra dos primeiros usuários (se houver)

Útil para debugging e verificação de integridade do banco de dados.
"""

import sqlite3
import sys


def check_table_structure():
    """
    Verifica a estrutura da tabela de usuários no banco de dados.
    
    Esta função:
    1. Conecta ao banco de dados SQLite
    2. Verifica se a tabela 'users' existe
    3. Exibe a estrutura completa da tabela
    4. Mostra estatísticas de usuários cadastrados
    5. Exibe amostra dos dados (primeiros 3 usuários)
    
    Returns:
        None
        
    Raises:
        Exception: Se houver erro na conexão ou consulta ao banco
    """
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
