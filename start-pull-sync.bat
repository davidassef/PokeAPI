@echo off
echo 🚀 Iniciando Sistema Pull-Based de Sincronização
echo =================================================

REM Verificar se estamos no diretório correto
if not exist "backend" (
    echo ❌ Erro: Execute este script no diretório raiz do projeto
    pause
    exit /b 1
)

REM Iniciar Backend
echo 📡 Iniciando Backend FastAPI...
start "Backend" cmd /k "cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

REM Aguardar o backend iniciar
echo ⏳ Aguardando backend iniciar...
timeout /t 5 /nobreak >nul

REM Verificar se backend está rodando
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erro: Backend não está respondendo
    pause
    exit /b 1
)
echo ✅ Backend iniciado com sucesso

REM Iniciar Cliente HTTP
echo 🖥️  Iniciando Cliente HTTP...
start "Cliente" cmd /k "cd frontend && node client-server.js"

REM Aguardar o cliente iniciar
echo ⏳ Aguardando cliente iniciar...
timeout /t 3 /nobreak >nul

REM Verificar se cliente está rodando
curl -s http://localhost:3001/api/client/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erro: Cliente não está respondendo
    pause
    exit /b 1
)
echo ✅ Cliente iniciado com sucesso

REM Opcionalmente iniciar Frontend Ionic
set /p start_frontend="🌐 Iniciar Frontend Ionic? (s/n): "
if /i "%start_frontend%"=="s" (
    echo 🌐 Iniciando Frontend Ionic...
    start "Frontend" cmd /k "cd frontend && ionic serve --port 8100"
    timeout /t 3 /nobreak >nul
    echo ✅ Frontend iniciado na porta 8100
)

echo.
echo ✅ Sistema iniciado com sucesso!
echo 📡 Backend: http://localhost:8000
echo 🖥️  Cliente: http://localhost:3001
if /i "%start_frontend%"=="s" (
    echo 🌐 Frontend: http://localhost:8100
)
echo 📚 Docs: http://localhost:8000/docs
echo.
echo 🧪 Para testar: python test_pull_sync.py
echo 🛑 Para parar: Feche as janelas do terminal
echo.
pause
