#!/usr/bin/env python3
"""
Teste independente do endpoint de flavors corrigido
"""
import os
import json
import requests

def test_fixed_translation_logic():
    """Testa a lógica corrigida de tradução de forma independente"""

    # Carregar dados dos arquivos (simulando a correção)
    ptbr_path = "app/data/flavors_ptbr.json"
    en_path = "app/data/flavors_en.json"

    with open(ptbr_path, 'r', encoding='utf-8') as f:
        FLAVORS_PTBR = json.load(f)
    with open(en_path, 'r', encoding='utf-8') as f:
        FLAVORS_EN = json.load(f)

    def get_or_translate_flavor_fixed(pokemon_id: int, flavor_en: str, lang: str) -> str:
        """Lógica corrigida de tradução"""
        # Se for pt-BR, tenta buscar tradução manual
        if lang == 'pt-BR':
            try:
                ptbr_flavors = FLAVORS_PTBR.get(str(pokemon_id), [])
                en_flavors = FLAVORS_EN.get(str(pokemon_id), [])

                if ptbr_flavors and en_flavors and flavor_en in en_flavors:
                    idx = en_flavors.index(flavor_en)
                    if idx < len(ptbr_flavors):
                        return ptbr_flavors[idx]
            except Exception as e:
                print(f"Erro na tradução: {e}")

        # Se não houver tradução manual, retorna o texto original
        return flavor_en

    # Simular endpoint corrigido
    def get_pokemon_flavor_translated_fixed(pokemon_id: int, lang: str = "pt-BR"):
        """Simula o endpoint corrigido"""
        url = f"https://pokeapi.co/api/v2/pokemon-species/{pokemon_id}"
        resp = requests.get(url, timeout=10)
        if not resp.ok:
            return {"error": "Pokémon não encontrado"}

        data = resp.json()

        # Define idioma base para busca
        if lang == "es-ES":
            lang_api = "es"
        else:
            lang_api = "en"

        # Busca todos os flavors no idioma base
        flavors = [
            entry["flavor_text"].replace('\n', ' ').replace('\f', ' ')
            for entry in data["flavor_text_entries"] if entry["language"]["name"] == lang_api
        ]
        # Remove duplicados mantendo a ordem
        flavors = list(dict.fromkeys(flavors))

        # Se for PT-BR, traduzir todos os flavors do inglês para português
        if lang == "pt-BR":
            flavors_translated = [
                get_or_translate_flavor_fixed(int(data["id"]), flavor, lang)
                for flavor in flavors
            ]
            return {"flavors": flavors_translated, "lang": lang}
        else:
            # Para EN ou ES, retorna nativo
            return {"flavors": flavors, "lang": lang}

    # Testar com os Pokémon problemáticos
    print("=== TESTE DA CORREÇÃO ===\n")

    for pokemon_id in [1, 2, 3, 4]:
        print(f"\n--- Pokémon ID: {pokemon_id} ---")
        result = get_pokemon_flavor_translated_fixed(pokemon_id, "pt-BR")

        if "error" in result:
            print(f"❌ Erro: {result['error']}")
            continue

        flavors = result["flavors"]
        lang = result["lang"]

        print(f"Idioma: {lang}")
        print(f"Total de flavors: {len(flavors)}")

        # Verificar se foram traduzidos
        em_portugues = 0
        em_ingles = 0

        for i, flavor in enumerate(flavors[:3]):  # Testa apenas os 3 primeiros
            # Heurística simples: se contém certas palavras portuguesas, provavelmente está traduzido
            palavras_pt = ['é', 'que', 'um', 'uma', 'do', 'da', 'para', 'com', 'sua', 'suas', 'seu', 'seus', 'em', 'na', 'no']
            tem_pt = any(palavra in flavor.lower() for palavra in palavras_pt)

            if tem_pt:
                em_portugues += 1
                print(f"  ✅ Flavor {i}: EM PORTUGUÊS - {flavor[:60]}...")
            else:
                em_ingles += 1
                print(f"  ❌ Flavor {i}: EM INGLÊS - {flavor[:60]}...")

        if em_portugues > em_ingles:
            print(f"✅ RESULTADO: MAIORIA EM PORTUGUÊS ({em_portugues}/{em_portugues + em_ingles})")
        else:
            print(f"❌ RESULTADO: MAIORIA EM INGLÊS ({em_ingles}/{em_portugues + em_ingles})")

if __name__ == "__main__":
    test_fixed_translation_logic()
