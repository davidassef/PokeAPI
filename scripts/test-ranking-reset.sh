#!/bin/bash

# Script para testar o sistema de ranking zerado

echo "🔄 Testando sistema de ranking zerado..."

# Mudar para o diretório do backend
cd /d/Documentos/Python/PokeAPIApp/backend

echo "📊 Verificando estado atual do banco de dados..."

python -c "
from app.core.database import SessionLocal
from app.models.models import PokemonRanking
import os
import json

db = SessionLocal()

try:
    # Verificar tabela de ranking
    ranking_count = db.query(PokemonRanking).count()
    print(f'🏆 Registros na tabela pokemon_rankings: {ranking_count}')

    # Verificar arquivo de storage
    if os.path.exists('client_storage.json'):
        with open('client_storage.json', 'r') as f:
            data = json.load(f)
            print(f'📁 Clientes no storage: {len(data.get(\"clients\", {}))}')
            print(f'📊 Pokémon counts: {len(data.get(\"pokemon_counts\", {}))}')
    else:
        print('📁 Arquivo client_storage.json não encontrado')

    if ranking_count == 0:
        print('✅ Sistema zerado com sucesso!')
    else:
        print('❌ Sistema ainda contém dados antigos')

except Exception as e:
    print(f'❌ Erro: {e}')
finally:
    db.close()
"

echo "🎯 Sistema está pronto para ser alimentado exclusivamente pelo frontend!"
echo "📋 Para testar:"
echo "   1. Inicie o frontend: cd frontend && ionic serve"
echo "   2. Capture alguns Pokémon"
echo "   3. Acesse a página de ranking"
echo "   4. Verifique se os Pokémon aparecem no ranking"
