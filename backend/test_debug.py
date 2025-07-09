#!/usr/bin/env python3
"""
Script de debug para verificar o processamento da sincronização.
"""
import requests
import json
from datetime import datetime

def debug_sync():
    """Debug da sincronização."""
    
    print("🔍 DEBUG: Verificando dados do client-server...")
    
    # 1. Verificar dados do client-server
    try:
        response = requests.get("http://localhost:3001/api/client/sync-data")
        if response.status_code == 200:
            data = response.json()
            captures = data.get('captures', [])
            print(f"📱 Client-server retornou {len(captures)} capturas:")
            
            for i, capture in enumerate(captures):
                print(f"   {i+1}. ID {capture['pokemon_id']} ({capture['pokemon_name']}) - Removido: {capture.get('metadata', {}).get('removed', False)}")
            
            # Processar como o backend faria
            print("\n🔄 Processando como o backend...")
            sorted_captures = sorted(captures, key=lambda c: c.get('timestamp', ''))
            
            pokemon_states = {}
            for capture in sorted_captures:
                pokemon_id = capture['pokemon_id']
                metadata = capture.get('metadata', {})
                is_removed = metadata.get('removed', False)
                
                if capture.get('action') in ('capture', 'favorite'):
                    if is_removed:
                        pokemon_states[pokemon_id] = False
                    else:
                        pokemon_states[pokemon_id] = True
            
            active_pokemons = [pid for pid, active in pokemon_states.items() if active]
            print(f"✅ Pokémons ativos após processamento: {active_pokemons}")
            
        else:
            print(f"❌ Erro ao acessar client-server: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro ao verificar client-server: {e}")
    
    # 2. Verificar ranking atual
    print("\n🏆 Ranking atual:")
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
    debug_sync() 