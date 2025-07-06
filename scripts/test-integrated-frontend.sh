#!/bin/bash

# Script para testar o novo sistema integrado do frontend

echo "🚀 Testando Sistema Integrado Frontend + Client-Server"
echo "=================================================="

echo "📋 Comandos disponíveis no package.json:"
echo "  npm start             → Executa frontend + client-server simultaneamente"
echo "  npm run start:frontend → Executa apenas o frontend (Angular/Ionic)"
echo "  npm run start:client-server → Executa apenas o client-server"
echo "  npm run start:dev      → Executa apenas o frontend (comando legado)"

echo ""
echo "🔧 Configuração atual:"
echo "  Frontend: http://localhost:8100"
echo "  Client-Server: http://localhost:3001"
echo "  Backend: http://localhost:8000"

echo ""
echo "🧪 Para testar o sistema completo:"
echo "  1. cd frontend"
echo "  2. npm start"
echo "  3. Aguarde ambos os serviços iniciarem"
echo "  4. Acesse http://localhost:8100"
echo "  5. Capture alguns Pokémon"
echo "  6. Verifique o ranking"

echo ""
echo "✅ Sistema pronto para uso integrado!"
