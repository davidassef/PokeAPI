#!/bin/bash
# 🚀 Quick Start - PokeAPIApp

echo "🎯 PokeAPIApp Quick Start"
echo "========================"

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Função para mostrar opções
show_menu() {
    echo ""
    echo "Escolha uma opção:"
    echo "1) 🏗️ Configurar workspace completo"
    echo "2) 🔧 Iniciar apenas backend"
    echo "3) 🎨 Iniciar apenas frontend"
    echo "4) 🚀 Iniciar ambos (backend + frontend)"
    echo "5) 🧪 Executar testes"
    echo "6) 🧹 Limpar dados de desenvolvimento"
    echo "7) 📊 Verificar status do projeto"
    echo "8) ❌ Sair"
    echo ""
    read -p "Digite sua opção (1-8): " choice
}

# Função para configurar workspace
setup_workspace() {
    print_info "Configurando workspace..."
    if [ -f "scripts/setup-workspace.sh" ]; then
        chmod +x scripts/setup-workspace.sh
        ./scripts/setup-workspace.sh
    else
        print_warning "Script de configuração não encontrado"
    fi
}

# Função para iniciar backend
start_backend() {
    print_info "Iniciando backend..."
    if [ -f "scripts/deployment/start-backend.sh" ]; then
        chmod +x scripts/deployment/start-backend.sh
        ./scripts/deployment/start-backend.sh
    else
        print_warning "Script de backend não encontrado. Iniciando manualmente..."
        cd backend
        if [ -f ".venv/bin/activate" ]; then
            source .venv/bin/activate
            python main.py
        else
            print_warning "Ambiente virtual não encontrado. Execute a configuração do workspace primeiro."
        fi
    fi
}

# Função para iniciar frontend
start_frontend() {
    print_info "Iniciando frontend..."
    if [ -f "scripts/deployment/start-frontend.sh" ]; then
        chmod +x scripts/deployment/start-frontend.sh
        ./scripts/deployment/start-frontend.sh
    else
        print_warning "Script de frontend não encontrado. Iniciando manualmente..."
        cd frontend
        if command -v ionic &> /dev/null; then
            ionic serve
        else
            print_warning "Ionic CLI não encontrado. Instalando..."
            npm install -g @ionic/cli
            ionic serve
        fi
    fi
}

# Função para iniciar ambos
start_both() {
    print_info "Iniciando backend e frontend..."

    # Iniciar backend em background
    print_info "Iniciando backend em background..."
    (cd backend && source .venv/bin/activate && python main.py) &
    BACKEND_PID=$!

    # Aguardar um pouco para o backend inicializar
    sleep 5

    # Iniciar frontend
    print_info "Iniciando frontend..."
    cd frontend
    ionic serve

    # Limpar processo do backend quando sair
    kill $BACKEND_PID 2>/dev/null
}

# Função para executar testes
run_tests() {
    print_info "Executando testes..."

    # Testes do backend
    print_info "Testes do backend..."
    cd backend
    if [ -f ".venv/bin/activate" ]; then
        source .venv/bin/activate
        if [ -f "pytest.ini" ]; then
            pytest tests/ -v
        else
            print_warning "Configuração de testes não encontrada no backend"
        fi
    else
        print_warning "Ambiente virtual não encontrado"
    fi

    cd ..

    # Testes do frontend
    print_info "Testes do frontend..."
    cd frontend
    if [ -f "package.json" ]; then
        npm test
    else
        print_warning "package.json não encontrado no frontend"
    fi

    cd ..
}

# Função para limpar dados
clean_data() {
    print_info "Limpando dados de desenvolvimento..."
    if [ -f "scripts/database/clean_database.py" ]; then
        cd backend
        source .venv/bin/activate
        python ../scripts/database/clean_database.py
        cd ..
        print_success "Dados limpos com sucesso"
    else
        print_warning "Script de limpeza não encontrado"
    fi
}

# Função para verificar status
check_status() {
    print_info "Verificando status do projeto..."

    echo ""
    echo "📁 Estrutura do projeto:"
    echo "  Backend: $([ -d "backend" ] && echo "✅ OK" || echo "❌ Não encontrado")"
    echo "  Frontend: $([ -d "frontend" ] && echo "✅ OK" || echo "❌ Não encontrado")"
    echo "  Scripts: $([ -d "scripts" ] && echo "✅ OK" || echo "❌ Não encontrado")"
    echo "  Docs: $([ -d "docs" ] && echo "✅ OK" || echo "❌ Não encontrado")"
    echo "  Config: $([ -d "config" ] && echo "✅ OK" || echo "❌ Não encontrado")"
    echo "  Data: $([ -d "data" ] && echo "✅ OK" || echo "❌ Não encontrado")"

    echo ""
    echo "🔧 Ferramentas:"
    echo "  Node.js: $(command -v node &> /dev/null && node --version || echo "❌ Não instalado")"
    echo "  Python: $(command -v python3 &> /dev/null && python3 --version || echo "❌ Não instalado")"
    echo "  Ionic: $(command -v ionic &> /dev/null && ionic --version || echo "❌ Não instalado")"

    echo ""
    echo "📊 Status dos serviços:"
    echo "  Backend: $(curl -s http://localhost:8000/health &> /dev/null && echo "🟢 Online" || echo "🔴 Offline")"
    echo "  Frontend: $(curl -s http://localhost:8100 &> /dev/null && echo "🟢 Online" || echo "🔴 Offline")"
}

# Loop principal
while true; do
    show_menu

    case $choice in
        1)
            setup_workspace
            ;;
        2)
            start_backend
            ;;
        3)
            start_frontend
            ;;
        4)
            start_both
            ;;
        5)
            run_tests
            ;;
        6)
            clean_data
            ;;
        7)
            check_status
            ;;
        8)
            print_info "Saindo..."
            exit 0
            ;;
        *)
            print_warning "Opção inválida. Tente novamente."
            ;;
    esac

    echo ""
    read -p "Pressione Enter para continuar..."
done
