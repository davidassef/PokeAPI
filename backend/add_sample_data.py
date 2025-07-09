#!/usr/bin/env python3
"""
Script para adicionar dados de exemplo ao client-server.
"""

import requests
import json
import time

def add_sample_captures():
    """Adiciona capturas de exemplo ao client-server."""
    
    # Dados de exemplo com diferentes contagens para testar ranking
    sample_captures = [
        # Pikachu - mais capturado
        {"pokemon_id": 25, "pokemon_name": "pikachu", "action": "capture", "removed": False},
        {"pokemon_id": 25, "pokemon_name": "pikachu", "action": "capture", "removed": False},
        {"pokemon_id": 25, "pokemon_name": "pikachu", "action": "capture", "removed": False},
        {"pokemon_id": 25, "pokemon_name": "pikachu", "action": "capture", "removed": False},
        {"pokemon_id": 25, "pokemon_name": "pikachu", "action": "capture", "removed": False},
        
        # Charizard - segundo mais capturado
        {"pokemon_id": 6, "pokemon_name": "charizard", "action": "capture", "removed": False},
        {"pokemon_id": 6, "pokemon_name": "charizard", "action": "capture", "removed": False},
        {"pokemon_id": 6, "pokemon_name": "charizard", "action": "capture", "removed": False},
        {"pokemon_id": 6, "pokemon_name": "charizard", "action": "capture", "removed": False},
        
        # Mewtwo - terceiro mais capturado
        {"pokemon_id": 150, "pokemon_name": "mewtwo", "action": "capture", "removed": False},
        {"pokemon_id": 150, "pokemon_name": "mewtwo", "action": "capture", "removed": False},
        {"pokemon_id": 150, "pokemon_name": "mewtwo", "action": "capture", "removed": False},
        
        # Bulbasaur
        {"pokemon_id": 1, "pokemon_name": "bulbasaur", "action": "capture", "removed": False},
        {"pokemon_id": 1, "pokemon_name": "bulbasaur", "action": "capture", "removed": False},
        
        # Charmander
        {"pokemon_id": 4, "pokemon_name": "charmander", "action": "capture", "removed": False},
        {"pokemon_id": 4, "pokemon_name": "charmander", "action": "capture", "removed": False},
        
        # Squirtle
        {"pokemon_id": 7, "pokemon_name": "squirtle", "action": "capture", "removed": False},
        {"pokemon_id": 7, "pokemon_name": "squirtle", "action": "capture", "removed": False},
        
        # Gengar
        {"pokemon_id": 94, "pokemon_name": "gengar", "action": "capture", "removed": False},
        
        # Gyarados
        {"pokemon_id": 130, "pokemon_name": "gyarados", "action": "capture", "removed": False},
        
        # Articuno
        {"pokemon_id": 144, "pokemon_name": "articuno", "action": "capture", "removed": False},
        
        # Dragonite
        {"pokemon_id": 149, "pokemon_name": "dragonite", "action": "capture", "removed": False}
    ]
    
    print(f"📝 Adicionando {len(sample_captures)} capturas de exemplo...")
    
    success_count = 0
    for i, capture in enumerate(sample_captures):
        try:
            response = requests.post(
                "http://localhost:3001/api/client/add-capture",
                json=capture,
                timeout=5
            )
            
            if response.status_code == 200:
                print(f"✅ {i+1:2d}. Adicionado: {capture['pokemon_name']}")
                success_count += 1
            else:
                print(f"❌ {i+1:2d}. Erro ao adicionar {capture['pokemon_name']}: {response.status_code}")
                
            # Pequena pausa entre requisições
            time.sleep(0.1)
            
        except Exception as e:
            print(f"❌ {i+1:2d}. Erro ao adicionar {capture['pokemon_name']}: {e}")
    
    print(f"\n✅ {success_count}/{len(sample_captures)} capturas adicionadas com sucesso")
    return success_count

def check_client_server():
    """Verifica se o client-server está rodando."""
    try:
        response = requests.get("http://localhost:3001/api/client/health", timeout=5)
        if response.status_code == 200:
            print("✅ Client-server está rodando")
            return True
        else:
            print(f"❌ Client-server retornou status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Client-server não está rodando: {e}")
        return False

def show_captures():
    """Mostra as capturas atuais."""
    try:
        response = requests.get("http://localhost:3001/api/client/sync-data", timeout=5)
        if response.status_code == 200:
            data = response.json()
            captures = data.get('captures', [])
            print(f"\n📊 Capturas atuais: {len(captures)}")
            
            if captures:
                # Contar por pokémon
                pokemon_counts = {}
                for capture in captures:
                    pokemon_id = capture.get('pokemon_id')
                    pokemon_name = capture.get('pokemon_name')
                    if pokemon_id:
                        pokemon_counts[pokemon_id] = pokemon_counts.get(pokemon_id, 0) + 1
                
                print("🏆 Ranking das capturas:")
                sorted_pokemons = sorted(pokemon_counts.items(), key=lambda x: (-x[1], x[0]))
                for i, (pokemon_id, count) in enumerate(sorted_pokemons[:10]):
                    print(f"   {i+1:2d}. Pokemon {pokemon_id}: {count} capturas")
        else:
            print(f"❌ Erro ao obter capturas: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro ao verificar capturas: {e}")

def main():
    """Executa o script principal."""
    print("🚀 ADICIONANDO DADOS DE EXEMPLO AO CLIENT-SERVER")
    print("=" * 50)
    
    # Verificar se o client-server está rodando
    if not check_client_server():
        print("\n❌ Client-server não está rodando!")
        print("Execute: cd client-server && npm start")
        return
    
    # Mostrar capturas atuais
    show_captures()
    
    # Adicionar dados de exemplo
    print("\n" + "=" * 50)
    success_count = add_sample_captures()
    
    if success_count > 0:
        print("\n" + "=" * 50)
        print("📊 VERIFICANDO RESULTADO")
        print("=" * 50)
        
        # Aguardar um pouco
        time.sleep(2)
        
        # Mostrar capturas após adição
        show_captures()
        
        print(f"\n✅ Dados de exemplo adicionados com sucesso!")
        print("Agora você pode testar o sistema de ranking.")
    else:
        print("\n❌ Falha ao adicionar dados de exemplo")

if __name__ == "__main__":
    main() 