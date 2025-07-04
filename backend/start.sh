#!/bin/bash
# Script de inicialização para o backend no Render

echo "🚀 Iniciando backend PokeAPI..."

# Definir variáveis de ambiente
export PYTHONPATH="/opt/render/project/src/backend:$PYTHONPATH"
export DATABASE_URL="sqlite:///./pokemon_app.db"
export ENVIRONMENT="production"

# Navegar para o diretório do backend
cd /opt/render/project/src/backend

# Verificar se o banco de dados existe, se não, criar
if [ ! -f "pokemon_app.db" ]; then
    echo "📊 Criando banco de dados inicial..."
    python -c "
from app.core.database import engine
from app.models.models import Base
Base.metadata.create_all(bind=engine)
print('✅ Banco de dados criado com sucesso!')
"
fi

# Iniciar o servidor FastAPI
echo "🌐 Iniciando servidor FastAPI na porta $PORT..."
exec uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
