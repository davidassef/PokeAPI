#!/bin/bash

# Script para testar se não há duplicação no sistema pull-based
# Este script verifica se as capturas são processadas corretamente sem duplicação

echo "🧪 Testando sistema Pull-Based - Prevenção de Duplicação"

# Verificar se os serviços estão rodando
echo "🔍 Verificando serviços..."

if ! curl -s http://localhost:3001/api/client/health > /dev/null; then
    echo "❌ Cliente HTTP não está rodando em http://localhost:3001"
    exit 1
fi

if ! curl -s http://localhost:8000/api/v1/pull-sync/status > /dev/null; then
    echo "❌ Backend não está rodando em http://localhost:8000"
    exit 1
fi

echo "✅ Serviços ativos"

# Limpar dados de teste
echo "🧹 Limpando dados de teste..."
curl -s -X DELETE http://localhost:8000/api/v1/admin/clear-test-data > /dev/null

# Teste 1: Adicionar uma captura
echo "📝 Teste 1: Adicionando captura do Pikachu..."
RESPONSE1=$(curl -s -X POST http://localhost:3001/api/client/add-capture \
    -H "Content-Type: application/json" \
    -d '{"pokemon_id": 25, "pokemon_name": "pikachu", "action": "capture", "removed": false}')

echo "Resposta: $RESPONSE1"

# Teste 2: Tentar adicionar a mesma captura (deve detectar duplicação)
echo "📝 Teste 2: Tentando adicionar mesma captura (deve detectar duplicação)..."
RESPONSE2=$(curl -s -X POST http://localhost:3001/api/client/add-capture \
    -H "Content-Type: application/json" \
    -d '{"pokemon_id": 25, "pokemon_name": "pikachu", "action": "capture", "removed": false}')

echo "Resposta: $RESPONSE2"

# Verificar se a duplicação foi detectada
if echo "$RESPONSE2" | grep -q "duplicated.*true"; then
    echo "✅ Duplicação detectada corretamente"
else
    echo "❌ Duplicação não foi detectada"
fi

# Aguardar um pouco para sincronização
echo "⏳ Aguardando sincronização..."
sleep 5

# Teste 3: Forçar sincronização
echo "📝 Teste 3: Forçando sincronização..."
SYNC_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/pull-sync/sync-all \
    -H "Content-Type: application/json" -d '{}')

echo "Resposta sync: $SYNC_RESPONSE"

# Aguardar processamento
sleep 3

# Teste 4: Verificar ranking (deve ter apenas 1 captura do Pikachu)
echo "📝 Teste 4: Verificando ranking..."
RANKING_RESPONSE=$(curl -s -X GET http://localhost:8000/api/v1/ranking)

echo "Ranking: $RANKING_RESPONSE"

# Verificar se há apenas uma captura do Pikachu
PIKACHU_COUNT=$(echo "$RANKING_RESPONSE" | grep -o '"favorite_count":[0-9]*' | grep -o '[0-9]*' | head -1)

if [ "$PIKACHU_COUNT" = "1" ]; then
    echo "✅ Sem duplicação no ranking - Pikachu tem $PIKACHU_COUNT captura"
else
    echo "❌ Possível duplicação no ranking - Pikachu tem $PIKACHU_COUNT capturas"
fi

# Teste 5: Verificar stats do cliente
echo "📝 Teste 5: Verificando stats do cliente..."
CLIENT_STATS=$(curl -s -X GET http://localhost:3001/api/client/stats)

echo "Stats do cliente: $CLIENT_STATS"

# Resumo
echo ""
echo "📊 Resumo dos testes:"
echo "  - Serviços: ✅ Ativos"
echo "  - Duplicação detectada: $(echo "$RESPONSE2" | grep -q "duplicated.*true" && echo "✅ Sim" || echo "❌ Não")"
echo "  - Ranking correto: $([ "$PIKACHU_COUNT" = "1" ] && echo "✅ Sim" || echo "❌ Não")"
echo ""
echo "🎯 Sistema pull-based testado!"
