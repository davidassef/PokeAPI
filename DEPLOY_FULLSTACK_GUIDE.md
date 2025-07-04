# 🚀 Guia Completo: Deploy Fullstack (Backend + Frontend)

## 🎯 **Objetivo**
Configurar deploy completo do PokeAPIApp com backend (FastAPI) e frontend (Angular/Ionic) usando **Render** ou **Railway**.

---

## 📋 **Opção 1: Deploy no Render**

### **🔧 Pré-requisitos**
- ✅ Conta no [Render](https://render.com)
- ✅ Repositório no GitHub
- ✅ Arquivos de configuração prontos

### **🚀 Passo a Passo**

#### **1. Deploy do Backend (FastAPI)**
1. **Criar Web Service**:
   - Vá para Render Dashboard
   - Clique em "New+" → "Web Service"
   - Conecte seu repositório GitHub
   - Selecione `PokeAPIApp`

2. **Configurar Backend**:
   - **Name**: `pokeapi-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend` ⚠️ **IMPORTANTE**
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables**:
   ```
   DATABASE_URL=sqlite:///./pokemon_app.db
   ENVIRONMENT=production
   CORS_ORIGINS=*
   PYTHONPATH=/opt/render/project/src
   ```

4. **Health Check**:
   - **Health Check Path**: `/health`

5. **Deploy**: Clique em "Create Web Service"

#### **2. Deploy do Frontend (Angular/Ionic)**
1. **Criar Static Site**:
   - Clique em "New+" → "Static Site"
   - Conecte o mesmo repositório
   - Selecione `PokeAPIApp`

2. **Configurar Frontend**:
   - **Name**: `pokeapi-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend` ⚠️ **IMPORTANTE**
   - **Build Command**: `npm install && npm run build:prod`
   - **Publish Directory**: `www`

3. **Environment Variables**:
   ```
   API_URL=https://pokeapi-backend.onrender.com
   NODE_ENV=production
   ```

4. **Deploy**: Clique em "Create Static Site"

#### **3. Configurar Redirecionamento SPA**
1. **Arquivo _redirects**:
   ```
   /*    /index.html   200
   ```

2. **Adicionar ao build**:
   - Arquivo será criado automaticamente

---

## 📋 **Opção 2: Deploy no Railway**

### **🔧 Pré-requisitos**
- ✅ Conta no [Railway](https://railway.app)
- ✅ Repositório no GitHub
- ✅ Arquivos de configuração prontos

### **🚀 Passo a Passo**

#### **1. Deploy do Backend (FastAPI)**
1. **Criar Projeto**:
   - Vá para Railway Dashboard
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Conecte `PokeAPIApp`

2. **Configurar Backend Service**:
   - **Root Directory**: `/backend`
   - **Runtime**: Python
   - **Deploy Command**: Automático

3. **Environment Variables**:
   ```
   DATABASE_URL=sqlite:///./pokemon_app.db
   ENVIRONMENT=production
   CORS_ORIGINS=*
   PYTHONPATH=/app/backend
   ```

4. **Deploy**: Automático após configuração

#### **2. Deploy do Frontend (Angular/Ionic)**
1. **Criar Segundo Service**:
   - No mesmo projeto, clique em "New Service"
   - Selecione "GitHub Repo"
   - Conecte o mesmo repositório

2. **Configurar Frontend Service**:
   - **Root Directory**: `/frontend`
   - **Runtime**: Node.js
   - **Build Command**: `npm install && npm run build:prod`
   - **Start Command**: `npm run serve:prod`

3. **Environment Variables**:
   ```
   API_URL=https://pokeapi-backend.railway.app
   NODE_ENV=production
   ```

4. **Deploy**: Automático após configuração

---

## 🔧 **Configurações Adicionais**

### **🌐 URLs Finais**

#### **Render**:
- **Backend**: `https://pokeapi-backend.onrender.com`
- **Frontend**: `https://pokeapi-frontend.onrender.com`
- **API Docs**: `https://pokeapi-backend.onrender.com/docs`

#### **Railway**:
- **Backend**: `https://pokeapi-backend.railway.app`
- **Frontend**: `https://pokeapi-frontend.railway.app`
- **API Docs**: `https://pokeapi-backend.railway.app/docs`

### **🔄 Deploy Automático**
- ✅ **Trigger**: Push para branch `main`
- ✅ **Backend**: Restart automático
- ✅ **Frontend**: Rebuild automático
- ✅ **Zero Downtime**: Deploy rolling

### **📊 Monitoramento**
- **Health Check**: `/health` endpoint
- **Logs**: Disponível nos dashboards
- **Metrics**: CPU, Memory, Requests
- **Alerts**: Configuráveis

---

## 🎉 **Teste da Aplicação**

### **✅ Checklist Final**
- [ ] Backend respondendo: `GET /health`
- [ ] Frontend carregando: URL principal
- [ ] API conectada: Teste de endpoints
- [ ] CORS configurado: Sem erros no console
- [ ] Database funcionando: Teste de cadastro
- [ ] Routing SPA: Navegação entre páginas

### **🧪 Endpoints de Teste**
```bash
# Backend Health Check
curl https://pokeapi-backend.onrender.com/health

# API Root
curl https://pokeapi-backend.onrender.com/

# Frontend
curl https://pokeapi-frontend.onrender.com/
```

---

## 🔧 **Troubleshooting**

### **❌ Problemas Comuns**

1. **Backend não inicia**:
   - Verificar variáveis de ambiente
   - Checar logs de build
   - Confirmar requirements.txt

2. **Frontend 404**:
   - Verificar build command
   - Confirmar pasta `www/`
   - Checar redirects SPA

3. **CORS Error**:
   - Verificar `CORS_ORIGINS`
   - Confirmar URL do backend
   - Testar endpoints diretamente

4. **Database Error**:
   - Verificar `DATABASE_URL`
   - Confirmar criação das tabelas
   - Checar logs do SQLite

### **🔍 Debug Commands**
```bash
# Local build test
cd frontend && npm run build:prod
cd backend && pip install -r requirements.txt

# Local server test
cd backend && uvicorn main:app --reload
cd frontend && npx serve -s www
```

---

## 🎯 **Resultado Final**

Uma aplicação **fullstack completa** com:
- 🚀 **Backend FastAPI** com API REST completa
- 🎨 **Frontend Angular/Ionic** responsivo
- 🔄 **Deploy automático** a cada push
- 📊 **Monitoramento** em tempo real
- 🌐 **URLs públicas** para acesso

**🎉 Sua aplicação estará online e pronta para uso!**
