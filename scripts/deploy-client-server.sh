#!/bin/bash

# Deploy do Client-Server no Render
echo "🚀 Iniciando deploy do Client-Server no Render..."

# Navegar para o diretório do client-server
cd "$(dirname "$0")/../client-server"

# Verificar se estamos na pasta correta
if [ ! -f "client-server.js" ]; then
    echo "❌ Arquivo client-server.js não encontrado!"
    echo "   Certifique-se de que está na pasta correta"
    exit 1
fi

echo "📁 Pasta atual: $(pwd)"
echo "📂 Arquivos disponíveis:"
ls -la

echo ""
echo "🔧 Configurações preparadas:"
echo "   - package.json: ✅"
echo "   - render.yaml: ✅"
echo "   - client-server.js: ✅"
echo "   - client-sync-data.json: ✅"
echo "   - README.md: ✅"

echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "   1. Certifique-se de que o código está commitado no git"
echo "   2. Acesse https://render.com e faça login"
echo "   3. Clique em 'New +' → 'Web Service'"
echo "   4. Conecte seu repositório GitHub"
echo "   5. Configure o serviço:"
echo "      - Nome: pokemonapp-client-server"
echo "      - Root Directory: client-server"
echo "      - Build Command: npm install"
echo "      - Start Command: npm start"
echo "      - Environment Variables:"
echo "        * NODE_ENV = production"
echo "        * BACKEND_URL = https://pokeapi-la6k.onrender.com"
echo "   6. Clique em 'Create Web Service'"

echo ""
echo "🔄 Verificando se o código está commitado..."
if git status --porcelain 2>/dev/null | grep -q .; then
    echo "⚠️  Há mudanças não commitadas. Commitando agora..."
    git add .
    git commit -m "feat: deploy client-server to Render"
    git push origin main
    echo "✅ Código commitado e enviado para o repositório"
else
    echo "✅ Código já está commitado"
fi

echo ""
echo "🌐 URLs esperadas após o deploy:"
echo "   - Client-Server: https://pokemonapp-client-server.onrender.com"
echo "   - Backend: https://pokeapi-la6k.onrender.com"
echo "   - Frontend: https://pokemonapp-frontend.onrender.com"

echo ""
echo "🧪 Comandos para testar após o deploy:"
echo "   curl https://pokemonapp-client-server.onrender.com/api/client/health"
echo "   curl https://pokemonapp-client-server.onrender.com/api/client/sync-data"

echo ""
echo "✅ Script de deploy concluído!"
echo "   Agora continue com o deploy manual no Render."
