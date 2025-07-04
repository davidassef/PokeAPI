#!/bin/bash
# Script para iniciar o backend a partir da raiz
echo "🚀 Iniciando servidor backend..."
cd backend
echo "🔥 Executando FastAPI com Uvicorn..."
uvicorn main:app --host 0.0.0.0 --port $PORT
