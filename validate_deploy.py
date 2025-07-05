#!/usr/bin/env python3
"""
Script para validar se o banco de dados está vazio após deploy.
Este script deve ser executado para verificar se o deploy está correto.
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from app.models.models import User, FavoritePokemon, PokemonRanking
    from app.core.config import Settings
except ImportError as e:
    print(f"❌ Erro ao importar módulos: {e}")
    print("Certifique-se de que está executando dentro do diretório do projeto.")
    sys.exit(1)


def validate_empty_database():
    """Validar se o banco de dados está vazio após deploy."""
    print("🔍 Validando banco de dados vazio após deploy...")

    # Configurações
    settings = Settings()
    print(f"📋 Database URL: {settings.database_url}")

    # Criar engine
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Verificar se o arquivo do banco existe
    db_file = "backend/pokemon_app.db"
    if os.path.exists(db_file):
        print(f"✅ Arquivo do banco encontrado: {db_file}")
        file_size = os.path.getsize(db_file)
        print(f"📊 Tamanho do arquivo: {file_size} bytes")

        # Arquivo muito pequeno indica banco vazio (apenas estruturas)
        if file_size < 50000:  # 50KB
            print("✅ Arquivo pequeno - provavelmente banco vazio")
        else:
            print("⚠️  Arquivo grande - pode ter dados")
    else:
        print(f"❌ Arquivo do banco não encontrado: {db_file}")
        print("Isso é normal em produção no Render (banco em memória)")

    # Sessão do banco
    db = SessionLocal()

    try:
        # Verificar se as tabelas existem
        print("\n🗂️  Verificando estrutura do banco...")
        result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = result.fetchall()
        table_names = [table[0] for table in tables]
        print(f"📋 Tabelas encontradas: {table_names}")

        # Verificar se tabelas necessárias existem
        required_tables = ['users', 'favorite_pokemons', 'pokemon_rankings']
        missing_tables = [t for t in required_tables if t not in table_names]

        if missing_tables:
            print(f"❌ Tabelas faltando: {missing_tables}")
            return False
        else:
            print("✅ Todas as tabelas necessárias existem")

        # Verificar se as tabelas estão vazias
        print("\n🔍 Verificando se tabelas estão vazias...")

        # Contar usuários
        user_count = db.query(User).count()
        print(f"👥 Usuários: {user_count}")

        # Contar favoritos
        favorite_count = db.query(FavoritePokemon).count()
        print(f"⭐ Favoritos: {favorite_count}")

        # Contar rankings
        ranking_count = db.query(PokemonRanking).count()
        print(f"🏆 Rankings: {ranking_count}")

        # Verificar se está vazio
        is_empty = user_count == 0 and favorite_count == 0 and ranking_count == 0

        if is_empty:
            print("\n✅ SUCESSO: Banco de dados está vazio!")
            print("🎉 Deploy configurado corretamente - banco será alimentado apenas pelo frontend")
            return True
        else:
            print("\n⚠️  AVISO: Banco de dados contém dados!")
            print("🔧 Isso pode indicar que:")
            print("   - Dados foram criados pelo uso do frontend (normal)")
            print("   - Algum script de seed foi executado (verificar)")
            print("   - Este não é um deploy limpo")

            # Mostrar alguns dados se existirem
            if user_count > 0:
                print("\n👥 Usuários encontrados:")
                users = db.query(User).limit(3).all()
                for user in users:
                    print(f"   - {user.username} ({user.email})")

            if ranking_count > 0:
                print("\n🏆 Rankings encontrados:")
                rankings = db.query(PokemonRanking).order_by(PokemonRanking.favorite_count.desc()).limit(3).all()
                for ranking in rankings:
                    print(f"   - {ranking.pokemon_name} ({ranking.favorite_count} favoritos)")

            return False

    except Exception as e:
        print(f"❌ Erro ao verificar banco: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def validate_production_config():
    """Validar se a configuração está correta para produção."""
    print("\n🔧 Validando configuração de produção...")

    # Verificar se debug_database.py foi removido
    if os.path.exists("backend/debug_database.py"):
        print("❌ ERRO: debug_database.py ainda existe!")
        print("   Este arquivo deve ser removido em produção")
        return False
    else:
        print("✅ debug_database.py foi removido")

    # Verificar main.py
    try:
        with open("backend/main.py", "r", encoding="utf-8") as f:
            content = f.read()

        # Verificar se endpoints de admin foram removidos
        if "/admin/seed-data" in content:
            print("❌ ERRO: Endpoint /admin/seed-data ainda existe!")
            print("   Este endpoint deve ser removido em produção")
            return False
        else:
            print("✅ Endpoint /admin/seed-data foi removido")

        if "/admin/reset-database" in content:
            print("❌ ERRO: Endpoint /admin/reset-database ainda existe!")
            print("   Este endpoint deve ser removido em produção")
            return False
        else:
            print("✅ Endpoint /admin/reset-database foi removido")

        # Verificar se endpoint de status existe
        if "/api/database-status" in content:
            print("✅ Endpoint /api/database-status existe")
        else:
            print("⚠️  Endpoint /api/database-status não encontrado")

    except Exception as e:
        print(f"❌ Erro ao verificar main.py: {e}")
        return False

    return True


if __name__ == "__main__":
    print("🚀 Validação de Deploy - PokeAPIApp")
    print("=" * 50)

    # Validar configuração
    config_ok = validate_production_config()

    # Validar banco vazio
    db_ok = validate_empty_database()

    print("\n" + "=" * 50)
    if config_ok and db_ok:
        print("✅ VALIDAÇÃO PASSOU: Deploy está correto!")
        print("🎉 Banco vazio, configuração correta para produção")
        sys.exit(0)
    else:
        print("❌ VALIDAÇÃO FALHOU: Deploy precisa de ajustes")
        if not config_ok:
            print("🔧 Corrigir configuração de produção")
        if not db_ok:
            print("🗄️  Verificar estado do banco de dados")
        sys.exit(1)
