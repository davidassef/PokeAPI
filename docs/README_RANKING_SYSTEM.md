# 🏆 Sistema de Ranking - PokeAPIApp

## Visão Geral
O sistema de ranking exibe os Pokémons mais capturados globalmente baseado em dados consolidados de todos os clientes conectados. Utiliza um sistema pull-based que coleta, armazena e processa dados em tempo real, promovendo engajamento e competição saudável entre usuários.

---

## ⚡ Nova Arquitetura (v2.0)

### Sistema Pull-Based com Storage Consolidado
- **ClientStorageService**: Consolida dados de capturas de todos os clientes em arquivo JSON
- **RankingService**: Gera ranking dinâmico baseado nas contagens do storage
- **PullSyncService**: Sincronização completa entre clientes e backend
- **Critério de Desempate**: Pokémons com mesma contagem são ordenados por menor ID

### Como Funciona
1. **Coleta**: Backend puxa dados de todos os clientes via `/api/client/all-captures`
2. **Consolidação**: ClientStorageService armazena contagens por pokémon ID
3. **Ranking**: RankingService gera top pokémons ordenados por contagem e ID
4. **Persistência**: Dados salvos na tabela `pokemon_rankings` do banco
5. **Exibição**: Frontend consome ranking em tempo real

---

## 🔧 Arquitetura Técnica

### Backend
```
app/services/
├── client_storage_service.py    # Gerencia storage consolidado
├── ranking_service.py           # Gera ranking baseado no storage
├── pull_sync_service.py         # Sincronização pull-based
└── pull_sync_scheduler.py       # Sincronização automática

app/routes/
└── pull_sync.py                 # Endpoints de sincronização e ranking
```

### Storage
- **Arquivo**: `client_storage.json`
- **Estrutura**: 
  ```json
  {
    "clients": {"user_1": [1, 25, 150]},
    "pokemon_counts": {"1": 2, "25": 5, "150": 1},
    "last_updated": "2025-07-05T14:53:17.272594"
  }
  ```

### Frontend
- **Páginas**: `frontend/src/app/pages/ranking/`
- **Admin**: `frontend/src/app/pages/sync-admin/` (sincronização manual)
- **Client-Server**: `frontend/client-server.js` (expõe dados locais)

---

## 🚀 Endpoints da API

### Ranking
- `GET /api/v1/ranking/?limit=10` - Ranking tradicional (banco)
- `GET /api/v1/pull-sync/storage-ranking?limit=10` - Ranking em tempo real (storage)

### Sincronização
- `POST /api/v1/pull-sync/sync-with-storage` - Sincronização completa com storage
- `POST /api/v1/pull-sync/rebuild-ranking` - Rebuild do ranking
- `GET /api/v1/pull-sync/storage-stats` - Estatísticas do storage

### Clientes
- `POST /api/v1/pull-sync/register-client` - Registra cliente para sincronização
- `GET /api/client/all-captures` - Expõe todas as capturas do cliente

---

## 📊 Lógica do Ranking

### Critérios de Ordenação
1. **Contagem de capturas** (decrescente)
2. **ID do pokémon** (crescente - critério de desempate)

### Exemplo
```
Pikachu (ID: 25)    - 3 capturas  → 1º lugar
Bulbasaur (ID: 1)   - 2 capturas  → 2º lugar  
Charizard (ID: 6)   - 2 capturas  → 3º lugar (ID menor que Squirtle)
Squirtle (ID: 7)    - 2 capturas  → 4º lugar
```

### Consistência
- Banco de dados reflete **exatamente** o que está nos storages dos clientes
- Pokémons removidos pelos clientes são automaticamente removidos do ranking
- Sincronização garante que não há pokémons "fantasmas" no banco

---

## 🎮 Fluxo de Funcionamento

### 1. Captura no Cliente
```
Usuário captura Pikachu → Storage local → Client-server expõe via API
```

### 2. Sincronização
```
Backend puxa dados → Atualiza storage → Recalcula ranking → Atualiza banco
```

### 3. Exibição
```
Frontend consulta ranking → Exibe top 10 → Auto-refresh a cada minuto
```

---

## 🔄 Sincronização Automática

### Scheduler
- **Frequência**: A cada 30 segundos
- **Cleanup**: Remove clientes inativos a cada hora
- **Log**: Detalhado para debug e monitoramento

### Manual
- Página `/sync-admin` para administradores
- Botões para sincronização completa e rebuild
- Visualização de estatísticas em tempo real

---

## 💻 Client-Server

### Funcionalidade
- Servidor HTTP que roda junto com o frontend
- Expõe dados locais do cliente via API REST
- Permite que backend "puxe" dados ao invés de receber push

### Endpoints
- `GET /api/client/health` - Health check
- `GET /api/client/all-captures` - Todas as capturas (ativas e removidas)
- `GET /api/client/sync-data` - Apenas capturas pendentes

### Inicialização
```bash
# Frontend (Angular/Ionic)
npm start

# Client-server (Node.js)
node client-server.js
```

---

## 🎨 Interface do Usuário

### Exibição do Ranking
- **Top 3**: Destaque visual com coroa e medalhas
- **Demais**: Grid de 4 colunas, responsivo, com badges de posição
- **Contadores**: Exibem número real de capturas por pokémon
- **Auto-refresh**: Atualização automática baseada no storage

### Administração
- Página dedicada para sincronização manual
- Estatísticas em tempo real do storage
- Logs de sincronização e status dos clientes

---

## 🧪 Testes e Debugging

### Teste do Sistema
```bash
# Backend
python test_ranking.py

# Endpoints
curl -X GET "http://localhost:8000/api/v1/pull-sync/storage-stats"
curl -X POST "http://localhost:8000/api/v1/pull-sync/sync-with-storage"
```

### Debug
```bash
# Verificar banco de dados
python debug_database.py

# Logs detalhados no backend
# Verificar client_storage.json para dados consolidados
```

---

## 🔧 Configuração e Deploy

### Requisitos
- **Backend**: FastAPI, SQLAlchemy, httpx
- **Frontend**: Angular/Ionic, Node.js para client-server
- **Storage**: Arquivo JSON local (client_storage.json)

### Variáveis de Ambiente
```bash
CLIENT_PORT=3002  # Porta do client-server
BACKEND_URL=http://localhost:8000  # URL do backend
```

### Deploy
- Sistema funciona localmente e em produção
- Client-server deve rodar junto com frontend
- Backend pull dados automaticamente dos clientes registrados

---

## 🚀 Melhorias Implementadas

### v2.0 (Atual)
- ✅ Sistema pull-based com storage consolidado
- ✅ Ranking baseado em contagens reais dos clientes
- ✅ Critério de desempate por ID do pokémon
- ✅ Sincronização completa com verificação de consistência
- ✅ Client-server para exposição de dados locais
- ✅ Interface de administração para sincronização manual
- ✅ Logs detalhados e sistema de monitoramento

### v1.0 (Legado)
- Sistema push-based com favoritos
- Ranking baseado apenas em tabela de favoritos
- Sem critério de desempate definido
- Sincronização manual limitada

---

## 📈 Monitoramento

### Métricas Importantes
- **Clientes conectados**: Número de clientes registrados
- **Capturas totais**: Soma de todas as capturas de todos os clientes  
- **Pokémons únicos**: Quantidade de pokémons diferentes capturados
- **Última sincronização**: Timestamp da última atualização

### Logs
- Sincronização de clientes individual
- Atualizações do ranking
- Erros de conectividade
- Performance das operações

---

## 🔐 Segurança e Performance

### Segurança
- Validação de dados de entrada
- Timeouts para requisições HTTP
- Tratamento de erros robusto
- Logs para auditoria

### Performance
- Storage em arquivo JSON para acesso rápido
- Sincronização incremental quando possível
- Cleanup automático de clientes inativos
- Cache de nomes de pokémons

---

## 🛠️ Manutenção

### Rotinas
- **Backup**: `client_storage.json` contém dados críticos
- **Limpeza**: Remove clientes inativos automaticamente
- **Monitoramento**: Verificar logs de sincronização
- **Rebuild**: Forçar reconstrução quando necessário

### Troubleshooting
- **Client-server não responde**: Verificar se porta está livre
- **Ranking inconsistente**: Executar rebuild-ranking
- **Performance**: Verificar número de clientes conectados

---

**Dúvidas ou sugestões? Consulte este documento ou abra uma issue!**

---

**Dúvidas ou sugestões? Consulte este documento ou abra uma issue!** 