# 🔄 Endpoints de Sincronização Forçada - Sistema Pull-Based

## 📋 Visão Geral

O sistema pull-based oferece **múltiplos endpoints** para **forçar a sincronização** antes do tempo programado pelo scheduler. Isso é especialmente útil para:

- 🧪 **Desenvolvimento e testes**
- 🐛 **Debug de problemas**
- ⚡ **Sincronização sob demanda**
- 🎯 **Controle granular do processo**

## 🛠️ Endpoints Disponíveis

### 🔄 **Sincronização Forçada**

#### 1. **Sincronizar Todos os Clientes**
```bash
POST /api/v1/pull-sync/sync-all
```
- **Descrição**: Força sincronização de **todos** os clientes registrados
- **Payload**: `{ "since": "2024-01-01T00:00:00Z" }` (opcional)
- **Uso**: Sincronização completa imediata

```bash
curl -X POST http://localhost:8000/api/v1/pull-sync/sync-all \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### 2. **Sincronizar Mudanças Recentes**
```bash
POST /api/v1/pull-sync/sync-recent
```
- **Descrição**: Força sincronização apenas de **mudanças recentes** (últimos 15 minutos)
- **Payload**: Nenhum
- **Uso**: Sincronização rápida e eficiente

```bash
curl -X POST http://localhost:8000/api/v1/pull-sync/sync-recent \
  -H "Content-Type: application/json"
```

#### 3. **Sincronização em Background**
```bash
POST /api/v1/pull-sync/sync-all-background
```
- **Descrição**: Inicia sincronização completa em **background**
- **Payload**: Nenhum
- **Uso**: Não bloqueia a resposta da API

```bash
curl -X POST http://localhost:8000/api/v1/pull-sync/sync-all-background \
  -H "Content-Type: application/json"
```

### ⚙️ **Controle do Scheduler**

#### 4. **Configurar Intervalo de Sincronização**
```bash
POST /api/v1/pull-sync/scheduler/set-interval
```
- **Descrição**: Altera o **intervalo** de sincronização automática
- **Payload**: `{ "interval": 30 }` (em segundos)
- **Mínimo**: 5 segundos

```bash
# Configurar para 10 segundos (ideal para testes)
curl -X POST http://localhost:8000/api/v1/pull-sync/scheduler/set-interval \
  -H "Content-Type: application/json" \
  -d '{"interval": 10}'
```

#### 5. **Iniciar/Parar Scheduler**
```bash
POST /api/v1/pull-sync/scheduler/start
POST /api/v1/pull-sync/scheduler/stop
```

```bash
# Iniciar scheduler
curl -X POST http://localhost:8000/api/v1/pull-sync/scheduler/start

# Parar scheduler
curl -X POST http://localhost:8000/api/v1/pull-sync/scheduler/stop
```

### 📊 **Monitoramento**

#### 6. **Status do Sistema**
```bash
GET /api/v1/pull-sync/status
GET /api/v1/pull-sync/scheduler/status
GET /api/v1/pull-sync/registered-clients
```

```bash
# Status geral
curl -X GET http://localhost:8000/api/v1/pull-sync/status

# Status do scheduler
curl -X GET http://localhost:8000/api/v1/pull-sync/scheduler/status

# Clientes registrados
curl -X GET http://localhost:8000/api/v1/pull-sync/registered-clients
```

### 🧹 **Limpeza**

#### 7. **Limpar Clientes Inativos**
```bash
POST /api/v1/pull-sync/cleanup-inactive
```

```bash
curl -X POST http://localhost:8000/api/v1/pull-sync/cleanup-inactive
```

## 🎯 **Casos de Uso Práticos**

### 1. **Desenvolvimento Rápido**
```bash
# Configurar intervalo rápido
curl -X POST http://localhost:8000/api/v1/pull-sync/scheduler/set-interval \
  -d '{"interval": 5}'

# Adicionar captura no cliente
curl -X POST http://localhost:3001/api/client/add-capture \
  -d '{"pokemon_id": 25, "pokemon_name": "pikachu", "action": "capture", "removed": false}'

# Forçar sincronização imediata
curl -X POST http://localhost:8000/api/v1/pull-sync/sync-recent

# Verificar resultado
curl -X GET http://localhost:8000/api/v1/ranking
```

### 2. **Debug de Problemas**
```bash
# Verificar status
curl -X GET http://localhost:8000/api/v1/pull-sync/status

# Tentar sincronização
curl -X POST http://localhost:8000/api/v1/pull-sync/sync-all

# Verificar logs do cliente
curl -X GET http://localhost:3001/api/client/stats
```

### 3. **Testes Automatizados**
```bash
# Script de teste completo
./test-forced-sync.sh
```

## 🔧 **Integração com Frontend**

### **Serviços Criados**

#### **SyncConfigService** (Atualizado)
- ✅ Métodos `getPullSyncEndpoints()`
- ✅ Métodos `getCurlCommands()`
- ✅ Configurações de intervalo

#### **PullSyncControlService** (Novo)
- ✅ `forceSyncAll()`
- ✅ `forceSyncRecent()`
- ✅ `startBackgroundSync()`
- ✅ `setSchedulerInterval()`
- ✅ `runFullSyncTest()`

#### **SyncAdminComponent** (Novo)
- ✅ Interface para controle manual
- ✅ Botões para forçar sincronização
- ✅ Monitoramento em tempo real
- ✅ Controle do scheduler

### **Como Usar no Frontend**

```typescript
import { PullSyncControlService } from './pull-sync-control.service';

// Injetar o serviço
constructor(private pullSync: PullSyncControlService) {}

// Forçar sincronização
async forceSync() {
  try {
    const result = await this.pullSync.forceSyncAll().toPromise();
    console.log('Sincronização forçada:', result);
  } catch (error) {
    console.error('Erro na sincronização:', error);
  }
}

// Configurar intervalo rápido para testes
async setTestMode() {
  await this.pullSync.setSchedulerInterval(5).toPromise();
}
```

## 📊 **Resposta dos Endpoints**

### **sync-all / sync-recent**
```json
{
  "clients_processed": 1,
  "total_captures": 3,
  "successful_clients": ["user_1"],
  "failed_clients": [],
  "sync_timestamp": "2024-01-01T12:00:00Z",
  "processing_time_ms": 150
}
```

### **scheduler/status**
```json
{
  "running": true,
  "sync_interval": 30,
  "cleanup_interval": 3600,
  "last_cleanup": "2024-01-01T11:00:00Z"
}
```

### **pull-sync/status**
```json
{
  "registered_clients": 1,
  "clients": [
    {
      "user_id": "user_1",
      "client_url": "http://localhost:3001",
      "client_type": "web"
    }
  ]
}
```

## 🚀 **Scripts de Teste**

### **Teste Básico**
```bash
./test-forced-sync.sh
```

### **Teste de Performance**
```bash
# Configurar intervalo mínimo
curl -X POST http://localhost:8000/api/v1/pull-sync/scheduler/set-interval -d '{"interval": 5}'

# Adicionar múltiplas capturas
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/client/add-capture \
    -d "{\"pokemon_id\": $i, \"pokemon_name\": \"pokemon$i\", \"action\": \"capture\", \"removed\": false}"
done

# Forçar sincronização
curl -X POST http://localhost:8000/api/v1/pull-sync/sync-all

# Verificar resultado
curl -X GET http://localhost:8000/api/v1/ranking
```

## 💡 **Dicas e Boas Práticas**

### **Desenvolvimento**
- ✅ Use intervalo de **5-10 segundos** para testes
- ✅ Use `sync-recent` para mudanças pequenas
- ✅ Use `sync-all` para sincronização completa

### **Produção**
- ✅ Use intervalo de **30-60 segundos**
- ✅ Monitore `scheduler/status` regularmente
- ✅ Execute `cleanup-inactive` periodicamente

### **Debug**
- ✅ Verifique `pull-sync/status` primeiro
- ✅ Use `sync-all` para testar conectividade
- ✅ Monitore logs do cliente HTTP

## 🎯 **Benefícios da Sincronização Forçada**

### **Controle Total**
- 🎛️ Sincronização sob demanda
- ⚡ Não aguarda scheduler
- 🎯 Controle granular

### **Desenvolvimento Eficiente**
- 🧪 Testes rápidos
- 🐛 Debug facilitado
- 📊 Feedback imediato

### **Produção Confiável**
- 🔄 Backup manual do scheduler
- 🚨 Sincronização de emergência
- 📈 Monitoramento ativo

## 🎉 **Conclusão**

O sistema pull-based oferece **controle completo** sobre a sincronização, permitindo:

- ✅ **Sincronização forçada** a qualquer momento
- ✅ **Controle do scheduler** em tempo real
- ✅ **Monitoramento detalhado** do processo
- ✅ **Interface administrativa** no frontend
- ✅ **Scripts de teste** automatizados

**Os endpoints de sincronização forçada tornam o sistema extremamente flexível e adequado tanto para desenvolvimento quanto para produção.**
