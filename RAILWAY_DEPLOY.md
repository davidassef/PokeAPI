# Railway Deployment Configuration

## 🚀 Backend Service (FastAPI)

### Configuração
- **Runtime**: Python 3.11
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Root Directory**: `/backend`

### Environment Variables
```
DATABASE_URL=sqlite:///./pokemon_app.db
ENVIRONMENT=production
CORS_ORIGINS=*
PYTHONPATH=/app/backend
```

### Health Check
- **Path**: `/health`
- **Method**: GET

---

## 🎨 Frontend Service (Angular/Ionic)

### Configuração
- **Runtime**: Node.js 18
- **Build Command**: `npm install && npm run build:prod`
- **Start Command**: `npx serve -s www -p $PORT`
- **Root Directory**: `/frontend`

### Environment Variables
```
API_URL=https://pokeapi-backend.railway.app
NODE_ENV=production
```

### Static Files
- **Output Directory**: `www/`
- **SPA Mode**: Enabled

---

## 🔧 railway.json Configuration

```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "always"
  }
}
```

---

## 🛠️ Deploy Process

### Manual Steps:
1. **Create Railway Account**
2. **Connect GitHub Repository**
3. **Create Backend Service**
   - Select `/backend` as root directory
   - Add environment variables
   - Deploy
4. **Create Frontend Service**
   - Select `/frontend` as root directory
   - Update `API_URL` with backend URL
   - Deploy
5. **Configure Custom Domain** (optional)

### Automatic Deployment:
- **Trigger**: Push to `main` branch
- **Backend**: Redeploys automatically
- **Frontend**: Rebuilds and redeploys

---

## 🌐 URLs

- **Backend**: https://pokeapi-backend.railway.app
- **Frontend**: https://pokeapi-frontend.railway.app
- **API Docs**: https://pokeapi-backend.railway.app/docs

---

## 📊 Monitoring

- **Backend Health**: https://pokeapi-backend.railway.app/health
- **Frontend Status**: https://pokeapi-frontend.railway.app
- **Railway Dashboard**: Monitor logs and metrics
