# 🚀 Deploy Configuration - Render

## Arquitetura de Deploy

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
- **URL**: https://pokeapi-frontend.onrender.com

## ⚠️ Limitações do Deploy Estático

### O que NÃO funciona em static sites:
- ❌ **Client-Server (Node.js)**: Não pode rodar servidores em sites estáticos
- ❌ **Endpoints locais**: `/api/client/*` não existem em produção
- ❌ **Sistema Pull**: Backend não pode "puxar" dados do frontend

### O que funciona:
- ✅ **Frontend Angular/Ionic**: Interface completa
- ✅ **Armazenamento local**: Ionic Storage funciona normalmente
- ✅ **API calls**: Comunicação direta com o backend
- ✅ **Sistema Push**: Frontend envia dados para o backend

## 🔄 Sistema de Sincronização em Produção

```
┌─────────────────┐     HTTP POST     ┌──────────────────┐
│   Frontend      │ ─────────────────▶ │   Backend        │
│ (Static Site)   │                   │ (Web Service)    │
│                 │                   │                  │
│ • Ionic Storage │                   │ • FastAPI        │
│ • Push Sync     │                   │ • Database       │
│ • Offline Mode  │                   │ • Ranking Calc   │
└─────────────────┘                   └──────────────────┘
```

## 📋 Configuração Automática

O sistema detecta automaticamente o ambiente:

```typescript
// Desenvolvimento (localhost)
enableClientServer: true,
syncMode: 'pull + push'

// Produção (*.onrender.com, *.netlify.app, etc.)
enableClientServer: false,
syncMode: 'push only'
```

## 🧪 Testando o Deploy

### 1. Teste Local (Simulando Produção)
```bash
cd frontend
npm run start:frontend-only
# Testa sem client-server
```

### 2. Build de Produção
```bash
npm run build:prod
# Gera arquivos para deploy
```

### 3. Verificar Ranking
1. Acesse a URL de produção
2. Capture alguns Pokémon
3. Verifique se aparecem no ranking
4. Dados devem persistir no navegador

## 🔧 Troubleshooting

### Ranking não atualiza
- Verifique se o backend está online
- Teste captura de Pokémon
- Verifique console do navegador

### Erro de CORS
- Backend deve permitir origem do frontend
- Verificar `CORS_ORIGINS` no backend

### Dados não persistem
- Verificar se Ionic Storage está funcionando
- Limpar cache do navegador
- Testar em modo anônimo

---

**Última atualização**: 06/07/2025
