import requests
import json
import time
import os

POKEAPI_SPECIES_URL = "https://pokeapi.co/api/v2/pokemon-species/{}"
TOTAL_POKEMON = 1025  # Atualize conforme necessário
OUTPUT_FILE = "backend/app/data/flavors_en.json"

# Criar diretório se não existir
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

all_flavors = {}

for pokemon_id in range(1, TOTAL_POKEMON + 1):
    try:
        resp = requests.get(POKEAPI_SPECIES_URL.format(pokemon_id), timeout=10)
        if resp.status_code != 200:
            print(f"[WARN] Pokémon {pokemon_id} não encontrado.")
            continue
        data = resp.json()
        flavors = [
            entry["flavor_text"].replace('\n', ' ').replace('\f', ' ')
            for entry in data["flavor_text_entries"] if entry["language"]["name"] == "en"
        ]
        # Remove duplicados mantendo a ordem
        flavors = list(dict.fromkeys(flavors))
        if flavors:
            all_flavors[str(pokemon_id)] = flavors
        print(f"[OK] Pokémon {pokemon_id} - {len(flavors)} flavors exportados.")
        time.sleep(0.2)  # Respeitar rate limit da API
    except Exception as e:
        print(f"[ERRO] Pokémon {pokemon_id}: {e}")

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(all_flavors, f, ensure_ascii=False, indent=2)

print(f"Exportação concluída! Arquivo salvo em {OUTPUT_FILE}") 