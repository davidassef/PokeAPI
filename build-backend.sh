#!/bin/bash
# Script para build do backend a partir da raiz
echo "🚀 Iniciando build do backend..."
cd backend
echo "📦 Instalando dependências do backend..."
pip install -r requirements.txt
echo "✅ Build do backend concluído!"
