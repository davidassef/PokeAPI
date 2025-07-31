#!/bin/bash

# Script de configuração do sistema de armazenamento local de imagens
# Este script configura o ambiente e executa o pré-carregamento de imagens

echo "🚀 Configurando sistema de armazenamento local de imagens..."

# Verificar se está no diretório correto
if [ ! -f "requirements.txt" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto backend"
    exit 1
fi

# Ativar ambiente virtual se existir
if [ -d "venv" ]; then
    echo "📦 Ativando ambiente virtual..."
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
fi

# Instalar dependências
echo "📥 Instalando/atualizando dependências..."
pip install -r requirements.txt

# Criar diretórios necessários
echo "📁 Criando diretórios de armazenamento..."
mkdir -p app/data/images
mkdir -p app/data/optimized
mkdir -p app/data/thumbnails

# Executar migrações do banco de dados (se necessário)
echo "🗄️ Verificando banco de dados..."
python -c "
import sys
sys.path.append('.')
from app.core.database import engine, Base
from app.models.pokemon_image_cache import PokemonImageCache
from app.models.optimized_image_cache import OptimizedImageCache
Base.metadata.create_all(bind=engine)
print('✅ Tabelas do banco de dados verificadas')
"

# Verificar espaço em disco disponível
DISK_AVAIL=$(df -m . | tail -1 | awk '{print $4}')
echo "💾 Espaço em disco disponível: ${DISK_AVAIL}MB"

if [ "$DISK_AVAIL" -lt 1024 ]; then
    echo "⚠️  Aviso: Pouco espaço em disco disponível. Recomendado: pelo menos 1GB"
    read -p "Continuar mesmo assim? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Executar verificação inicial
echo "🔍 Executando verificação inicial..."
python check_image_storage.py

# Perguntar se deseja executar o pré-carregamento completo
echo ""
echo "📥 Deseja executar o pré-carregamento completo de imagens?"
echo "Isso pode levar vários minutos e consumir aproximadamente 500MB de espaço"
read -p "Executar pré-carregamento? (s/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🔄 Iniciando pré-carregamento de imagens..."
    python mass_image_preloader.py
    
    echo "✅ Pré-carregamento concluído!"
    echo ""
    echo "📊 Executando verificação final..."
    python check_image_storage.py
else
    echo "⏭️  Pré-carregamento pulado. Execute 'python mass_image_preloader.py' quando estiver pronto."
fi

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📋 Comandos úteis:"
echo "  • Verificar armazenamento: python check_image_storage.py"
echo "  • Pré-carregar imagens: python mass_image_preloader.py"
echo "  • Servir imagens otimizadas: GET /api/images/optimized/{pokemon_id}"
echo "  • Servir imagens originais: GET /api/images/pokemon/{pokemon_id}"