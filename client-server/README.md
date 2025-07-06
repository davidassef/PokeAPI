# Pokemon App - Client Server

Este é o servidor cliente que expõe o storage local via API para sincronização com o backend.

## Funcionalidades

- Expõe dados de capturas via API REST
- Sistema de sincronização com backend
- Health check endpoint
- Reload de dados em tempo real

## Endpoints

- `GET /api/client/health` - Health check
- `GET /api/client/sync-data` - Dados para sincronização
- `GET /api/client/all-captures` - Todas as capturas
- `POST /api/client/add-capture` - Adicionar captura
- `POST /api/client/acknowledge` - Confirmar sincronização
- `POST /api/client/reload-data` - Recarregar dados
- `GET /api/client/stats` - Estatísticas

## Deploy

O cliente está configurado para deploy automático no Render.

### Variáveis de Ambiente

- `NODE_ENV=production` - Ambiente de produção
- `PORT` - Porta do servidor (automática no Render)

## Arquitetura

```
Frontend (Ionic) → Client-Server (Node.js) → Backend (FastAPI)
```

O client-server atua como intermediário entre o frontend e backend, permitindo que o backend faça pull dos dados ao invés de push.
