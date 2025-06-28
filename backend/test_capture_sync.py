#!/usr/bin/env python3
"""
Script de teste para verificar sincronização de capturas
"""
import requests
import json
import time

def test_capture_sync():
    """Testa a sincronização de capturas"""
    base_url = "http://localhost:8000"
    
    # Dados de teste
    test_captures = [
        {
            "pokemonId": 25,
            "action": "capture",
            "timestamp": int(time.time() * 1000),
            "payload": {
                "pokemonName": "pikachu",
                "removed": False
            }
        },
        {
            "pokemonId": 6,
            "action": "capture", 
            "timestamp": int(time.time() * 1000),
            "payload": {
                "pokemonName": "charizard",
                "removed": False
            }
        },
        {
            "pokemonId": 1,
            "action": "capture",
            "timestamp": int(time.time() * 1000),
            "payload": {
                "pokemonName": "bulbasaur",
                "removed": False
            }
        }
    ]
    
    print("=== TESTE DE SINCRONIZAÇÃO DE CAPTURAS ===")
    
    # Testa cada captura
    for i, capture in enumerate(test_captures, 1):
        print(f"\n--- Teste {i}: Capturando Pokémon {capture['pokemonId']} ({capture['payload']['pokemonName']}) ---")
        
        try:
            response = requests.post(
                f"{base_url}/api/v1/sync-capture/",
                json=capture,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"Status: {response.status_code}")
            print(f"Resposta: {response.text}")
            
            if response.status_code == 200:
                print("✅ Captura sincronizada com sucesso!")
            else:
                print("❌ Erro na sincronização")
                
        except Exception as e:
            print(f"❌ Erro na requisição: {e}")
    
    # Aguarda um pouco e verifica o ranking
    print("\n--- Aguardando 3 segundos para processamento ---")
    time.sleep(3)
    
    # Testa o ranking com diferentes valores de min_captures
    print("\n=== VERIFICANDO RANKING ===")
    
    for min_captures in [1, 5, 10, 20]:
        print(f"\n--- Ranking com min_captures={min_captures} ---")
        try:
            response = requests.get(
                f"{base_url}/api/v1/ranking/",
                params={"min_captures": min_captures, "limit": 10}
            )
            
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                ranking = response.json()
                print(f"Pokémons no ranking: {len(ranking)}")
                for item in ranking:
                    print(f"  - {item['pokemon_name']} (ID: {item['pokemon_id']}): {item['favorite_count']} capturas")
            else:
                print(f"Erro: {response.text}")
                
        except Exception as e:
            print(f"❌ Erro ao buscar ranking: {e}")

if __name__ == "__main__":
    test_capture_sync() 