# 🏆 Sistema de Ranking - Resolução de Problemas

## 📋 Problemas Identificados

O sistema de ranking não está funcionando corretamente devido aos seguintes problemas:

1. **Client-Server não está rodando** - O servidor local que expõe os dados de captura não está ativo
2. **Backend não está rodando** - O servidor principal não está disponível
3. **Falta de dados de captura** - Não há dados para gerar o ranking
4. **Sincronização não está funcionando** - O processo de pull sync não está ativo

## 🔧 Solução Passo a Passo

### 1. Iniciar o Client-Server

O client-server é responsável por expor os dados de captura do frontend para o backend.

```bash
# Navegar para o diretório do client-server
cd client-server

# Instalar dependências
npm install

# Iniciar o servidor
npm start
```

**Verificar se está funcionando:**
```bash
curl http://localhost:3001/api/client/health
```

### 2. Iniciar o Backend

O backend processa os dados e gera o ranking.

```bash
# Navegar para o diretório do backend
cd backend

# Instalar dependências
pip install -r requirements.txt

# Iniciar o servidor
python main.py
```

**Verificar se está funcionando:**
```bash
curl http://localhost:8000/health
```

### 3. Adicionar Dados de Exemplo

Para testar o sistema, você pode adicionar dados de exemplo:

```bash
# No diretório backend
python add_sample_data.py
```

Este script adiciona capturas de exemplo ao client-server para testar o ranking.

### 4. Testar o Sistema Completo

Execute o script de teste para verificar se tudo está funcionando:

```bash
# No diretório backend
python test_ranking_system.py
```

## 📊 Como o Sistema Funciona

### Fluxo de Dados

1. **Frontend** → Captura pokémons e armazena localmente
2. **Client-Server** → Expõe dados de captura via API
3. **Backend** → Puxa dados do client-server via pull sync
4. **Storage Service** → Consolida dados de todos os clientes
5. **Ranking Service** → Gera ranking baseado nas contagens
6. **Database** → Armazena ranking persistente

### Componentes Principais

- **ClientStorageService**: Gerencia dados consolidados dos clientes
- **RankingService**: Gera ranking baseado no storage
- **PullSyncService**: Sincroniza dados dos clientes
- **Client-Server**: Expõe dados locais do frontend

## 🧪 Scripts de Diagnóstico

### Diagnóstico Completo
```bash
python diagnose_ranking.py
```

### Teste do Sistema
```bash
python test_ranking_system.py
```

### Adicionar Dados de Exemplo
```bash
python add_sample_data.py
```

## 🏆 Endpoints de Ranking

### Ranking Principal
```
GET http://localhost:8000/api/v1/ranking/
```

### Storage Ranking (Tempo Real)
```
GET http://localhost:8000/api/v1/pull-sync/storage-ranking
```

### Estatísticas do Storage
```
GET http://localhost:8000/api/v1/pull-sync/storage-stats
```

## 🔍 Verificações Importantes

### 1. Verificar Client-Server
- Porta 3001 deve estar disponível
- Endpoint `/api/client/health` deve responder
- Dados de captura devem estar presentes

### 2. Verificar Backend
- Porta 8000 deve estar disponível
- Scheduler de pull sync deve estar ativo
- Banco de dados deve estar acessível

### 3. Verificar Storage
- Arquivo `client_storage.json` deve existir
- Dados de clientes devem estar presentes
- Contagens de pokémons devem estar calculadas

### 4. Verificar Ranking
- Tabela `pokemon_rankings` deve ter dados
- Ranking deve estar ordenado por contagem e ID
- Consistência entre storage e banco

## 🚨 Problemas Comuns

### Client-Server não inicia
- Verificar se Node.js está instalado
- Verificar se as dependências estão instaladas
- Verificar se a porta 3001 está livre

### Backend não inicia
- Verificar se Python e dependências estão instalados
- Verificar se a porta 8000 está livre
- Verificar se o banco de dados está configurado

### Ranking vazio
- Verificar se há dados de captura no client-server
- Verificar se o pull sync está funcionando
- Verificar se o storage service está processando dados

### Inconsistência de dados
- Executar sincronização manual
- Verificar logs do pull sync
- Reconstruir ranking se necessário

## 📈 Monitoramento

### Logs Importantes
- Backend: `python main.py` (logs no console)
- Client-Server: `npm start` (logs no console)
- Pull Sync: Logs automáticos no backend

### Métricas a Monitorar
- Número de clientes conectados
- Total de capturas processadas
- Entradas no ranking
- Tempo de sincronização

## 🎯 Resultado Esperado

Após seguir todos os passos, você deve ter:

1. ✅ Client-server rodando na porta 3001
2. ✅ Backend rodando na porta 8000
3. ✅ Dados de captura no client-server
4. ✅ Ranking sendo gerado automaticamente
5. ✅ Endpoints retornando dados corretos

O ranking deve mostrar os pokémons mais capturados com:
- Ordenação por número de capturas (decrescente)
- Critério de desempate por ID (crescente)
- Top 10 pokémons
- Dados atualizados em tempo real

## 🔄 Manutenção

### Reiniciar Sistema
```bash
# Parar serviços (Ctrl+C)
# Iniciar novamente seguindo os passos acima
```

### Limpar Dados
```bash
# Limpar storage
rm backend/client_storage.json

# Limpar ranking no banco
# (via endpoint ou diretamente no banco)
```

### Atualizar Ranking
```bash
# Forçar sincronização
curl -X POST http://localhost:8000/api/v1/pull-sync/sync-complete
```

---

**Status do Sistema:** ⚠️ Requer configuração inicial
**Última Atualização:** 2025-07-07
**Versão:** 1.0.0 