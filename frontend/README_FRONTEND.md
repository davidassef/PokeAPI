# 🚀 Frontend - Sistema Integrado

## 📚 Documentação

**📖 Ver:** [`../docs/01_COMO_USAR_AMBIENTES.md`](../docs/01_COMO_USAR_AMBIENTES.md) para guia completo de ambientes

**🚀 Ver:** [`../docs/02_DEPLOY_PRODUCAO.md`](../docs/02_DEPLOY_PRODUCAO.md) para configuração de deploy

## Scripts Disponíveis

### 🎯 Desenvolvimento Local
```bash
# Comando completo (frontend + client-server)
npm start

# Equivalente para desenvolvimento
npm run start:dev
```

### 🌐 Deploy de Produção
```bash
# Build para deploy estático (sem client-server)
npm run build:prod

# Apenas frontend (para testes de produção)
npm run start:frontend-only
```

### 🔧 Comandos Individuais
```bash
# Apenas frontend
npm run start:frontend

# Apenas client-server
npm run start:client-server
```

## 🏗️ Diferenças por Ambiente

| Ambiente | Client-Server | Sincronização | URL Backend |
|----------|---------------|---------------|-------------|
| **Desenvolvimento** | ✅ Ativo (porta 3001) | Pull + Push | localhost:8000 |
| **Produção** | ❌ Não disponível | Apenas Push | pokeapi-la6k.onrender.com |

## 🌐 Portas e Serviços

| Serviço | Porta | URL | Descrição |
|---------|-------|-----|-----------|
| Frontend | 8100 | http://localhost:8100 | Interface Angular/Ionic |
| Client-Server | 3001 | http://localhost:3001 | API local para sincronização |
| Backend | 8000 | http://localhost:8000 | API principal FastAPI |

## 🔄 Sistema de Sincronização

### Desenvolvimento Local
O client-server expõe endpoints para o backend consumir:

- `GET /api/client/health` - Health check
- `GET /api/client/all-captures` - Todas as capturas
- `GET /api/client/sync-data` - Capturas pendentes
- `POST /api/client/add-capture` - Adicionar captura
- `POST /api/client/acknowledge` - Confirmar sincronização

### Produção (Deploy Estático)
Em produção, **NÃO há client-server**. O sistema usa apenas:

- **Push direto para o backend**: Capturas enviadas diretamente via API
- **Armazenamento local**: Ionic Storage para persistência offline
- **Fallback inteligente**: Se o backend estiver indisponível, dados ficam locais

## 🚀 Como Iniciar

### Desenvolvimento Completo
```bash
# 1. Backend (terminal 1)
cd backend
uvicorn main:app --reload

# 2. Frontend + Client-Server (terminal 2)
cd frontend
npm start
```

### Apenas Frontend (Simulando Produção)
```bash
cd frontend
npm run start:frontend-only
```

## 🧪 Teste de Funcionamento

1. **Inicie o sistema**: `npm start`
2. **Verifique os logs**: Ambos os serviços devem iniciar
3. **Acesse**: http://localhost:8100
4. **Teste health check**: http://localhost:3001/api/client/health
5. **Capture Pokémon**: Use a interface para capturar
6. **Verifique ranking**: Acesse a página de ranking

## ⚠️ Resolução de Problemas

### Erro: "Port already in use"
```bash
# Verificar processo na porta 3001
netstat -ano | findstr :3001

# Matar processo se necessário
taskkill /PID <PID> /F
```

### Client-Server não inicia (Apenas desenvolvimento)
- Verificar se o arquivo `client-server.js` existe
- Verificar dependências: `npm install`
- Verificar logs no terminal

### Frontend não conecta ao client-server
- **Em desenvolvimento**: Verificar se ambos estão rodando
- **Em produção**: Normal - client-server não existe em deploy estático

### Ranking vazio em produção
- **Esperado**: Ranking zerado e alimentado apenas pelo frontend
- **Solução**: Capture Pokémon para popular o ranking

## 🌍 Deploy em Produção

### Características do Deploy Estático
- ✅ **Frontend** roda como site estático
- ❌ **Client-Server** NÃO roda (Node.js não disponível)
- ✅ **Sincronização** funciona via API direta ao backend
- ✅ **Armazenamento local** mantém dados offline

## 📦 Dependências

O sistema usa `concurrently` para executar múltiplos comandos:

```json
{
  "devDependencies": {
    "concurrently": "^x.x.x"
  }
}
```

## 🔧 Configuração

### Proxy Configuration (`proxy.conf.json`)
```json
{
  "/api/*": {
    "target": "http://localhost:8000",
    "secure": false,
    "changeOrigin": true
  }
}
```

### Client-Server Configuration
- Porta: 3001 (configurável via environment)
- Arquivo de dados: `client-sync-data.json`
- CORS: Habilitado para frontend

---

**Para mais detalhes, consulte o README_RANKING_SYSTEM.md**
