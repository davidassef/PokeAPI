#!/bin/bash

# Script para iniciar apenas o sistema pull-based
# Este script evita conflitos iniciando apenas os componentes necessários

echo "🚀 Iniciando sistema Pull-Based de Sincronização"

# Verificar se as portas estão livres
if lsof -i :3001 > /dev/null 2>&1; then
    echo "⚠️  Porta 3001 já está em uso. Encerrando processos..."
    pkill -f client-server.js
    sleep 2
fi

if lsof -i :8000 > /dev/null 2>&1; then
    echo "⚠️  Porta 8000 já está em uso. Encerrando processos..."
    pkill -f "uvicorn.*main:app"
    sleep 2
fi

echo "📡 Iniciando cliente HTTP (porta 3001)..."
cd frontend
node client-server.js &
CLIENT_PID=$!

sleep 3

echo "🔧 Iniciando backend FastAPI (porta 8000)..."
cd ../backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

sleep 5

echo "🎯 Iniciando frontend Ionic (porta 8100)..."
cd ../frontend
ionic serve --port 8100 &
FRONTEND_PID=$!

echo "✅ Sistema Pull-Based iniciado com sucesso!"
echo "📊 Componentes ativos:"
echo "  - Cliente HTTP: http://localhost:3001"
echo "  - Backend API: http://localhost:8000"
echo "  - Frontend App: http://localhost:8100"
echo ""
echo "🔍 Para verificar o status:"
echo "  curl -X GET http://localhost:3001/api/client/health"
echo "  curl -X GET http://localhost:8000/api/v1/pull-sync/status"
echo ""
echo "💡 Para parar todos os processos:"
echo "  kill $CLIENT_PID $BACKEND_PID $FRONTEND_PID"

# Aguardar sinal para encerrar
wait
