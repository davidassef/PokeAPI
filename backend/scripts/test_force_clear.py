#!/usr/bin/env python3
"""
Script para testar limpeza forçada do storage.
"""
import requests
import json

def test_force_clear():
    """Testa limpeza forçada do storage."""
    
    print("🧹 Testando limpeza forçada do storage...")
    
    try:
        # 1. Verificar ranking antes
        print("\n📊 Ranking antes da limpeza:")
        response = requests.get("http://localhost:8000/api/v1/ranking/")
        if response.status_code == 200:
            ranking = response.json()
            print(f"   - {len(ranking)} pokémons no ranking")
            for pokemon in ranking:
                print(f"     ID {pokemon['pokemon_id']}: {pokemon['pokemon_name']}")
        
        # 2. Forçar limpeza do storage
        print("\n🔄 Forçando limpeza do storage...")
        response = requests.post("http://localhost:8000/api/v1/pull-sync/force-clear-storage")
        if response.status_code == 200:
            data = response.json()
            print("✅ Limpeza concluída!")
            print(f"   - {data.get('sync_result', {}).get('total_captures', 0)} capturas processadas")
            print(f"   - {data.get('sync_result', {}).get('ranking_stats', {}).get('inserted_count', 0)} pokémons no ranking")
        else:
            print(f"❌ Erro na limpeza: {response.status_code}")
            print(response.text)
        
        # 3. Verificar ranking depois
        print("\n📊 Ranking depois da limpeza:")
        response = requests.get("http://localhost:8000/api/v1/ranking/")
        if response.status_code == 200:
            ranking = response.json()
            print(f"   - {len(ranking)} pokémons no ranking")
            for pokemon in ranking:
                print(f"     ID {pokemon['pokemon_id']}: {pokemon['pokemon_name']}")
        
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    test_force_clear() 