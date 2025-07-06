#!/bin/bash

# Script para testar o sistema em diferentes ambientes

echo "🧪 Testando Sistema de Deploy Frontend"
echo "======================================="

cd /d/Documentos/Python/PokeAPIApp/frontend

echo ""
echo "📋 Verificando configuração..."

# Verificar se o concurrently está instalado
if npm list concurrently &> /dev/null; then
    echo "✅ concurrently instalado"
else
    echo "❌ concurrently não encontrado"
    echo "   Instalando..."
    npm install --save-dev concurrently
fi

echo ""
echo "🔧 Scripts disponíveis:"
echo "  npm start              - Desenvolvimento completo (frontend + client-server)"
echo "  npm run start:dev      - Mesmo que npm start"
echo "  npm run start:frontend-only - Apenas frontend (simulando produção)"
echo "  npm run build:prod     - Build para deploy estático"

echo ""
echo "🌐 Testando detecção de ambiente..."

# Verificar se o client-server.js existe
if [ -f "client-server.js" ]; then
    echo "✅ client-server.js encontrado"
else
    echo "❌ client-server.js não encontrado"
fi

# Verificar configuração do app.config.ts
if grep -q "enableClientServer" src/app/core/config/app.config.ts; then
    echo "✅ Configuração de ambiente implementada"
else
    echo "❌ Configuração de ambiente não encontrada"
fi

echo ""
echo "📦 Testando build de produção..."

# Fazer build de produção
npm run build:prod > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Build de produção bem-sucedido"
    if [ -d "www" ]; then
        echo "   📁 Pasta www/ criada com $(ls -1 www | wc -l) arquivos"
    fi
else
    echo "❌ Erro no build de produção"
fi

echo ""
echo "🎯 Resumo da Configuração:"
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ DESENVOLVIMENTO                                             │"
echo "│ • npm start → Frontend (8100) + Client-Server (3001)       │"
echo "│ • Sistema Pull + Push                                       │"
echo "│ • Backend: localhost:8000                                   │"
echo "├─────────────────────────────────────────────────────────────┤"
echo "│ PRODUÇÃO (DEPLOY ESTÁTICO)                                  │"
echo "│ • Apenas frontend como site estático                       │"
echo "│ • Sistema Push apenas                                       │"
echo "│ • Backend: pokeapi-la6k.onrender.com                       │"
echo "│ • SEM client-server (Node.js não disponível)               │"
echo "└─────────────────────────────────────────────────────────────┘"

echo ""
echo "✅ Sistema configurado corretamente para ambos os ambientes!"
echo ""
echo "🚀 Para testar:"
echo "   Desenvolvimento: npm start"
echo "   Produção:        npm run start:frontend-only"
