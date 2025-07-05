#!/usr/bin/env python3
"""
Script para limpar o banco de dados antes do deploy.
Este script deve ser executado antes de cada deploy para garantir banco vazio.
"""
import os
import sys
from sqlalchemy import create_engine

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from app.models.models import Base
    from app.core.config import Settings
except ImportError as e:
    print(f"❌ Erro ao importar módulos: {e}")
    print("Certifique-se de que está executando dentro do diretório do projeto.")
    sys.exit(1)


def clean_database():
    """Limpar o banco de dados para garantir deploy vazio."""
    print("🧹 Limpando banco de dados para deploy...")

    # Configurações
    settings = Settings()
    print(f"📋 Database URL: {settings.database_url}")

    # Criar engine
    engine = create_engine(settings.database_url)

    try:
        # Dropar todas as tabelas
        print("🗑️  Removendo todas as tabelas...")
        Base.metadata.drop_all(bind=engine)
        print("✅ Tabelas removidas")

        # Recriar tabelas vazias
        print("🏗️  Criando tabelas vazias...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tabelas criadas vazias")

        print("✅ SUCESSO: Banco de dados limpo!")
        print("🎉 Deploy pode ser feito com banco vazio")

    except Exception as e:
        print(f"❌ Erro ao limpar banco: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def remove_database_file():
    """Remover arquivo do banco para garantir deploy limpo."""
    print("🗑️  Removendo arquivo do banco...")

    db_files = [
        "backend/pokemon_app.db",
        "pokemon_app.db",
        "backend/test_pokemon.db",
        "test_pokemon.db"
    ]

    for db_file in db_files:
        if os.path.exists(db_file):
            os.remove(db_file)
            print(f"✅ Removido: {db_file}")
        else:
            print(f"ℹ️  Não encontrado: {db_file}")


if __name__ == "__main__":
    print("🧹 Limpeza de Deploy - PokeAPIApp")
    print("=" * 50)

    # Opção 1: Limpar tabelas (mantém arquivo)
    clean_database()

    # Opção 2: Remover arquivo completamente (opcional)
    response = input("\n🤔 Remover arquivo do banco completamente? (y/n): ").lower()
    if response == 'y':
        remove_database_file()

    print("\n" + "=" * 50)
    print("✅ Limpeza concluída!")
    print("🚀 Pronto para deploy com banco vazio")
