#!/usr/bin/env python3
"""
Script para testar o sistema de tradução de flavors
"""
import os
import json
import sys

# Adicionar o diretório do projeto ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_translation_system():
    """Testa o sistema de tradução"""
    
    # Teste 1: Verificar se os arquivos existem
    ptbr_path = "app/data/flavors_ptbr.json"
    en_path = "app/data/flavors_en.json"
    
    print(f"Verificando arquivo PT-BR: {ptbr_path}")
    print(f"Caminho absoluto: {os.path.abspath(ptbr_path)}")
    if os.path.exists(ptbr_path):
        try:
            with open(ptbr_path, 'r', encoding='utf-8') as f:
                ptbr_data = json.load(f)
            print(f"✓ Arquivo PT-BR carregado com {len(ptbr_data)} Pokémon")
        except Exception as e:
            print(f"✗ Erro ao carregar arquivo PT-BR: {e}")
            return
    else:
        print("✗ Arquivo PT-BR não encontrado")
        return
    
    print(f"Verificando arquivo EN: {en_path}")
    if os.path.exists(en_path):
        with open(en_path, 'r', encoding='utf-8') as f:
            en_data = json.load(f)
        print(f"✓ Arquivo EN carregado com {len(en_data)} Pokémon")
    else:
        print("✗ Arquivo EN não encontrado")
        return
    
    # Teste 2: Verificar traduções para Pokémon 1 (Bulbasaur)
    pokemon_id = 1
    print(f"\nTestando traduções para Pokémon {pokemon_id} (Bulbasaur):")
    
    ptbr_flavors = ptbr_data.get(str(pokemon_id), [])
    print(f"Traduções PT-BR encontradas: {len(ptbr_flavors)}")
    
    if len(ptbr_flavors) > 0:
        print("Primeira tradução PT-BR:")
        print(f"  {ptbr_flavors[0]}")
    
    # Teste 3: Verificar correspondência com flavors em inglês
    en_flavors = en_data.get(str(pokemon_id), [])
    print(f"\nFlavors em inglês: {len(en_flavors)}")
    
    if len(en_flavors) > 0:
        print("Primeiro flavor em inglês:")
        print(f"  {en_flavors[0]}")
    
    # Teste 4: Simular a lógica de tradução
    print(f"\nSimulando lógica de tradução:")
    
    if len(en_flavors) > 0 and len(ptbr_flavors) > 0:
        flavor_en = en_flavors[0]
        if flavor_en in en_flavors:
            idx = en_flavors.index(flavor_en)
            if idx < len(ptbr_flavors):
                result = ptbr_flavors[idx]
                print(f"Resultado da tradução:")
                print(f"  Original: {flavor_en}")
                print(f"  Traduzido: {result}")
                
                if result != flavor_en:
                    print("✓ Tradução funcionando!")
                else:
                    print("✗ Tradução não funcionou - retornou texto original")
            else:
                print(f"✗ Índice {idx} fora do range das traduções ({len(ptbr_flavors)})")
        else:
            print("✗ Flavor em inglês não encontrado na lista")
    else:
        print("✗ Não há dados suficientes para testar")

if __name__ == "__main__":
    test_translation_system() 