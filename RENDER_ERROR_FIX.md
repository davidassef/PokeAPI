# 🚨 CORREÇÃO: Erro "No such file or directory: requirements.txt"

## 🔍 **Problema Identificado**
```
ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'requirements.txt'
```

O Render está executando o build command na raiz do projeto, mas o `requirements.txt` está na pasta `backend`.

---

## ✅ **Solução Imediata**

### **🎯 Opção 1: Reconfigurar Service Existente**

1. **Vá para o Dashboard do Render**
2. **Clique no service que falhou**
3. **Vá para "Settings"**
4. **Configure:**
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Clique em "Save Changes"**
6. **Faça um novo deploy**

### **🎯 Opção 2: Criar Novo Service (Recomendado)**

1. **Delete o service atual**:
   - Settings → Danger Zone → Delete Service

2. **Crie novo Backend Service**:
   - **Type**: Web Service
   - **Repository**: PokeAPIApp
   - **Name**: `pokeapi-backend`
   - **Root Directory**: `backend` ⚠️ **CRÍTICO**
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables**:
   ```
   DATABASE_URL=sqlite:///./pokemon_app.db
   ENVIRONMENT=production
   CORS_ORIGINS=*
   ```

4. **Crie Frontend Service**:
   - **Type**: Static Site
   - **Repository**: PokeAPIApp
   - **Name**: `pokeapi-frontend`
   - **Root Directory**: `frontend` ⚠️ **CRÍTICO**
   - **Build Command**: `npm install && npm run build:prod`
   - **Publish Directory**: `www`

---

## 📋 **Configuração Correta Passo a Passo**

### **🔧 Backend Service**
```
Name: pokeapi-backend
Type: Web Service
Repository: davidassef/PokeAPI
Branch: main
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### **🎨 Frontend Service**
```
Name: pokeapi-frontend
Type: Static Site
Repository: davidassef/PokeAPI
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build:prod
Publish Directory: www
```

---

## 🛠️ **Environment Variables**

### **Backend:**
```
DATABASE_URL=sqlite:///./pokemon_app.db
ENVIRONMENT=production
CORS_ORIGINS=*
```

### **Frontend:**
```
API_URL=https://pokeapi-backend.onrender.com
```

---

## ⚠️ **Pontos Críticos**

1. **Root Directory é OBRIGATÓRIO**:
   - Backend: `backend`
   - Frontend: `frontend`

2. **Não use comandos com `cd`**:
   - ❌ `cd backend && pip install`
   - ✅ Use Root Directory + comando direto

3. **Paths relativos após Root Directory**:
   - O Render já está no diretório correto
   - Use apenas o comando necessário

---

## 🧪 **Teste de Configuração**

Após configurar, os logs devem mostrar:
```
==> Using root directory: backend
==> Running build command 'pip install -r requirements.txt'...
Successfully installed fastapi uvicorn...
==> Running start command...
INFO: Started server process
INFO: Application startup complete.
```

---

## 🎯 **URLs Finais**

Após deploy bem-sucedido:
- **Backend**: `https://pokeapi-backend.onrender.com`
- **Frontend**: `https://pokeapi-frontend.onrender.com`
- **Health Check**: `https://pokeapi-backend.onrender.com/health`

---

## 📞 **Se Ainda Não Funcionar**

1. **Verifique os logs completos**
2. **Confirme a estrutura do repositório**
3. **Teste build local**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

**🚀 Com essa configuração, o deploy deve funcionar perfeitamente!**
