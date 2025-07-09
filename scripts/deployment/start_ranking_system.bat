@echo off
echo ========================================
echo 🏆 SISTEMA DE RANKING - INICIALIZACAO
echo ========================================
echo.

echo 📋 Verificando dependencias...
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js nao encontrado. Instale o Node.js primeiro.
    pause
    exit /b 1
)

REM Verificar se Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python nao encontrado. Instale o Python primeiro.
    pause
    exit /b 1
)

echo ✅ Dependencias verificadas
echo.

echo 🚀 Iniciando client-server...
cd client-server
start "Client-Server" cmd /k "npm install && npm start"
cd ..

echo ⏳ Aguardando client-server inicializar...
timeout /t 5 /nobreak >nul

echo 🚀 Iniciando backend...
cd backend
start "Backend" cmd /k "pip install -r requirements.txt && python main.py"
cd ..

echo ⏳ Aguardando backend inicializar...
timeout /t 10 /nobreak >nul

echo 📊 Adicionando dados de exemplo...
cd backend
python ../scripts/database/add_sample_data.py
cd ..

echo ⏳ Aguardando processamento...
timeout /t 5 /nobreak >nul

echo 🧪 Testando sistema...
cd backend
python ../tests/test_ranking_system.py
cd ..

echo.
echo ========================================
echo 🎉 SISTEMA INICIADO!
echo ========================================
echo.
echo 📋 URLs disponiveis:
echo    - Backend: http://localhost:8000
echo    - Client-Server: http://localhost:3001
echo    - Ranking API: http://localhost:8000/api/v1/ranking/
echo    - Storage Ranking: http://localhost:8000/api/v1/pull-sync/storage-ranking
echo.
echo 📖 Documentacao: RANKING_SYSTEM_FIX.md
echo.
pause 