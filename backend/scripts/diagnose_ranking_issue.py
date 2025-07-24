#!/usr/bin/env python3
"""
Script para diagnosticar problemas no sistema de ranking.
Verifica se há dados suficientes para gerar o ranking.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.models import User, FavoritePokemon, PokemonRanking
from app.services.favorite_service import FavoriteService
from sqlalchemy import func
import requests

def print_section(title):
    """Imprime seção formatada."""
    print(f"\n{'='*50}")
    print(f"🔍 {title}")
    print('='*50)

def check_database_data():
    """Verifica dados no banco de dados."""
    print_section("VERIFICANDO DADOS NO BANCO")
    
    with SessionLocal() as db:
        # Verificar usuários
        user_count = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        print(f"👥 Usuários: {user_count} total, {active_users} ativos")
        
        # Verificar favoritos/capturas
        favorite_count = db.query(FavoritePokemon).count()
        print(f"⭐ Favoritos/Capturas: {favorite_count}")
        
        if favorite_count > 0:
            # Mostrar alguns favoritos
            recent_favorites = db.query(FavoritePokemon).order_by(
                FavoritePokemon.added_at.desc()
            ).limit(5).all()
            
            print("📋 Últimos 5 favoritos:")
            for fav in recent_favorites:
                print(f"   - {fav.pokemon_name} (ID: {fav.pokemon_id}) - User: {fav.user_id}")
            
            # Contar por usuário
            user_counts = db.query(
                FavoritePokemon.user_id,
                func.count(FavoritePokemon.id).label('count')
            ).group_by(FavoritePokemon.user_id).all()
            
            print("📊 Favoritos por usuário:")
            for user_id, count in user_counts:
                print(f"   - User {user_id}: {count} favoritos")
        
        # Verificar tabela de ranking
        ranking_count = db.query(PokemonRanking).count()
        print(f"🏆 Registros na tabela pokemon_rankings: {ranking_count}")
        
        if ranking_count > 0:
            rankings = db.query(PokemonRanking).order_by(
                PokemonRanking.favorite_count.desc()
            ).limit(5).all()
            
            print("🥇 Top 5 do ranking:")
            for rank in rankings:
                print(f"   - {rank.pokemon_name} (ID: {rank.pokemon_id}): {rank.favorite_count} capturas")

def test_ranking_service():
    """Testa o serviço de ranking."""
    print_section("TESTANDO SERVIÇO DE RANKING")
    
    with SessionLocal() as db:
        try:
            # Testar método get_ranking
            ranking = FavoriteService.get_ranking(db, limit=10)
            print(f"✅ FavoriteService.get_ranking() retornou {len(ranking)} itens")
            
            if ranking:
                print("📋 Ranking retornado:")
                for i, item in enumerate(ranking[:5]):
                    print(f"   {i+1}. {item.get('pokemon_name')} (ID: {item.get('pokemon_id')}): {item.get('favorite_count')} capturas")
            else:
                print("⚠️ Ranking vazio - verificando causa...")
                
                # Verificar se há dados para gerar ranking
                fav_count = db.query(FavoritePokemon).count()
                rank_count = db.query(PokemonRanking).count()
                
                print(f"   - Favoritos na tabela: {fav_count}")
                print(f"   - Rankings na tabela: {rank_count}")
                
                if fav_count == 0 and rank_count == 0:
                    print("❌ PROBLEMA: Não há dados suficientes para gerar ranking")
                    print("   Solução: Adicione alguns pokémons aos favoritos primeiro")
                
        except Exception as e:
            print(f"❌ Erro ao testar ranking service: {e}")

def test_backend_endpoint():
    """Testa o endpoint do backend."""
    print_section("TESTANDO ENDPOINT DO BACKEND")
    
    try:
        # Testar endpoint local
        response = requests.get("http://localhost:8000/api/v1/ranking/", timeout=10)
        print(f"📡 Status do endpoint: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Endpoint funcionando - {len(data)} itens retornados")
            
            if data:
                print("📋 Dados do endpoint:")
                for i, item in enumerate(data[:3]):
                    print(f"   {i+1}. {item.get('pokemon_name')} (ID: {item.get('pokemon_id')}): {item.get('favorite_count')} capturas")
            else:
                print("⚠️ Endpoint retornou array vazio")
        else:
            print(f"❌ Endpoint retornou erro: {response.status_code}")
            print(f"   Resposta: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Não foi possível conectar ao backend (http://localhost:8000)")
        print("   Certifique-se de que o servidor está rodando")
    except Exception as e:
        print(f"❌ Erro ao testar endpoint: {e}")

def create_sample_data():
    """Cria dados de exemplo para teste."""
    print_section("CRIANDO DADOS DE EXEMPLO")
    
    with SessionLocal() as db:
        try:
            # Verificar se já há usuário
            user = db.query(User).first()
            if not user:
                print("👤 Criando usuário de teste...")
                from app.services.auth_service import auth_service
                from app.schemas.auth_schemas import UserCreate
                
                user_data = UserCreate(
                    email="test@example.com",
                    password="password123",
                    name="Test User",
                    security_question="Qual sua cor favorita?",
                    security_answer="azul"
                )
                user = auth_service.create_user(db, user_data)
                print(f"✅ Usuário criado: {user.email}")
            else:
                print(f"👤 Usando usuário existente: {user.email}")
            
            # Criar alguns favoritos de exemplo
            sample_pokemon = [
                (25, "pikachu"),
                (1, "bulbasaur"),
                (4, "charmander"),
                (7, "squirtle"),
                (150, "mewtwo")
            ]
            
            created_count = 0
            for pokemon_id, pokemon_name in sample_pokemon:
                # Verificar se já existe
                existing = db.query(FavoritePokemon).filter(
                    FavoritePokemon.user_id == user.id,
                    FavoritePokemon.pokemon_id == pokemon_id
                ).first()
                
                if not existing:
                    favorite = FavoritePokemon(
                        user_id=user.id,
                        pokemon_id=pokemon_id,
                        pokemon_name=pokemon_name
                    )
                    db.add(favorite)
                    created_count += 1
            
            db.commit()
            print(f"✅ Criados {created_count} favoritos de exemplo")
            
            # Testar ranking novamente
            ranking = FavoriteService.get_ranking(db, limit=5)
            print(f"🏆 Ranking após criar dados: {len(ranking)} itens")
            
        except Exception as e:
            print(f"❌ Erro ao criar dados de exemplo: {e}")

def main():
    """Função principal."""
    print("🔍 DIAGNÓSTICO DO SISTEMA DE RANKING")
    print("=" * 50)
    
    # 1. Verificar dados no banco
    check_database_data()
    
    # 2. Testar serviço de ranking
    test_ranking_service()
    
    # 3. Testar endpoint do backend
    test_backend_endpoint()
    
    # 4. Perguntar se deve criar dados de exemplo
    print_section("PRÓXIMOS PASSOS")
    
    with SessionLocal() as db:
        fav_count = db.query(FavoritePokemon).count()
        
        if fav_count == 0:
            print("❌ PROBLEMA IDENTIFICADO: Não há dados suficientes para gerar ranking")
            print("💡 SOLUÇÃO: Execute este script novamente com --create-data para criar dados de exemplo")
            print("   Comando: python diagnose_ranking_issue.py --create-data")
        else:
            print("✅ Há dados suficientes no banco")
            print("🔍 Se o ranking ainda não aparece, verifique:")
            print("   1. Se o backend está rodando (http://localhost:8000)")
            print("   2. Se o frontend está fazendo requisições para o endpoint correto")
            print("   3. Se há erros no console do navegador")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--create-data":
        create_sample_data()
    else:
        main()
