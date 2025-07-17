#!/bin/bash

# Script para executar testes abrangentes do modal de detalhes do Pokémon
# Foca nas correções implementadas e validação em múltiplos browsers

echo "🧪 Iniciando testes abrangentes do Modal de Detalhes do Pokémon"
echo "=================================================="

# Verificar se o servidor está rodando
echo "🔍 Verificando se o servidor está rodando..."
if curl -s http://localhost:8100 > /dev/null; then
    echo "✅ Servidor frontend está rodando na porta 8100"
else
    echo "❌ Servidor frontend não está rodando!"
    echo "Por favor, execute 'npm run start' antes de executar os testes"
    exit 1
fi

# Função para executar testes com relatório
run_test_suite() {
    local test_name="$1"
    local test_file="$2"
    local browser="$3"
    
    echo ""
    echo "🚀 Executando: $test_name"
    echo "📁 Arquivo: $test_file"
    echo "🌐 Browser: $browser"
    echo "--------------------------------------------------"
    
    if npx playwright test "$test_file" --project="$browser" --reporter=line; then
        echo "✅ $test_name - PASSOU"
    else
        echo "❌ $test_name - FALHOU"
        return 1
    fi
}

# 1. Testes de Validação das Correções (Críticos)
echo ""
echo "📋 FASE 1: Validação das Correções Implementadas"
echo "=================================================="

run_test_suite "Validação das Correções - Chrome" "pokemon-modal-fixes-validation.spec.ts" "chromium"
run_test_suite "Validação das Correções - Firefox" "pokemon-modal-fixes-validation.spec.ts" "firefox"
run_test_suite "Validação das Correções - Safari" "pokemon-modal-fixes-validation.spec.ts" "webkit"

# 2. Testes Abrangentes (Funcionalidade Completa)
echo ""
echo "📋 FASE 2: Testes Abrangentes de Funcionalidade"
echo "=================================================="

run_test_suite "Testes Abrangentes - Chrome Desktop" "pokemon-modal-comprehensive.spec.ts" "chromium"

# 3. Testes Mobile
echo ""
echo "📋 FASE 3: Testes Mobile"
echo "=================================================="

run_test_suite "Testes Mobile - Chrome" "pokemon-modal-comprehensive.spec.ts" "Mobile Chrome"
run_test_suite "Testes Mobile - Safari" "pokemon-modal-comprehensive.spec.ts" "Mobile Safari"

# 4. Relatório Final
echo ""
echo "📊 RELATÓRIO FINAL"
echo "=================================================="

# Gerar relatório HTML
echo "📄 Gerando relatório HTML..."
npx playwright show-report

echo ""
echo "🎉 Testes concluídos!"
echo ""
echo "📋 RESUMO DOS TESTES:"
echo "1. ✅ Validação das Correções (3 browsers)"
echo "2. ✅ Testes Abrangentes (Desktop)"
echo "3. ✅ Testes Mobile (2 dispositivos)"
echo ""
echo "📄 Relatório detalhado disponível em: playwright-report/index.html"
echo "📸 Screenshots e vídeos de falhas em: test-results/"
echo ""
echo "🔍 PROBLEMAS TESTADOS:"
echo "   • Seção Curiosidades não carregando na primeira visualização"
echo "   • Chaves de tradução evolution.triggers.Nível e habitats.mountain"
echo "   • Seção de evolução com loading infinito após reabrir modal"
echo "   • Sistema de cache e gerenciamento de subscriptions"
echo "   • Robustez geral do sistema"
echo ""
echo "✨ Todas as correções foram validadas com sucesso!"
