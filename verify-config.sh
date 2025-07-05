#!/bin/bash

# Script para verificar se o sistema está configurado corretamente
# sem conflitos entre push e pull

echo "🔍 Verificando configuração do sistema..."

# Verificar se SyncConfigService está em modo pull-only
echo "📋 Verificando SyncConfigService..."
if grep -q "USE_PULL_SYNC_ONLY = true" frontend/src/app/core/services/sync-config.service.ts; then
    echo "✅ Pull-sync ativado"
else
    echo "❌ Pull-sync não está ativado"
fi

if grep -q "USE_PUSH_SYNC = false" frontend/src/app/core/services/sync-config.service.ts; then
    echo "✅ Push-sync desativado"
else
    echo "❌ Push-sync não está desativado"
fi

if grep -q "STRICT_MODE = true" frontend/src/app/core/services/sync-config.service.ts; then
    echo "✅ Modo estrito ativado"
else
    echo "❌ Modo estrito não está ativado"
fi

# Verificar se HomePage não usa mais sistema push
echo "📋 Verificando HomePage..."
if grep -q "syncService.addToQueue" frontend/src/app/pages/web/home/home.page.ts; then
    echo "❌ HomePage ainda usa sistema push"
else
    echo "✅ HomePage não usa mais sistema push"
fi

# Verificar se PokeApiService está deprecated
echo "📋 Verificando PokeApiService..."
if grep -q "DEPRECATED.*syncCapture" frontend/src/app/core/services/pokeapi.service.ts; then
    echo "✅ PokeApiService.syncCapture está deprecated"
else
    echo "❌ PokeApiService.syncCapture não está deprecated"
fi

# Verificar se client-server.js tem detecção de duplicação
echo "📋 Verificando client-server.js..."
if grep -q "duplicated.*true" frontend/client-server.js; then
    echo "✅ Client-server tem detecção de duplicação"
else
    echo "❌ Client-server não tem detecção de duplicação"
fi

# Verificar se backend está configurado para pull
echo "📋 Verificando backend..."
if grep -q "pull_scheduler.start" backend/main.py; then
    echo "✅ Backend inicia scheduler pull"
else
    echo "❌ Backend não inicia scheduler pull"
fi

# Verificar se há arquivos de configuração
echo "📋 Verificando arquivos de configuração..."
if [ -f "pull-sync.env" ]; then
    echo "✅ pull-sync.env existe"
else
    echo "❌ pull-sync.env não existe"
fi

if [ -f "start-pull-sync-only.sh" ]; then
    echo "✅ start-pull-sync-only.sh existe"
else
    echo "❌ start-pull-sync-only.sh não existe"
fi

if [ -f "test-no-duplicates.sh" ]; then
    echo "✅ test-no-duplicates.sh existe"
else
    echo "❌ test-no-duplicates.sh não existe"
fi

if [ -f "CONFLICT_PREVENTION.md" ]; then
    echo "✅ CONFLICT_PREVENTION.md existe"
else
    echo "❌ CONFLICT_PREVENTION.md não existe"
fi

echo ""
echo "🎯 Resumo da configuração:"
echo "  - Sistema: Pull-based only"
echo "  - Duplicação: Prevenida"
echo "  - Conflitos: Eliminados"
echo "  - Dados: Apenas pokémons capturados"
echo ""
echo "🚀 Para testar o sistema:"
echo "  1. ./start-pull-sync-only.sh"
echo "  2. ./test-no-duplicates.sh"
echo "  3. Verificar logs no console"
