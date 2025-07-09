# � Deploy do Client-Server - Render

## 🎯 Arquitetura Completa

### Client-Server (Web Service)
- **Tipo**: Web Service
- **Runtime**: Node.js 18+
- **Comando**: `npm install && npm start`
- **URL**: https://pokemonapp-client-server.onrender.com

### Backend (Web Service)
- **Tipo**: Web Service
- **Runtime**: Python 3.11
- **Comando**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **URL**: https://pokeapi-la6k.onrender.com

### Frontend (Static Site)
- **Tipo**: Static Site
- **Runtime**: Node.js
- **Build**: `npm install && npm run build:prod`
- **Publish**: `./www`
- **URL**: https://pokemonapp-frontend.onrender.com

## ⚙️ Configuração do Client-Server

### Configurações Básicas
```yaml
# render.yaml
type: web
name: pokemonapp-client-server
env: node
buildCommand: npm install
startCommand: npm start
```

### Variáveis de Ambiente
| Key | Value | Descrição |
|-----|-------|-----------|
| `NODE_ENV` | `production` | Modo de produção |
| `BACKEND_URL` | `https://pokeapi-la6k.onrender.com` | URL do backend |

## � Passo a Passo do Deploy

### 1. Preparar Repositório
```bash
# Executar script de deploy
./scripts/deploy-client-server.sh
```

### 2. Acessar Render Dashboard
1. Vá para https://dashboard.render.com
2. Faça login na sua conta
3. Clique em **"New +"** → **"Web Service"**

### 3. Conectar Repositório
1. Selecione seu repositório: **`davidassef/PokeAPI`**
2. Clique em **"Connect"**

### 4. Configurar Serviço
| Campo | Valor |
|-------|-------|
| **Name** | `pokemonapp-client-server` |
| **Root Directory** | `client-server` |
| **Environment** | `Node` |
| **Region** | `Oregon (US West)` |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Auto-Deploy** | ✅ Habilitado |

### 5. Configurar Variáveis
Adicione as variáveis de ambiente:
- `NODE_ENV` = `production`
- `BACKEND_URL` = `https://pokeapi-la6k.onrender.com`

### 6. Finalizar Deploy
1. Clique em **"Create Web Service"**
2. Aguarde o deploy (pode levar alguns minutos)
3. Verificar logs para confirmar sucesso

## ✅ Verificação e Testes

### Comandos de Teste
```bash
# Executar suite de testes
./scripts/test-client-server-deploy.sh

# Testar health check
curl https://pokemonapp-client-server.onrender.com/api/client/health

# Testar sync data
curl https://pokemonapp-client-server.onrender.com/api/client/sync-data
```

### Resposta Esperada (Health Check)
```json
{
  "status": "healthy",
  "client_id": "user_1",
  "client_url": "https://pokemonapp-client-server.onrender.com",
  "timestamp": "2025-07-06T21:30:00.000Z",
  "version": "1.0.0"
}
```

## � Fluxo de Sincronização

### Arquitetura Completa
```
📱 Frontend (Ionic/Angular)
   ↓ (armazena dados)
🔄 Client-Server (Node.js/Express)
   ↓ (pull/push)
⚙️ Backend (FastAPI/Python)
   ↓ (persiste dados)
🗄️ Database (SQLite)
```

### Endpoints do Client-Server
| Endpoint | Método | Descrição |
|----------|---------|-----------|
| `/api/client/health` | GET | Status do serviço |
| `/api/client/sync-data` | GET | Obter dados para sync |
| `/api/client/sync-data` | POST | Receber dados do frontend |
| `/api/client/register` | POST | Registrar no backend |

## 🚨 Troubleshooting

### Problemas Comuns
| Problema | Solução |
|----------|---------|
| **Build falha** | Verificar `package.json` e Node.js >= 18.0.0 |
| **Serviço não inicia** | Conferir logs no dashboard do Render |
| **Erro CORS** | Verificar configurações no `client-server.js` |
| **Conexão com backend** | Validar variável `BACKEND_URL` |

### Comandos de Debug
```bash
# Testar localmente
cd client-server && npm start

# Verificar logs
# (Acessar dashboard → service → logs)

# Testar conectividade
curl -v https://pokemonapp-client-server.onrender.com/api/client/health
```

## 📊 Benefícios da Arquitetura

### ✅ Vantagens
- **Sincronização Robusta**: Backend sempre acessa dados
- **Arquitetura Consistente**: Mesmo padrão local e produção
- **Escalabilidade**: Client-server pode ser replicado
- **Monitoramento**: Health checks em todos os serviços

### 🎯 Fluxo de Dados
1. **Frontend** salva capturas localmente
2. **Client-Server** expõe dados via API
3. **Backend** faz pull dos dados periodicamente
4. **Backend** processa e atualiza ranking
5. **Frontend** consulta ranking atualizado

---

**Última atualização**: 06/07/2025
**Versão**: 1.0
