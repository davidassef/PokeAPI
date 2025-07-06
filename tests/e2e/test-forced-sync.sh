#!/bin/bash

# Script para testar sincronização forçada via endpoints do backend

echo "🧪 Testando Sincronização Forçada - Sistema Pull-Based"

# Verificar se os serviços estão rodando
echo "🔍 Verificando serviços..."

if ! curl -s http://localhost:3001/api/client/health > /dev/null; then
    echo "❌ Cliente HTTP não está rodando em http://localhost:3001"
    echo "💡 Execute: node frontend/client-server.js"
    exit 1
fi

if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "❌ Backend não está rodando em http://localhost:8000"
    echo "💡 Execute: cd backend && uvicorn main:app --reload"
    exit 1
fi

echo "✅ Serviços ativos"

# Verificar status inicial
echo ""
echo "📊 Status inicial do sistema:"
echo "─────────────────────────────"

echo "🔄 Status Pull Sync:"
curl -s -X GET http://localhost:8000/api/v1/pull-sync/status | jq '.' 2>/dev/null || echo "Erro ao obter status"

echo ""
echo "⏰ Status Scheduler:"
curl -s -X GET http://localhost:8000/api/v1/pull-sync/scheduler/status | jq '.' 2>/dev/null || echo "Erro ao obter status scheduler"

echo ""
echo "👥 Clientes registrados:"
curl -s -X GET http://localhost:8000/api/v1/pull-sync/registered-clients | jq '.' 2>/dev/null || echo "Erro ao obter clientes"

# Verificar dados no cliente
echo ""
echo "📱 Dados no cliente HTTP:"
curl -s -X GET http://localhost:3001/api/client/stats | jq '.' 2>/dev/null || echo "Erro ao obter stats do cliente"

# Adicionar uma captura de teste
echo ""
echo "📝 Adicionando captura de teste (Charizard)..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/client/add-capture \
    -H "Content-Type: application/json" \
    -d '{"pokemon_id": 6, "pokemon_name": "charizard", "action": "capture", "removed": false}')

echo "Resposta: $RESPONSE"

if echo "$RESPONSE" | grep -q "success"; then
    echo "✅ Captura adicionada com sucesso"
else
    echo "⚠️  Possível duplicação ou erro"
fi

# Aguardar um momento
echo ""
echo "⏳ Aguardando 2 segundos..."
sleep 2

# Testar sincronização forçada - Todos os clientes
echo ""
echo "🚀 Teste 1: Forçando sincronização de TODOS os clientes..."
echo "──────────────────────────────────────────────────────────"

SYNC_ALL_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/pull-sync/sync-all \
    -H "Content-Type: application/json" \
    -d '{}')

echo "Resultado da sincronização completa:"
echo "$SYNC_ALL_RESPONSE" | jq '.' 2>/dev/null || echo "$SYNC_ALL_RESPONSE"

# Aguardar processamento
sleep 3

# Testar sincronização forçada - Apenas recentes
echo ""
echo "⚡ Teste 2: Forçando sincronização de mudanças RECENTES..."
echo "─────────────────────────────────────────────────────────"

SYNC_RECENT_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/pull-sync/sync-recent \
    -H "Content-Type: application/json")

echo "Resultado da sincronização recente:"
echo "$SYNC_RECENT_RESPONSE" | jq '.' 2>/dev/null || echo "$SYNC_RECENT_RESPONSE"

# Aguardar processamento
sleep 2

# Testar sincronização em background
echo ""
echo "🔄 Teste 3: Iniciando sincronização em BACKGROUND..."
echo "──────────────────────────────────────────────────"

SYNC_BG_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/pull-sync/sync-all-background \
    -H "Content-Type: application/json")

echo "Resultado da sincronização em background:"
echo "$SYNC_BG_RESPONSE" | jq '.' 2>/dev/null || echo "$SYNC_BG_RESPONSE"

# Aguardar processamento da sincronização em background
echo "⏳ Aguardando sincronização em background (5 segundos)..."
sleep 5

# Verificar resultado no ranking
echo ""
echo "📊 Verificando ranking após sincronização forçada..."
echo "──────────────────────────────────────────────────"

RANKING_RESPONSE=$(curl -s -X GET http://localhost:8000/api/v1/ranking)
echo "Ranking atualizado:"
echo "$RANKING_RESPONSE" | jq '.' 2>/dev/null || echo "$RANKING_RESPONSE"

# Verificar se Charizard está no ranking
if echo "$RANKING_RESPONSE" | grep -q "charizard"; then
    CHARIZARD_COUNT=$(echo "$RANKING_RESPONSE" | jq -r '.[] | select(.pokemon_name == "charizard") | .favorite_count' 2>/dev/null)
    echo "✅ Charizard encontrado no ranking com $CHARIZARD_COUNT captura(s)"
else
    echo "❌ Charizard não encontrado no ranking"
fi

# Status final do cliente
echo ""
echo "📊 Status final do cliente HTTP:"
curl -s -X GET http://localhost:3001/api/client/stats | jq '.' 2>/dev/null || echo "Erro ao obter stats finais"

# Controle do scheduler
echo ""
echo "⚙️  Testes de controle do scheduler..."
echo "───────────────────────────────────"

echo "🔧 Configurando intervalo rápido (10 segundos)..."
INTERVAL_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/pull-sync/scheduler/set-interval \
    -H "Content-Type: application/json" \
    -d '{"interval": 10}')
echo "$INTERVAL_RESPONSE"

echo ""
echo "📊 Status final do scheduler:"
curl -s -X GET http://localhost:8000/api/v1/pull-sync/scheduler/status | jq '.' 2>/dev/null || echo "Erro ao obter status final"

# Resumo
echo ""
echo "🎯 RESUMO DOS TESTES DE SINCRONIZAÇÃO FORÇADA"
echo "═══════════════════════════════════════════════"
echo ""
echo "✅ Testes executados:"
echo "  1. Sincronização completa (sync-all)"
echo "  2. Sincronização recente (sync-recent)"
echo "  3. Sincronização em background (sync-all-background)"
echo "  4. Controle do scheduler (set-interval)"
echo ""
echo "📈 Benefícios da sincronização forçada:"
echo "  - Não precisa aguardar o intervalo do scheduler"
echo "  - Útil para testes e desenvolvimento"
echo "  - Permite sincronização sob demanda"
echo "  - Controle granular do processo"
echo ""
echo "🔧 Comandos disponíveis para sincronização manual:"
echo "  - POST /api/v1/pull-sync/sync-all"
echo "  - POST /api/v1/pull-sync/sync-recent"
echo "  - POST /api/v1/pull-sync/sync-all-background"
echo "  - POST /api/v1/pull-sync/scheduler/set-interval"
echo ""
echo "💡 Para usar no frontend, utilize o PullSyncControlService"
echo ""
echo "🎉 Testes de sincronização forçada concluídos!"
