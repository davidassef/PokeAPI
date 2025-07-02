"""
Script para traduzir automaticamente os flavors dos Pokémon do inglês para o português brasileiro.

- Lê o arquivo flavors_en.json.
- Traduz cada frase usando a biblioteca googletrans (Google Translate).
- Salva o resultado em flavors_ptbr.json, mantendo os já traduzidos.

Como usar:
1. Instale a biblioteca: pip install googletrans==4.0.0-rc1
2. Execute: python translate_flavors_ptbr.py

Obs: Traduções automáticas podem conter erros. Revise o resultado final!
"""
import json
from googletrans import Translator
import time

# Caminhos dos arquivos
EN_PATH = 'backend/app/data/flavors_en.json'
PTBR_PATH = 'backend/app/data/flavors_ptbr.json'

# Carregar os flavors em inglês
with open(EN_PATH, 'r', encoding='utf-8') as f:
    flavors_en = json.load(f)

# Carregar os já traduzidos (se houver)
try:
    with open(PTBR_PATH, 'r', encoding='utf-8') as f:
        flavors_ptbr = json.load(f)
except FileNotFoundError:
    flavors_ptbr = {}

translator = Translator()

for poke_id, flavor_list in flavors_en.items():
    if poke_id in flavors_ptbr:
        continue  # Pular já traduzidos
    translated = []
    for flavor in flavor_list:
        try:
            result = translator.translate(flavor, src='en', dest='pt')
            translated.append(result.text)
            time.sleep(0.5)  # Evitar bloqueio por excesso de requisições
        except Exception as e:
            print(f"Erro ao traduzir '{flavor}': {e}")
            translated.append(flavor)  # Em caso de erro, mantém o original
    flavors_ptbr[poke_id] = translated
    print(f"Traduzido Pokémon {poke_id}")

# Salvar o resultado
with open(PTBR_PATH, 'w', encoding='utf-8') as f:
    json.dump(flavors_ptbr, f, ensure_ascii=False, indent=2)

print("Tradução concluída! Revise o arquivo flavors_ptbr.json.") 