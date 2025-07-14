#!/usr/bin/env python3
"""
Script para debugar e verificar o estado do banco de dados local.

Este script realiza uma análise completa do banco de dados SQLite:
- Verifica a existência e estrutura das tabelas
- Conta e exibe dados de usuários, favoritos e rankings
- Cria dados de seed se o banco estiver vazio
- Fornece informações detalhadas para debugging

Útil para desenvolvimento e manutenção do sistema.
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.models import Base, User, FavoritePokemon, PokemonRanking
from app.core.config import Settings

# Configurar o caminho para importar os módulos
sys.path.append(os.path.join(os.path.dirname(__file__)))


def debug_database():
    """
    Executa debug completo do banco de dados local.
    
    Esta função:
    1. Verifica a configuração do banco de dados
    2. Cria tabelas se não existirem
    3. Analisa dados de usuários, favoritos e rankings
    4. Cria dados de seed se necessário
    5. Exibe estatísticas detalhadas
    
    Returns:
        None
        
    Raises:
        Exception: Se houver erro na conexão ou operações do banco
    """
    print("🔍 Debugando banco de dados local...")

    # Configurações
    settings = Settings()
    print(f"📋 Database URL: {settings.database_url}")

    # Criar engine
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Criar tabelas se não existirem
    Base.metadata.create_all(bind=engine)

    # Verificar se o arquivo do banco existe
    db_file = "pokemon_app.db"
    if os.path.exists(db_file):
        print(f"✅ Arquivo do banco encontrado: {db_file}")
        print(f"📊 Tamanho do arquivo: {os.path.getsize(db_file)} bytes")
    else:
        print(f"❌ Arquivo do banco não encontrado: {db_file}")

    # Sessão do banco
    db = SessionLocal()

    try:
        # Verificar tabelas
        print("\n🗂️  Verificando tabelas...")
        result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = result.fetchall()
        print(f"📋 Tabelas encontradas: {[table[0] for table in tables]}")

        # Verificar dados dos usuários
        print("\n👥 Verificando usuários...")
        users = db.query(User).all()
        print(f"📊 Total de usuários: {len(users)}")
        for user in users:
            print(f"  - {user.id}: {user.name} ({user.email})")

        # Verificar dados de favoritos
        print("\n⭐ Verificando favoritos...")
        favorites = db.query(FavoritePokemon).all()
        print(f"📊 Total de favoritos: {len(favorites)}")
        for fav in favorites[:5]:  # Mostrar só os primeiros 5
            print(f"  - {fav.pokemon_name} (ID: {fav.pokemon_id}) - Usuário: {fav.user_id}")

        # Verificar dados de ranking
        print("\n🏆 Verificando ranking...")
        rankings = db.query(PokemonRanking).order_by(PokemonRanking.favorite_count.desc()).all()
        print(f"📊 Total de rankings: {len(rankings)}")
        for rank in rankings:
            print(f"  - {rank.pokemon_name} (ID: {rank.pokemon_id}) - Favoritado: {rank.favorite_count} vezes")

        # Verificar se há dados
        if len(rankings) == 0:
            print("\n❌ Nenhum dado de ranking encontrado!")
            print("🔧 Executando seed dos dados...")

            # Seed básico
            default_user = User(
                username="admin",
                email="admin@pokemon.com"
            )
            db.add(default_user)
            db.commit()
            db.refresh(default_user)

            # Adicionar alguns favoritos/ranking iniciais populares
            popular_pokemon_list = [
                {"pokemon_id": 25, "pokemon_name": "pikachu"},
                {"pokemon_id": 6, "pokemon_name": "charizard"},
                {"pokemon_id": 150, "pokemon_name": "mewtwo"},
                {"pokemon_id": 144, "pokemon_name": "articuno"},
                {"pokemon_id": 1, "pokemon_name": "bulbasaur"},
                {"pokemon_id": 4, "pokemon_name": "charmander"},
                {"pokemon_id": 7, "pokemon_name": "squirtle"},
                {"pokemon_id": 39, "pokemon_name": "jigglypuff"},
                {"pokemon_id": 94, "pokemon_name": "gengar"},
                {"pokemon_id": 130, "pokemon_name": "gyarados"}
            ]

            for i, poke_data in enumerate(popular_pokemon_list):
                # Criar entrada de ranking
                ranking_entry = PokemonRanking(
                    pokemon_id=poke_data["pokemon_id"],
                    pokemon_name=poke_data["pokemon_name"],
                    favorite_count=10 - i  # Começar com contagens decrescentes
                )
                db.add(ranking_entry)

                # Criar alguns favoritos para o usuário padrão
                if i < 5:  # Adicionar os 5 primeiros como favoritos
                    favorite_entry = FavoritePokemon(
                        user_id=default_user.id,
                        pokemon_id=poke_data["pokemon_id"],
                        pokemon_name=poke_data["pokemon_name"]
                    )
                    db.add(favorite_entry)

            db.commit()
            print("✅ Dados de seed criados com sucesso!")

            # Verificar novamente
            rankings = db.query(PokemonRanking).order_by(PokemonRanking.favorite_count.desc()).all()
            print(f"\n📊 Novo total de rankings: {len(rankings)}")
            for rank in rankings:
                print(f"  - {rank.pokemon_name} (ID: {rank.pokemon_id}) - Favoritado: {rank.favorite_count} vezes")
        else:
            print("✅ Dados de ranking encontrados!")

    except Exception as e:
        print(f"❌ Erro ao verificar banco: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    debug_database()
