#!/bin/bash

# Script para configurar ambiente de desenvolvimento vs produção

echo "🔧 Configurador de Ambiente - PokeAPIApp"
echo "========================================"
echo ""
echo "Escolha o ambiente:"
echo "1) 🏠 Desenvolvimento Local"
echo "2) 🌐 Produção (Render)"
echo "3) 📊 Status Atual"
echo ""
read -p "Digite sua opção (1-3): " choice

case $choice in
  1)
    echo "🏠 Configurando para DESENVOLVIMENTO LOCAL..."

    # Atualizar environment.ts para localhost
    cat > /d/Documentos/Python/PokeAPIApp/frontend/src/environments/environment.ts << 'EOF'
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000'  // Backend local para desenvolvimento
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
EOF

    echo "✅ Configurado para desenvolvimento!"
    echo ""
    echo "📋 Configuração ativa:"
    echo "   • Frontend: http://localhost:8100"
    echo "   • Backend: http://localhost:8000"
    echo "   • Client-Server: http://localhost:3001"
    echo ""
    echo "🚀 Para iniciar:"
    echo "   1. Terminal 1: cd backend && uvicorn main:app --reload"
    echo "   2. Terminal 2: cd frontend && npm start"
    ;;

  2)
    echo "🌐 Configurando para PRODUÇÃO (testes)..."

    # Atualizar environment.ts para Render
    cat > /d/Documentos/Python/PokeAPIApp/frontend/src/environments/environment.ts << 'EOF'
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  apiUrl: 'https://pokeapi-la6k.onrender.com',  // Backend em produção
  clientServerUrl: 'https://pokemonapp-client-server.onrender.com'  // Client-server em produção
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
EOF

    echo "✅ Configurado para produção!"
    echo ""
    echo "📋 Configuração ativa:"
    echo "   • Frontend: Deploy estático"
    echo "   • Backend: https://pokeapi-la6k.onrender.com"
    echo "   • Client-Server: https://pokemonapp-client-server.onrender.com"
    echo ""
    echo "🚀 Deploy automático após commit!"
    ;;

  3)
    echo "📊 STATUS ATUAL"
    echo ""

    # Verificar configuração atual
    if grep -q "localhost:8000" /d/Documentos/Python/PokeAPIApp/frontend/src/environments/environment.ts; then
      echo "🏠 Ambiente: DESENVOLVIMENTO LOCAL"
      echo "   • Backend: http://localhost:8000"
      echo "   • Precisa backend local rodando"
    elif grep -q "onrender.com" /d/Documentos/Python/PokeAPIApp/frontend/src/environments/environment.ts; then
      echo "🌐 Ambiente: PRODUÇÃO"
      echo "   • Backend: https://pokeapi-la6k.onrender.com"
      echo "   • Usa backend remoto"
    else
      echo "❓ Configuração não identificada"
    fi

    echo ""
    echo "🔍 Verificando portas:"
    netstat -an | grep ":8000" && echo "   ✅ Porta 8000 em uso (backend)" || echo "   ❌ Porta 8000 livre"
    netstat -an | grep ":8100" && echo "   ✅ Porta 8100 em uso (frontend)" || echo "   ❌ Porta 8100 livre"
    netstat -an | grep ":3001" && echo "   ✅ Porta 3001 em uso (client-server)" || echo "   ❌ Porta 3001 livre"
    ;;

  *)
    echo "❌ Opção inválida"
    exit 1
    ;;
esac

echo ""
echo "✅ Configuração concluída!"
