# Frontend Documentation - PokeAPIApp v1.5

## 📋 Visão Geral

Este documento descreve a arquitetura específica do frontend Angular/Ionic da aplicação PokeAPIApp, incluindo componentes principais, sistema de roteamento, navegação e guias de desenvolvimento.

## 🏗️ Arquitetura Frontend

### **Stack Tecnológico**
- **Angular**: 17.x (Framework principal)
- **Ionic**: 7.x (UI Components mobile)
- **TypeScript**: 5.x (Linguagem type-safe)
- **RxJS**: 7.x (Programação reativa)
- **SCSS**: Estilização avançada
- **Playwright**: Testes E2E

### **Padrões Arquiteturais**
- **Component-based Architecture**: Componentes reutilizáveis e modulares
- **Service-oriented**: Serviços injetáveis para lógica de negócio
- **Reactive Programming**: RxJS para gerenciamento de estado
- **Lazy Loading**: Carregamento sob demanda de módulos
- **OnPush Strategy**: Otimização de change detection

## 📁 Estrutura de Componentes

```
frontend/src/app/
├── core/                    # 🔧 Serviços principais
│   ├── services/           # Lógica de negócio
│   │   ├── auth.service.ts
│   │   ├── pokeapi.service.ts
│   │   ├── captured.service.ts
│   │   ├── favorites.service.ts
│   │   ├── logger.service.ts
│   │   └── settings.service.ts
│   ├── guards/             # Proteção de rotas
│   ├── interceptors/       # HTTP interceptors
│   └── config/             # Configurações
├── shared/                 # 🔄 Componentes compartilhados
│   ├── components/         # UI Components
│   │   ├── pokemon-card/
│   │   ├── favorite-button/
│   │   ├── music-player/
│   │   └── loading-spinner/
│   ├── pipes/              # Transformações de dados
│   └── directives/         # Diretivas customizadas
├── pages/                  # 📱 Páginas da aplicação
│   ├── web/               # 💻 Versões desktop
│   │   ├── home/
│   │   ├── favorites/
│   │   ├── captured/
│   │   ├── ranking/
│   │   └── settings/
│   └── mobile/            # 📱 Versões mobile
│       ├── home-mobile/
│       ├── captured-mobile/
│       ├── ranking-mobile/
│       └── settings-mobile/
├── models/                # 📊 Interfaces TypeScript
└── tabs/                  # 🗂️ Sistema de navegação
```
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
