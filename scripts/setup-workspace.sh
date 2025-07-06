#!/bin/bash
# 🚀 Script de Configuração do Workspace PokeAPIApp

echo "🏗️ Configurando workspace PokeAPIApp..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Verificar se estamos na raiz do projeto
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Execute este script na raiz do projeto PokeAPIApp"
    exit 1
fi

print_info "Verificando estrutura do projeto..."

# Verificar e criar pastas necessárias
REQUIRED_DIRS=(
    "scripts/build"
    "scripts/database"
    "scripts/deployment"
    "scripts/sync"
    "config"
    "data"
    "docs"
    "tests/e2e"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        print_status "Criada pasta: $dir"
    fi
done

# Verificar Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js encontrado: $NODE_VERSION"
else
    print_error "Node.js não encontrado. Instale Node.js 18+ para continuar."
    exit 1
fi

# Verificar Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_status "Python encontrado: $PYTHON_VERSION"
else
    print_error "Python3 não encontrado. Instale Python 3.11+ para continuar."
    exit 1
fi

# Verificar Ionic CLI
if command -v ionic &> /dev/null; then
    IONIC_VERSION=$(ionic --version)
    print_status "Ionic CLI encontrado: $IONIC_VERSION"
else
    print_warning "Ionic CLI não encontrado. Instalando..."
    npm install -g @ionic/cli
fi

print_info "Configurando backend..."

# Configurar backend
cd backend

# Verificar se existe ambiente virtual
if [ ! -d ".venv" ]; then
    print_info "Criando ambiente virtual Python..."
    python3 -m venv .venv
    print_status "Ambiente virtual criado"
fi

# Ativar ambiente virtual
source .venv/bin/activate

# Instalar dependências do backend
if [ -f "requirements.txt" ]; then
    print_info "Instalando dependências do backend..."
    pip install -r requirements.txt
    print_status "Dependências do backend instaladas"
else
    print_warning "requirements.txt não encontrado no backend"
fi

# Voltar para a raiz
cd ..

print_info "Configurando frontend..."

# Configurar frontend
cd frontend

# Instalar dependências do frontend
if [ -f "package.json" ]; then
    print_info "Instalando dependências do frontend..."
    npm install
    print_status "Dependências do frontend instaladas"
else
    print_warning "package.json não encontrado no frontend"
fi

# Voltar para a raiz
cd ..

# Verificar se existe package.json na raiz
if [ -f "package.json" ]; then
    print_info "Instalando dependências do workspace..."
    npm install
    print_status "Dependências do workspace instaladas"
fi

print_status "Configuração do workspace concluída!"
echo ""
print_info "Para iniciar o desenvolvimento:"
echo "  Backend:  cd backend && source .venv/bin/activate && python main.py"
echo "  Frontend: cd frontend && ionic serve"
echo ""
print_info "Para mais informações, consulte:"
echo "  📖 README.md - Documentação principal"
echo "  📁 docs/PROJECT_STRUCTURE.md - Estrutura do projeto"
echo "  📋 docs/DEVELOPMENT_PLAN.md - Plano de desenvolvimento"
