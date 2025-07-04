# 🚀 Deploy Fullstack para Render

## 📋 Configuração Completa (Backend + Frontend)

### 🏗️ **Arquitetura do Deploy**

```
┌─────────────────────────────────────────────────────────────┐
│                        RENDER                               │
├─────────────────────────┬───────────────────────────────────┤
│       BACKEND           │            FRONTEND               │
│   (FastAPI Python)      │       (Angular/Ionic)            │
│                         │                                   │
│  • API Routes           │  • SPA Build                      │
│  • Database SQLite      │  • Static Files                   │
│  • CORS configurado     │  • Environment Variables         │
│  • Health Check         │  • Routing SPA                    │
└─────────────────────────┴───────────────────────────────────┘
```

### 📁 **Estrutura de Arquivos para Deploy**

```
PokeAPIApp/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── render.yaml         # Config do Render
│   └── start.sh           # Script de inicialização
├── frontend/
│   ├── angular.json       # Build config
│   ├── package.json
│   └── render-build.sh    # Script de build
├── render.yaml            # Config principal
└── README.md
```

### 🛠️ **Arquivos de Configuração**

#### **1. Backend - render.yaml**
```yaml
services:
  - type: web
    name: pokeapi-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        value: sqlite:///./pokemon_app.db
      - key: ENVIRONMENT
        value: production
      - key: CORS_ORIGINS
        value: "*"
```

#### **2. Frontend - Static Site**
```yaml
services:
  - type: static
    name: pokeapi-frontend
    buildCommand: npm install && npm run build:prod
    staticPublishPath: ./www
    envVars:
      - key: API_URL
        value: https://pokeapi-backend.onrender.com
```

### 🔧 **Configuração do Environment**

#### **Backend Environment Variables**
- `DATABASE_URL`: sqlite:///./pokemon_app.db
- `ENVIRONMENT`: production
- `CORS_ORIGINS`: *
- `PORT`: (automático do Render)

#### **Frontend Environment Variables**
- `API_URL`: https://pokeapi-backend.onrender.com

### 🚀 **Processo de Deploy**

1. **Push para GitHub** (trigger automático)
2. **Backend Build**: Instala dependencies Python
3. **Frontend Build**: Build Angular/Ionic
4. **Deploy**: Ambos sobem simultaneamente
5. **Health Check**: Verifica se estão funcionando
6. **URL Final**: https://pokeapi-frontend.onrender.com

---

## 🎯 **Próximos Passos**

1. ✅ Configurar arquivos de deploy
2. ✅ Atualizar environments
3. ✅ Criar conta no Render
4. ✅ Conectar repositório GitHub
5. ✅ Configurar services no Render
6. ✅ Fazer deploy e testar

**🌐 Resultado**: Aplicação fullstack completa online!
