#!/usr/bin/env python3
"""
Script para investigar caracteres especiais nos flavors
"""
import json
import requests

def investigate_character_encoding():
    """Investiga problemas de codificação de caracteres"""

    pokemon_id = 2
    print(f"=== INVESTIGAÇÃO DE CARACTERES ESPECIAIS ===\n")

    # 1. Buscar da PokeAPI
    print("1. Buscando da PokeAPI...")
    url = f"https://pokeapi.co/api/v2/pokemon-species/{pokemon_id}"
    resp = requests.get(url, timeout=10)
    data = resp.json()

    flavors_from_api = [
        entry["flavor_text"].replace('\n', ' ').replace('\f', ' ')
        for entry in data["flavor_text_entries"]
        if entry["language"]["name"] == "en"
    ]
    flavors_from_api = list(dict.fromkeys(flavors_from_api))

    # 2. Carregar do arquivo
    with open("app/data/flavors_en.json", 'r', encoding='utf-8') as f:
        en_data = json.load(f)
    en_flavors = en_data.get(str(pokemon_id), [])

    # 3. Comparar byte a byte
    print("2. Comparando caracteres especiais...")

    for i, (api_flavor, file_flavor) in enumerate(zip(flavors_from_api, en_flavors)):
        if api_flavor != file_flavor:
            print(f"\n✗ DIFERENÇA no flavor {i}:")
            print(f"API:     '{api_flavor}'")
            print(f"Arquivo: '{file_flavor}'")

            # Comparar byte a byte
            print("Análise byte a byte:")
            api_bytes = api_flavor.encode('utf-8')
            file_bytes = file_flavor.encode('utf-8')

            print(f"API bytes:     {api_bytes}")
            print(f"Arquivo bytes: {file_bytes}")

            # Encontrar diferenças
            min_len = min(len(api_flavor), len(file_flavor))
            for j in range(min_len):
                if api_flavor[j] != file_flavor[j]:
                    print(f"Diferença na posição {j}:")
                    print(f"  API:     '{api_flavor[j]}' (ord: {ord(api_flavor[j])})")
                    print(f"  Arquivo: '{file_flavor[j]}' (ord: {ord(file_flavor[j])})")
                    break
        else:
            print(f"✓ Flavor {i}: Match perfeito")

if __name__ == "__main__":
    investigate_character_encoding()
