#!/usr/bin/env python3
"""
Script de diagnóstico para o sistema de ranking.
Identifica problemas no fluxo de dados do frontend -> client-server -> backend -> ranking.
"""

import sys
import os
import json
import requests
import asyncio
from datetime import datetime

# Adicionar o diretório do backend ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.services.client_storage_service import ClientStorageService
from app.services.ranking_service import RankingService
from app.services.pull_sync_service import pull_service

def print_section(title):
    """Imprime uma seção do diagnóstico."""
    print(f"\n{'='*50}")
    print(f"🔍 {title}")
    print(f"{'='*50}")

def check_client_server():
    """Verifica se o client-server está funcionando."""
    print_section("VERIFICANDO CLIENT-SERVER")
    
    try:
        # Verificar se o client-server está rodando
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
    except requests.exceptions.ConnectionError:
        print("❌ Client-server não está rodando (ConnectionError)")
        return False
    except Exception as e:
        print(f"❌ Erro ao conectar com client-server: {e}")
        return False

def check_client_data():
    """Verifica dados do client-server."""
    print_section("VERIFICANDO DADOS DO CLIENT")
    
    try:
        # Verificar dados de sync
        response = requests.get("http://localhost:3001/api/client/sync-data", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Dados de sync obtidos")
            print(f"   - User ID: {data.get('user_id')}")
            print(f"   - Total captures: {data.get('total_pending', 0)}")
            print(f"   - Last sync: {data.get('last_sync')}")
            
            captures = data.get('captures', [])
            print(f"   - Captures pendentes: {len(captures)}")
            
            if captures:
                print("   - Primeiras 3 capturas:")
                for i, capture in enumerate(captures[:3]):
                    print(f"     {i+1}. {capture.get('pokemon_name')} (ID: {capture.get('pokemon_id')})")
            
            return True
        else:
            print(f"❌ Erro ao obter dados de sync: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro ao verificar dados do client: {e}")
        return False

def check_storage_service():
    """Verifica o storage service."""
    print_section("VERIFICANDO STORAGE SERVICE")
    
    try:
        storage_service = ClientStorageService()
        stats = storage_service.get_storage_stats()
        
        print("✅ Storage service funcionando")
        print(f"   - Total clients: {stats['total_clients']}")
        print(f"   - Total unique pokémons: {stats['total_unique_pokemons']}")
        print(f"   - Total captures: {stats['total_captures']}")
        print(f"   - Last updated: {stats['last_updated']}")
        
        # Verificar dados de ranking
        ranking_data = storage_service.get_ranking_data(limit=5)
        print(f"   - Ranking data: {len(ranking_data)} entradas")
        
        if ranking_data:
            print("   - Top 5 pokémons:")
            for i, (pokemon_id, count) in enumerate(ranking_data[:5]):
                print(f"     {i+1}. Pokemon {pokemon_id}: {count} capturas")
        else:
            print("   - ⚠️ Nenhum dado de ranking encontrado")
        
        return True
    except Exception as e:
        print(f"❌ Erro no storage service: {e}")
        return False

def check_ranking_service():
    """Verifica o ranking service."""
    print_section("VERIFICANDO RANKING SERVICE")
    
    try:
        storage_service = ClientStorageService()
        ranking_service = RankingService(storage_service)
        
        with SessionLocal() as db:
            # Verificar ranking atual
            ranking = ranking_service.get_ranking(db, limit=5)
            print(f"✅ Ranking service funcionando")
            print(f"   - Entradas no banco: {len(ranking)}")
            
            if ranking:
                print("   - Top 5 do ranking:")
                for i, entry in enumerate(ranking[:5]):
                    print(f"     {i+1}. {entry.pokemon_name} (ID: {entry.pokemon_id}): {entry.favorite_count} capturas")
            else:
                print("   - ⚠️ Nenhum ranking no banco")
            
            # Verificar comparação com storage
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

async def check_pull_sync():
    """Verifica o pull sync service."""
    print_section("VERIFICANDO PULL SYNC")
    
    try:
        # Verificar clientes registrados
        clients = pull_service.registered_clients
        print(f"✅ Pull sync service funcionando")
        print(f"   - Clientes registrados: {len(clients)}")
        
        for user_id, registration in clients.items():
            print(f"     - {user_id}: {registration.client_url}")
        
        # Verificar dados do storage via pull sync
        storage_ranking = await pull_service.get_storage_ranking(limit=5)
        print(f"   - Storage ranking via pull sync: {len(storage_ranking)} entradas")
        
        if storage_ranking:
            print("   - Top 5 do storage:")
            for entry in storage_ranking[:5]:
                print(f"     {entry['position']}. {entry['pokemon_name']} (ID: {entry['pokemon_id']}): {entry['capture_count']} capturas")
        
        return True
    except Exception as e:
        print(f"❌ Erro no pull sync service: {e}")
        return False

async def test_sync_process():
    """Testa o processo de sincronização."""
    print_section("TESTANDO PROCESSO DE SINCRONIZAÇÃO")
    
    try:
        with SessionLocal() as db:
            # Testar sincronização com storage
            result = await pull_service.sync_with_storage_system(db)
            
            print("✅ Sincronização testada")
            print(f"   - Success: {result.get('success')}")
            print(f"   - Clients processed: {result.get('clients_processed', 0)}")
            print(f"   - Total captures: {result.get('total_captures', 0)}")
            print(f"   - Ranking stats: {result.get('ranking_stats', {})}")
            
            if result.get('ranking_stats'):
                stats = result['ranking_stats']
                print(f"     - Inserted count: {stats.get('inserted_count', 0)}")
                print(f"     - Top pokemon: {stats.get('top_pokemon_id')} ({stats.get('top_pokemon_count', 0)} capturas)")
            
            return result.get('success', False)
    except Exception as e:
        print(f"❌ Erro no teste de sincronização: {e}")
        return False

def check_backend_endpoints():
    """Verifica endpoints do backend."""
    print_section("VERIFICANDO ENDPOINTS DO BACKEND")
    
    try:
        # Verificar endpoint de ranking
        response = requests.get("http://localhost:8000/api/v1/ranking/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Endpoint de ranking funcionando")
            print(f"   - Entradas retornadas: {len(data)}")
            
            if data:
                print("   - Top 3 do ranking:")
                for i, entry in enumerate(data[:3]):
                    print(f"     {i+1}. {entry.get('pokemon_name')} (ID: {entry.get('pokemon_id')}): {entry.get('favorite_count')} capturas")
            else:
                print("   - ⚠️ Nenhum ranking retornado")
        else:
            print(f"❌ Endpoint de ranking retornou status {response.status_code}")
        
        # Verificar endpoint de storage ranking
        response = requests.get("http://localhost:8000/api/v1/pull-sync/storage-ranking", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Endpoint de storage ranking funcionando")
            print(f"   - Entradas retornadas: {data.get('total_entries', 0)}")
        else:
            print(f"❌ Endpoint de storage ranking retornou status {response.status_code}")
        
        return True
    except Exception as e:
        print(f"❌ Erro ao verificar endpoints: {e}")
        return False

async def main():
    """Executa diagnóstico completo."""
    print("🚀 DIAGNÓSTICO DO SISTEMA DE RANKING")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Verificações
    client_server_ok = check_client_server()
    client_data_ok = check_client_data() if client_server_ok else False
    storage_ok = check_storage_service()
    ranking_ok = check_ranking_service()
    pull_sync_ok = await check_pull_sync()
    endpoints_ok = check_backend_endpoints()
    
    # Teste de sincronização
    sync_ok = await test_sync_process()
    
    # Resumo
    print_section("RESUMO DO DIAGNÓSTICO")
    
    checks = [
        ("Client Server", client_server_ok),
        ("Client Data", client_data_ok),
        ("Storage Service", storage_ok),
        ("Ranking Service", ranking_ok),
        ("Pull Sync", pull_sync_ok),
        ("Backend Endpoints", endpoints_ok),
        ("Sync Process", sync_ok)
    ]
    
    all_ok = True
    for name, status in checks:
        status_icon = "✅" if status else "❌"
        print(f"{status_icon} {name}: {'OK' if status else 'FALHOU'}")
        if not status:
            all_ok = False
    
    print(f"\n{'🎉 SISTEMA FUNCIONANDO' if all_ok else '⚠️ PROBLEMAS IDENTIFICADOS'}")
    
    if not all_ok:
        print("\n🔧 RECOMENDAÇÕES:")
        if not client_server_ok:
            print("- Iniciar o client-server: cd client-server && npm start")
        if not storage_ok:
            print("- Verificar permissões do arquivo client_storage.json")
        if not ranking_ok:
            print("- Verificar conexão com banco de dados")
        if not sync_ok:
            print("- Verificar se há dados de captura no client-server")

if __name__ == "__main__":
    asyncio.run(main()) 