#!/bin/bash
# Script de build para o frontend no Render

echo "🏗️ Iniciando build do frontend..."

# Navegar para o diretório do frontend
cd /opt/render/project/src/frontend

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Fazer build de produção
echo "🔨 Fazendo build de produção..."
npm run build:prod

# Verificar se o build foi bem-sucedido
if [ -d "www" ]; then
    echo "✅ Build concluído com sucesso!"
    echo "📁 Arquivos gerados em: www/"
    ls -la www/
else
    echo "❌ Erro no build! Diretório www/ não encontrado."
    exit 1
fi

# Copiar arquivos para o diretório de publicação
echo "📋 Copiando arquivos para publicação..."
cp -r www/* /opt/render/project/src/frontend/

echo "🎉 Frontend pronto para deploy!"
