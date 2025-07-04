#!/bin/bash
# Script para build do frontend a partir da raiz
echo "🚀 Iniciando build do frontend..."
cd frontend
echo "📦 Instalando dependências do frontend..."
npm install
echo "🔨 Construindo aplicação Angular/Ionic..."
npm run build:prod
echo "✅ Build do frontend concluído!"
