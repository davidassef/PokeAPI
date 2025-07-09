#!/usr/bin/env python3
"""
Script para testar o sistema de ranking completo.
"""

import requests
import time
import asyncio
import sys
import os

# Adicionar o diretório do backend ao path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../backend'))

from app.core.database import SessionLocal
from app.services.client_storage_service import ClientStorageService
from app.services.ranking_service import RankingService
from app.services.pull_sync_service import pull_service

def print_section(title):
    """Imprime uma seção do teste."""
    print(f"\n{'='*50}")
    print(f"🧪 {title}")
    print(f"{'='*50}")

def test_client_server():
    """Testa o client-server."""
    print_section("TESTANDO CLIENT-SERVER")
    
    try:
        # Verificar health
        response = requests.get("http://localhost:3001/api/client/health", timeout=5)
        if response.status_code == 200:
            print("✅ Client-server está rodando")
            data = response.json()
            print(f"   - Client ID: {data.get('client_id')}")
            print(f"   - URL: {data.get('client_url')}")
            return True
        else:
            print(f"❌ Client-server retornou status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Client-server não está rodando: {e}")
        return False

def test_backend():
    """Testa o backend."""
    print_section("TESTANDO BACKEND")
    
    try:
        # Verificar health
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend está rodando")
            return True
        else:
            print(f"❌ Backend retornou status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend não está rodando: {e}")
        return False

def test_ranking_endpoints():
    """Testa os endpoints de ranking."""
    print_section("TESTANDO ENDPOINTS DE RANKING")
    
    try:
        # Testar endpoint de ranking principal
        response = requests.get("http://localhost:8000/api/v1/ranking/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Ranking endpoint: {len(data)} entradas")
            
            if data:
                print("🏆 Top 5 do ranking:")
                for i, entry in enumerate(data[:5]):
                    print(f"   {i+1}. {entry.get('pokemon_name')} (ID: {entry.get('pokemon_id')}): {entry.get('favorite_count')} capturas")
            else:
                print("⚠️ Nenhum ranking encontrado")
        else:
            print(f"❌ Ranking endpoint retornou status {response.status_code}")
        
        # Testar endpoint de storage ranking
        response = requests.get("http://localhost:8000/api/v1/pull-sync/storage-ranking", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Storage ranking endpoint: {data.get('total_entries', 0)} entradas")
            
            if data.get('ranking'):
                print("🏆 Top 5 do storage ranking:")
                for entry in data['ranking'][:5]:
                    print(f"   {entry['position']}. {entry['pokemon_name']} (ID: {entry['pokemon_id']}): {entry['capture_count']} capturas")
        else:
            print(f"❌ Storage ranking endpoint retornou status {response.status_code}")
        
        return True
    except Exception as e:
        print(f"❌ Erro ao testar endpoints: {e}")
        return False

async def test_sync_process():
    """Testa o processo de sincronização."""
    print_section("TESTANDO SINCRONIZAÇÃO")
    
    try:
        with SessionLocal() as db:
            # Testar sincronização com storage
            result = await pull_service.sync_with_storage_system(db)
            
            print("✅ Sincronização executada")
            print(f"   - Success: {result.get('success')}")
            print(f"   - Clients processed: {result.get('clients_processed', 0)}")
            print(f"   - Total captures: {result.get('total_captures', 0)}")
            
            if result.get('ranking_stats'):
                stats = result['ranking_stats']
                print(f"   - Ranking entries: {stats.get('inserted_count', 0)}")
                print(f"   - Top pokemon: {stats.get('top_pokemon_id')} ({stats.get('top_pokemon_count', 0)} capturas)")
            
            return result.get('success', False)
    except Exception as e:
        print(f"❌ Erro na sincronização: {e}")
        return False

def test_storage_service():
    """Testa o storage service."""
    print_section("TESTANDO STORAGE SERVICE")
    
    try:
        storage_service = ClientStorageService()
        stats = storage_service.get_storage_stats()
        
        print("✅ Storage service funcionando")
        print(f"   - Total clients: {stats['total_clients']}")
        print(f"   - Total unique pokémons: {stats['total_unique_pokemons']}")
        print(f"   - Total captures: {stats['total_captures']}")
        
        # Verificar dados de ranking
        ranking_data = storage_service.get_ranking_data(limit=5)
        print(f"   - Ranking data: {len(ranking_data)} entradas")
        
        if ranking_data:
            print("🏆 Top 5 do storage:")
            for i, (pokemon_id, count) in enumerate(ranking_data[:5]):
                print(f"   {i+1}. Pokemon {pokemon_id}: {count} capturas")
        else:
            print("⚠️ Nenhum dado de ranking no storage")
        
        return True
    except Exception as e:
        print(f"❌ Erro no storage service: {e}")
        return False

def test_ranking_service():
    """Testa o ranking service."""
    print_section("TESTANDO RANKING SERVICE")
    
    try:
        storage_service = ClientStorageService()
        ranking_service = RankingService(storage_service)
        
        with SessionLocal() as db:
            # Verificar ranking atual
            ranking = ranking_service.get_ranking(db, limit=5)
            print(f"✅ Ranking service funcionando")
            print(f"   - Entradas no banco: {len(ranking)}")
            
            if ranking:
                print("🏆 Top 5 do ranking no banco:")
                for i, entry in enumerate(ranking[:5]):
                    print(f"   {i+1}. {entry.pokemon_name} (ID: {entry.pokemon_id}): {entry.favorite_count} capturas")
            else:
                print("⚠️ Nenhum ranking no banco")
            
            # Verificar consistência
            comparison = ranking_service.get_ranking_with_storage_comparison(db, limit=5)
            print(f"   - Consistência: {'✅' if comparison['is_consistent'] else '❌'}")
            
            if not comparison['is_consistent']:
                print("   - Diferenças encontradas:")
                for diff in comparison['differences']:
                    print(f"     Posição {diff['position']}: Storage={diff['storage']}, DB={diff['database']}")
        
        return True
    except Exception as e:
        print(f"❌ Erro no ranking service: {e}")
        return False

async def main():
    """Executa todos os testes."""
    print("🧪 TESTE COMPLETO DO SISTEMA DE RANKING")
    print(f"📅 {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Testes
    client_ok = test_client_server()
    backend_ok = test_backend()
    endpoints_ok = test_ranking_endpoints()
    storage_ok = test_storage_service()
    ranking_ok = test_ranking_service()
    sync_ok = await test_sync_process()
    
    # Resumo
    print_section("RESUMO DOS TESTES")
    
    tests = [
        ("Client Server", client_ok),
        ("Backend", backend_ok),
        ("Endpoints", endpoints_ok),
        ("Storage Service", storage_ok),
        ("Ranking Service", ranking_ok),
        ("Sync Process", sync_ok)
    ]
    
    all_ok = True
    for name, status in tests:
        status_icon = "✅" if status else "❌"
        print(f"{status_icon} {name}: {'OK' if status else 'FALHOU'}")
        if not status:
            all_ok = False
    
    print(f"\n{'🎉 SISTEMA FUNCIONANDO PERFEITAMENTE' if all_ok else '⚠️ PROBLEMAS IDENTIFICADOS'}")
    
    if not all_ok:
        print("\n🔧 RECOMENDAÇÕES:")
        if not client_ok:
            print("- Iniciar client-server: cd client-server && npm start")
        if not backend_ok:
            print("- Iniciar backend: python main.py")
        if not storage_ok or not ranking_ok:
            print("- Verificar dados no storage e banco de dados")
        if not sync_ok:
            print("- Verificar se há dados de captura para sincronizar")

if __name__ == "__main__":
    asyncio.run(main()) 