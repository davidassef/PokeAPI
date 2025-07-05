#!/bin/bash

echo "🚀 Iniciando Sistema Pull-Based de Sincronização"
echo "================================================="

# Verificar se estamos no diretório correto
if [ ! -d "backend" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# Função para verificar se um serviço está rodando
check_service() {
    local url=$1
    local name=$2
    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $name iniciado com sucesso"
            return 0
        fi
        echo "⏳ Aguardando $name iniciar (tentativa $attempt/$max_attempts)..."
        sleep 2
        ((attempt++))
    done

    echo "❌ Erro: $name não está respondendo após $max_attempts tentativas"
    return 1
}

# Iniciar Backend
echo "📡 Iniciando Backend FastAPI..."
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Verificar se backend está rodando
if ! check_service "http://localhost:8000/health" "Backend"; then
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Iniciar Cliente HTTP
echo "🖥️  Iniciando Cliente HTTP..."
cd frontend
node client-server.js > client.log 2>&1 &
CLIENT_PID=$!
cd ..

# Verificar se cliente está rodando
if ! check_service "http://localhost:3001/api/client/health" "Cliente"; then
    kill $BACKEND_PID $CLIENT_PID 2>/dev/null
    exit 1
fi

# Perguntar se deve iniciar Frontend Ionic
read -p "🌐 Iniciar Frontend Ionic? (s/n): " start_frontend
if [[ $start_frontend =~ ^[Ss]$ ]]; then
    echo "🌐 Iniciando Frontend Ionic..."
    cd frontend
    ionic serve --port 8100 > ionic.log 2>&1 &
    IONIC_PID=$!
    cd ..
    sleep 3
    echo "✅ Frontend iniciado na porta 8100"
fi

echo ""
echo "✅ Sistema iniciado com sucesso!"
echo "📡 Backend: http://localhost:8000"
echo "🖥️  Cliente: http://localhost:3001"
if [[ $start_frontend =~ ^[Ss]$ ]]; then
    echo "🌐 Frontend: http://localhost:8100"
fi
echo "📚 Docs: http://localhost:8000/docs"
echo ""
echo "🧪 Para testar: python test_pull_sync.py"
echo "🛑 Para parar: Ctrl+C"
echo ""

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🧹 Parando serviços..."
    kill $BACKEND_PID $CLIENT_PID 2>/dev/null
    if [[ $start_frontend =~ ^[Ss]$ ]]; then
        kill $IONIC_PID 2>/dev/null
    fi
    echo "✅ Serviços parados"
    exit 0
}

# Registrar função de cleanup
trap cleanup SIGINT SIGTERM

# Aguardar até que o usuário pare os serviços
wait
