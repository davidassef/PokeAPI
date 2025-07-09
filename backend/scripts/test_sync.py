#!/usr/bin/env python3
"""
Script para testar a sincronização e verificar os resultados.
"""
import requests
import json

def test_sync():
    """Testa a sincronização e verifica os resultados."""
    
    # 1. Verificar dados do client-server
    print("🔍 Verificando dados do client-server...")
    try:
        response = requests.get("http://localhost:3001/api/client/sync-data")
        if response.status_code == 200:
            data = response.json()
            captures = data.get('captures', [])
            print(f"📱 Client-server tem {len(captures)} capturas pendentes")
            
            # Contar pokémons únicos ativos
            pokemon_states = {}
            for capture in captures:
                pokemon_id = capture['pokemon_id']
                metadata = capture.get('metadata', {})
                is_removed = metadata.get('removed', False)
                
                if capture.get('action') in ('capture', 'favorite'):
                    if is_removed:
                        pokemon_states[pokemon_id] = False
                    else:
                        pokemon_states[pokemon_id] = True
            
            active_pokemons = [pid for pid, active in pokemon_states.items() if active]
            print(f"✅ Pokémons ativos: {active_pokemons}")
        else:
            print(f"❌ Erro ao acessar client-server: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro ao verificar client-server: {e}")
    
    # 2. Forçar sincronização
    print("\n🔄 Forçando sincronização...")
    try:
        response = requests.post("http://localhost:8000/api/v1/pull-sync/sync-with-storage")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sincronização concluída:")
            print(f"   - Clientes processados: {data.get('clients_processed', 0)}")
            print(f"   - Total capturas: {data.get('total_captures', 0)}")
            print(f"   - Ranking entries: {data.get('ranking_stats', {}).get('inserted_count', 0)}")
        else:
            print(f"❌ Erro na sincronização: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro ao sincronizar: {e}")
    
    # 3. Verificar ranking
    print("\n🏆 Verificando ranking...")
    try:
        response = requests.get("http://localhost:8000/api/v1/ranking/")
        if response.status_code == 200:
            ranking = response.json()
            print(f"📊 Ranking tem {len(ranking)} pokémons:")
            for pokemon in ranking:
                print(f"   - ID {pokemon['pokemon_id']}: {pokemon['pokemon_name']}")
        else:
            print(f"❌ Erro ao verificar ranking: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro ao verificar ranking: {e}")

if __name__ == "__main__":
    test_sync() 