#!/bin/bash

# Script para testar o Client-Server após deploy no Render
echo "🧪 Testando Client-Server em produção..."

# URLs dos serviços
CLIENT_SERVER_URL="https://pokeapiapp-client-server.onrender.com"
BACKEND_URL="https://pokeapi-la6k.onrender.com"
FRONTEND_URL="https://pokemonapp-frontend.onrender.com"

echo ""
echo "🌐 URLs dos serviços:"
echo "   Client-Server: $CLIENT_SERVER_URL"
echo "   Backend: $BACKEND_URL"
echo "   Frontend: $FRONTEND_URL"

echo ""
echo "1️⃣ Testando Health Check do Client-Server..."
response=$(curl -s -w "HTTP_CODE:%{http_code}" "$CLIENT_SERVER_URL/api/client/health")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [ "$http_code" = "200" ]; then
    echo "✅ Health Check OK ($http_code)"
    echo "$body" | python -m json.tool 2>/dev/null || echo "$body"
else
    echo "❌ Health Check FALHOU ($http_code)"
    echo "$body"
fi

echo ""
echo "2️⃣ Testando Sync Data do Client-Server..."
response=$(curl -s -w "HTTP_CODE:%{http_code}" "$CLIENT_SERVER_URL/api/client/sync-data")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [ "$http_code" = "200" ]; then
    echo "✅ Sync Data OK ($http_code)"
    echo "$body" | python -m json.tool 2>/dev/null || echo "$body"
else
    echo "❌ Sync Data FALHOU ($http_code)"
    echo "$body"
fi

echo ""
echo "3️⃣ Testando Backend (verificar se está rodando)..."
response=$(curl -s -w "HTTP_CODE:%{http_code}" "$BACKEND_URL/api/admin/clients")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [ "$http_code" = "200" ]; then
    echo "✅ Backend OK ($http_code)"
    echo "$body" | python -m json.tool 2>/dev/null || echo "$body"
else
    echo "❌ Backend com problema ($http_code)"
    echo "$body"
fi

echo ""
echo "4️⃣ Testando Frontend (verificar se está rodando)..."
response=$(curl -s -w "HTTP_CODE:%{http_code}" "$FRONTEND_URL" | head -c 200)
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)

if [ "$http_code" = "200" ]; then
    echo "✅ Frontend OK ($http_code)"
    echo "   Página carregada com sucesso"
else
    echo "❌ Frontend com problema ($http_code)"
fi

echo ""
echo "5️⃣ Testando integração Client-Server → Backend..."
echo "   Enviando dados de teste do client-server para o backend..."

# Primeiro, enviar dados para o client-server
test_data='{"capturedPokemon": [{"id": 1, "name": "bulbasaur", "timestamp": "2024-07-06T21:30:00.000Z"}], "userScore": 100}'
curl -s -X POST "$CLIENT_SERVER_URL/api/client/sync-data" \
     -H "Content-Type: application/json" \
     -d "$test_data" > /dev/null

# Depois, verificar se o backend consegue fazer pull
echo "   Verificando se o backend consegue fazer pull..."
response=$(curl -s -w "HTTP_CODE:%{http_code}" "$BACKEND_URL/api/admin/sync/pull")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [ "$http_code" = "200" ]; then
    echo "✅ Integração Client-Server → Backend OK ($http_code)"
    echo "$body" | python -m json.tool 2>/dev/null || echo "$body"
else
    echo "❌ Integração com problema ($http_code)"
    echo "$body"
fi

echo ""
echo "📊 RESUMO DOS TESTES:"
echo "================================"
echo "✅ = Funcionando | ❌ = Com problema"
echo ""
echo "Endpoints testados:"
echo "   Health Check: $CLIENT_SERVER_URL/api/client/health"
echo "   Sync Data: $CLIENT_SERVER_URL/api/client/sync-data"
echo "   Backend Clients: $BACKEND_URL/api/admin/clients"
echo "   Frontend: $FRONTEND_URL"
echo "   Integração: $BACKEND_URL/api/admin/sync/pull"

echo ""
echo "🔄 Para re-executar este teste:"
echo "   ./scripts/test-client-server-deploy.sh"

echo ""
echo "🚀 Se todos os testes passaram, o deploy está funcionando!"
echo "   Você pode agora usar o sistema completo em produção."
