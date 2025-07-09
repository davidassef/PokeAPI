# Sistema de Ranking - Inicialização Automática
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🏆 SISTEMA DE RANKING - INICIALIZAÇÃO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Verificando dependências..." -ForegroundColor Yellow
Write-Host ""

# Verificar se Node.js está instalado
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js não encontrado"
    }
} catch {
    Write-Host "❌ Node.js não encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se Python está instalado
try {
    $pythonVersion = python --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Python encontrado: $pythonVersion" -ForegroundColor Green
    } else {
        throw "Python não encontrado"
    }
} catch {
    Write-Host "❌ Python não encontrado. Instale o Python primeiro." -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "✅ Dependências verificadas" -ForegroundColor Green
Write-Host ""

# Iniciar client-server
Write-Host "🚀 Iniciando client-server..." -ForegroundColor Yellow
Set-Location "client-server"
Start-Process -FilePath "cmd" -ArgumentList "/k", "npm install && npm start" -WindowStyle Normal
Set-Location ".."

Write-Host "⏳ Aguardando client-server inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Iniciar backend
Write-Host "🚀 Iniciando backend..." -ForegroundColor Yellow
Set-Location "backend"
Start-Process -FilePath "cmd" -ArgumentList "/k", "pip install -r requirements.txt && python main.py" -WindowStyle Normal
Set-Location ".."

Write-Host "⏳ Aguardando backend inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Adicionar dados de exemplo
Write-Host "📊 Adicionando dados de exemplo..." -ForegroundColor Yellow
Set-Location "backend"
python ../scripts/database/add_sample_data.py
Set-Location ".."

Write-Host "⏳ Aguardando processamento..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Testar sistema
Write-Host "🧪 Testando sistema..." -ForegroundColor Yellow
Set-Location "backend"
python ../tests/test_ranking_system.py
Set-Location ".."

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 SISTEMA INICIADO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 URLs disponíveis:" -ForegroundColor Cyan
Write-Host "   - Backend: http://localhost:8000" -ForegroundColor White
Write-Host "   - Client-Server: http://localhost:3001" -ForegroundColor White
Write-Host "   - Ranking API: http://localhost:8000/api/v1/ranking/" -ForegroundColor White
Write-Host "   - Storage Ranking: http://localhost:8000/api/v1/pull-sync/storage-ranking" -ForegroundColor White
Write-Host ""
Write-Host "📖 Documentação: RANKING_SYSTEM_FIX.md" -ForegroundColor Cyan
Write-Host ""
Read-Host "Pressione Enter para sair" 