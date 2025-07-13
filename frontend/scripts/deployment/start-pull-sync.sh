#!/bin/bash

# Script para iniciar o sistema pull-based de sincronização
# Inicia tanto o servidor do cliente quanto o frontend Ionic

echo "🚀 Iniciando sistema pull-based de sincronização..."

# Instalar dependências do servidor do cliente se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências do servidor do cliente..."
    cp client-server-package.json package-server.json
    npm install --prefix . express cors node-fetch
fi

# Iniciar servidor do cliente em background
echo "🖥️  Iniciando servidor do cliente na porta 3001..."
node client-server.js &
CLIENT_SERVER_PID=$!

# Aguardar um pouco para o servidor iniciar
sleep 2

# Iniciar frontend Ionic
echo "🌐 Iniciando frontend Ionic..."
ionic serve --port 8100 &
IONIC_PID=$!

# Função para limpar processos ao sair
cleanup() {
    echo "🧹 Limpando processos..."
    kill $CLIENT_SERVER_PID 2>/dev/null
    kill $IONIC_PID 2>/dev/null
    exit 0
}

# Registrar função de cleanup
trap cleanup SIGINT SIGTERM

echo "✅ Sistema iniciado!"
echo "📡 Servidor do cliente: http://localhost:3001"
echo "🌐 Frontend Ionic: http://localhost:8100"
echo "🔄 Sistema pull-based ativo"
echo ""
echo "Pressione Ctrl+C para parar todos os serviços"

# Aguardar até que o usuário pare os serviços
wait
