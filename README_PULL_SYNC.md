# Sistema Pull-Based de Sincronização

## 📋 Visão Geral

O sistema pull-based de sincronização foi implementado para resolver problemas de confiabilidade e escalabilidade do sistema push original. Em vez de o frontend enviar dados para o backend (push), agora o backend periodicamente "puxa" dados dos clientes (pull).

## 🏗️ Arquitetura

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │   Backend       │
│   (Angular)     │         │   (FastAPI)     │
│                 │         │                 │
│ ┌─────────────┐ │         │ ┌─────────────┐ │
│ │CapturedSrv  │ │         │ │PullSyncSrv  │ │
│ │             │ │         │ │             │ │
│ │  ┌────────┐ │ │  HTTP   │ │  ┌────────┐ │ │
│ │  │Storage │ │ │◄────────┤ │  │Scheduler│ │ │
│ │  └────────┘ │ │         │ │  └────────┘ │ │
│ └─────────────┘ │         │ └─────────────┘ │
│                 │         │                 │
│ ┌─────────────┐ │         │ ┌─────────────┐ │
│ │ClientServer │ │         │ │  Database   │ │
│ │(Node.js)    │ │         │ │  (SQLite)   │ │
│ └─────────────┘ │         │ └─────────────┘ │
└─────────────────┘         └─────────────────┘
```

## 🚀 Instalação e Configuração

### 1. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Cliente HTTP (Node.js)

```bash
cd frontend
npm install express cors node-fetch
node client-server.js
```

### 3. Frontend (Ionic/Angular)

```bash
cd frontend
npm install
ionic serve --port 8100
```

## 📡 Endpoints

### Backend (FastAPI)

#### Pull Sync Management
- `POST /api/v1/pull-sync/register-client` - Registrar cliente
- `DELETE /api/v1/pull-sync/unregister-client/{user_id}` - Desregistrar cliente
- `GET /api/v1/pull-sync/registered-clients` - Listar clientes registrados
- `GET /api/v1/pull-sync/status` - Status do sistema

#### Synchronization
- `POST /api/v1/pull-sync/sync-all` - Sincronizar todos os clientes
- `POST /api/v1/pull-sync/sync-recent` - Sincronizar mudanças recentes
- `POST /api/v1/pull-sync/sync-all-background` - Sincronizar em background

#### Scheduler Control
- `GET /api/v1/pull-sync/scheduler/status` - Status do scheduler
- `POST /api/v1/pull-sync/scheduler/start` - Iniciar scheduler
- `POST /api/v1/pull-sync/scheduler/stop` - Parar scheduler
- `POST /api/v1/pull-sync/scheduler/set-interval` - Configurar intervalo

### Cliente HTTP (Node.js)

#### Data Endpoints
- `GET /api/client/health` - Health check
- `GET /api/client/sync-data` - Dados de sincronização
- `POST /api/client/acknowledge` - Confirmar sincronização
- `GET /api/client/stats` - Estatísticas do cliente

#### Management
- `POST /api/client/add-capture` - Adicionar captura manualmente

## 🔄 Fluxo de Funcionamento

### 1. Inicialização
1. Backend inicia e ativa o scheduler
2. Cliente HTTP inicia e se registra no backend
3. Frontend inicia e conecta ao sistema

### 2. Captura de Dados
1. Usuário captura Pokémon no frontend
2. Frontend armazena captura localmente
3. Frontend envia captura para cliente HTTP
4. Cliente HTTP armazena em arquivo JSON

### 3. Sincronização
1. Scheduler do backend executa a cada 30 segundos
2. Backend consulta todos os clientes registrados
3. Backend puxa dados pendentes de cada cliente
4. Backend processa capturas e atualiza database
5. Backend confirma sincronização com cliente
6. Cliente marca capturas como sincronizadas

### 4. Cleanup
1. Scheduler executa cleanup a cada hora
2. Remove clientes inativos
3. Cliente remove dados antigos sincronizados

## 🧪 Testes

### Teste Automatizado
```bash
python test_pull_sync.py
```

### Testes Manuais

#### 1. Verificar Status
```bash
curl -X GET http://localhost:8000/api/v1/pull-sync/status
curl -X GET http://localhost:3001/api/client/health
```

#### 2. Adicionar Captura
```bash
curl -X POST http://localhost:3001/api/client/add-capture \
  -H "Content-Type: application/json" \
  -d '{"pokemon_id": 1, "pokemon_name": "bulbasaur", "action": "capture", "removed": false}'
```

#### 3. Verificar Sincronização
```bash
curl -X GET http://localhost:3001/api/client/sync-data
curl -X POST http://localhost:8000/api/v1/pull-sync/sync-all \
  -H "Content-Type: application/json" -d '{}'
```

#### 4. Verificar Ranking
```bash
curl -X GET http://localhost:8000/api/v1/ranking
```

## 🔧 Configuração

### Intervalos de Sincronização
```python
# backend/app/services/pull_sync_scheduler.py
self.sync_interval = 30  # segundos
self.cleanup_interval = 3600  # 1 hora
```

### URLs e Portas
```javascript
// frontend/client-server.js
const CLIENT_PORT = 3001
const BACKEND_URL = 'http://localhost:8000'
```

### Timeouts
```python
# backend/app/services/pull_sync_service.py
timeout=15.0  # Timeout para requisições HTTP
```

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Cliente não registra
```bash
# Verificar se cliente está executando
curl -X GET http://localhost:3001/api/client/health

# Registrar manualmente
curl -X POST http://localhost:8000/api/v1/pull-sync/register-client \
  -H "Content-Type: application/json" \
  -d '{"client_url": "http://localhost:3001", "user_id": "user_1", "client_type": "web", "capabilities": ["capture", "favorite"]}'
```

#### 2. Scheduler não inicia
```bash
# Verificar status
curl -X GET http://localhost:8000/api/v1/pull-sync/scheduler/status

# Iniciar manualmente
curl -X POST http://localhost:8000/api/v1/pull-sync/scheduler/start
```

#### 3. Sincronização falha
```bash
# Verificar logs do backend e cliente
# Testar conectividade
curl -X GET http://localhost:3001/api/client/sync-data
```

## 📊 Monitoramento

### Métricas Disponíveis
- Número de clientes registrados
- Capturas pendentes por cliente
- Taxa de sucesso da sincronização
- Tempo de processamento
- Clientes inativos

### Logs
- Backend: Logs detalhados de sincronização
- Cliente: Logs de requisições HTTP
- Scheduler: Logs de execução periódica

## 🎯 Benefícios

### Confiabilidade
- Menor perda de dados
- Retry automático
- Detecção de clientes inativos

### Escalabilidade
- Backend controla o ritmo
- Processamento em lotes
- Cleanup automático

### Debugging
- Logs detalhados
- Métricas centralizadas
- Teste automatizado

## 📈 Performance

### Configuração Otimizada
- Sincronização a cada 30 segundos
- Timeout de 15 segundos
- Cleanup a cada hora
- Processamento assíncrono

### Limitações
- Dependência de conectividade
- Latência de sincronização
- Armazenamento local necessário

## 🔒 Segurança

### Implementado
- Validação de dados
- Timeouts de requisição
- Cleanup de dados antigos

### Recomendações
- HTTPS em produção
- Autenticação/autorização
- Rate limiting
- Validação de entrada

## 🚀 Produção

### Checklist de Deploy
- [ ] Configurar HTTPS
- [ ] Configurar variáveis de ambiente
- [ ] Configurar persistência adequada
- [ ] Configurar monitoramento
- [ ] Configurar logs
- [ ] Testar conectividade
- [ ] Configurar backup

### Variáveis de Ambiente
```bash
# Backend
DATABASE_URL=sqlite:///./pokemon_app.db
PULL_SYNC_INTERVAL=30
PULL_SYNC_TIMEOUT=15

# Cliente
CLIENT_PORT=3001
BACKEND_URL=https://api.pokeapi.com
```

## 📚 Documentação Adicional

- [Status da Implementação](./docs/PULL_SYNC_STATUS.md)
- [Troubleshooting](./docs/PULL_SYNC_TROUBLESHOOTING.md)
- [Endpoints Admin](./docs/ADMIN_ENDPOINTS.md)

## 🎉 Conclusão

O sistema pull-based está funcionando e testado. Oferece maior confiabilidade e controle sobre a sincronização de dados, sendo adequado para uso em produção com as devidas configurações de segurança e monitoramento.
