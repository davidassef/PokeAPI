# Guia de Troubleshooting - Sistema de Cache de Imagens

## 🚨 Problemas Comuns e Soluções

### 1. Imagens não carregam (mostram apenas placeholders)

#### **Sintomas:**
- Placeholders aparecem em vez de imagens reais
- Console mostra erros de carregamento
- Timeouts frequentes

#### **Diagnóstico:**
```bash
# Execute o script de validação
python backend/validate_image_system.py

# Verifique logs do backend
tail -f backend/logs/app_*.log | grep -i image

# Teste conectividade externa
curl -I "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png"
```

#### **Soluções:**

**A. Problema de conectividade externa:**
```bash
# Verifique firewall/proxy
ping raw.githubusercontent.com

# Teste com diferentes Pokémons
curl -o test.png "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
```

**B. Problema de permissões:**
```bash
# Verifique permissões do diretório
ls -la pokemon_images/
chmod 755 pokemon_images/
```

**C. Problema de banco de dados:**
```python
# Execute no Python
from backend.app.core.database import SessionLocal
from backend.app.services.image_cache_service import PokemonImageCache

db = SessionLocal()
failed_entries = db.query(PokemonImageCache).filter(
    PokemonImageCache.is_downloaded == False,
    PokemonImageCache.download_attempts >= 3
).all()

print(f"Entradas com falha: {len(failed_entries)}")
```

### 2. Arquivos corrompidos ou incompletos

#### **Sintomas:**
- Imagens aparecem quebradas
- Tamanhos de arquivo muito pequenos
- Erros de integridade nos logs

#### **Diagnóstico:**
```bash
# Verifique tamanhos de arquivo
find pokemon_images/ -name "*.png" -size -1k

# Verifique headers de arquivo
file pokemon_images/*.png | grep -v "PNG image"
```

#### **Soluções:**

**A. Limpeza de arquivos corrompidos:**
```bash
# Remove arquivos muito pequenos
find pokemon_images/ -name "*.png" -size -500c -delete

# Force download de Pokémons específicos
curl -X POST "http://localhost:8000/api/v1/images/pokemon/1/force-download"
```

**B. Reset completo do cache:**
```python
# Execute no Python
from backend.app.core.database import SessionLocal
from backend.app.services.image_cache_service import PokemonImageCache
import shutil

# Remove arquivos físicos
shutil.rmtree("pokemon_images", ignore_errors=True)

# Limpa banco de dados
db = SessionLocal()
db.query(PokemonImageCache).delete()
db.commit()
```

### 3. Performance lenta

#### **Sintomas:**
- Carregamento demorado
- Timeouts frequentes
- CPU/memória alta

#### **Diagnóstico:**
```bash
# Verifique estatísticas do cache
curl "http://localhost:8000/api/v1/images/cache/stats"

# Monitore recursos
top -p $(pgrep -f "uvicorn")
```

#### **Soluções:**

**A. Otimização de configurações:**
```python
# Em image_cache_service.py, ajuste:
self.timeout_seconds = 45  # Aumentar timeout
self.max_download_attempts = 5  # Mais tentativas
```

**B. Preload estratégico:**
```bash
# Preload dos Pokémons mais populares
curl -X POST "http://localhost:8000/api/v1/images/preload" \
  -H "Content-Type: application/json" \
  -d '{"pokemon_ids": [1,4,7,25,94,130,144,150]}'
```

### 4. Problemas de CORS no frontend

#### **Sintomas:**
- Erros de CORS no console
- Requisições bloqueadas
- Status 0 nas requisições

#### **Soluções:**

**A. Verificar configuração de CORS:**
```python
# Em backend/main.py, verificar:
origins = [
    "http://localhost:4200",
    "http://localhost:8100",
    "https://seu-dominio.vercel.app"
]
```

**B. Teste direto da API:**
```bash
# Teste sem CORS
curl -H "Origin: http://localhost:4200" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     "http://localhost:8000/api/v1/images/pokemon/1"
```

## 🔧 Comandos de Manutenção

### Limpeza Geral
```bash
# Remove cache local
rm -rf pokemon_images/

# Reinicia serviço
sudo systemctl restart your-backend-service
```

### Monitoramento
```bash
# Logs em tempo real
tail -f backend/logs/app_*.log | grep -E "(✅|❌|⚠️)"

# Estatísticas de uso
watch -n 5 'curl -s "http://localhost:8000/api/v1/images/cache/stats" | jq .'
```

### Backup e Restore
```bash
# Backup do cache
tar -czf pokemon_images_backup.tar.gz pokemon_images/

# Backup do banco
sqlite3 pokemon_app.db ".backup pokemon_backup.db"

# Restore
tar -xzf pokemon_images_backup.tar.gz
```

## 📊 Métricas de Saúde

### Indicadores Positivos:
- ✅ Taxa de sucesso > 90%
- ✅ Tempo médio de download < 5s
- ✅ Arquivos > 1KB
- ✅ Sem erros de integridade

### Indicadores de Problema:
- ❌ Taxa de sucesso < 70%
- ❌ Muitos timeouts
- ❌ Arquivos < 500 bytes
- ❌ Muitas tentativas falhadas

### Script de Monitoramento Automático:
```bash
#!/bin/bash
# health_check.sh

STATS=$(curl -s "http://localhost:8000/api/v1/images/cache/stats")
SUCCESS_RATE=$(echo $STATS | jq -r '.cache_stats.downloaded / .cache_stats.total_entries * 100')

if (( $(echo "$SUCCESS_RATE < 80" | bc -l) )); then
    echo "⚠️ ALERTA: Taxa de sucesso baixa: $SUCCESS_RATE%"
    # Enviar notificação ou executar correção automática
fi
```

## 🚀 Otimizações Avançadas

### 1. Cache Warming (Pré-aquecimento)
```python
# Script para pré-carregar Pokémons populares
popular_pokemon = [1, 4, 7, 25, 94, 130, 144, 150, 151, 249, 250, 384, 385, 386]

for pokemon_id in popular_pokemon:
    requests.post(f"http://localhost:8000/api/v1/images/preload", 
                  json={"pokemon_ids": [pokemon_id]})
```

### 2. Monitoramento Proativo
```python
# Adicionar ao cron para execução diária
# 0 2 * * * python /path/to/validate_image_system.py > /var/log/image_health.log
```

### 3. Configuração de Produção
```python
# Para ambiente de produção, ajustar:
- timeout_seconds = 60
- max_download_attempts = 5
- retry_delay_hours = 12
- batch_size = 5  # Reduzir para não sobrecarregar
```

## 📞 Suporte e Escalação

### Logs Importantes:
- `backend/logs/app_*.log` - Logs gerais da aplicação
- Console do browser - Erros do frontend
- Network tab - Requisições HTTP

### Informações para Suporte:
1. Versão do sistema
2. Logs de erro específicos
3. Resultado do `validate_image_system.py`
4. Estatísticas do cache
5. Configuração de rede/firewall

### Contatos de Emergência:
- Desenvolvedor: [seu-email]
- Infraestrutura: [email-infra]
- Monitoramento: [email-monitoring]
