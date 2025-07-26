# 🚀 PokeAPIApp - Guia de Deploy

🗓️ **Última atualização**: 11/07/2025
📋 **Status**: Guia completo de deploy para produção

---

## 🎯 Visão Geral

Este guia abrange estratégias de deploy para ambientes de desenvolvimento e produção, incluindo containerização, deploy em nuvem e configuração de CI/CD.

## 🔧 Pré-requisitos


- **Node.js** 18+ e **Python** 3.9+
- **Git** para controle de versão
- Conta em provedor de nuvem (opcional)

## Environment Configuration

### Environment Variables

Create `.env` files for each environment:

#### Backend `.env`
```env
# Database
DATABASE_URL=sqlite:///./data/pokemon_app.db
DATABASE_URL_PROD=postgresql://user:pass@host:port/dbname

# Security
SECRET_KEY=your-super-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS
CORS_ORIGINS=["http://localhost:8100", "https://yourdomain.com"]

# External APIs
POKEAPI_BASE_URL=https://pokeapi.co/api/v2

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# Environment
ENVIRONMENT=production
DEBUG=false
```

#### Frontend `environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com',
  appName: 'PokeAPIApp',
  version: '1.0.0',
  enableAnalytics: true,
  enableLogging: false
};
```

## Local Development Setup

### Manual Setup

```bash
# Clone and setup
git clone https://github.com/davidassef/PokeAPI.git
cd PokeAPI

# Setup manually
# Backend
cd backend
pip install -r requirements.txt
python scripts/migrate_rbac_schema.py
uvicorn main:app --reload

# Frontend (new terminal)
cd frontend
npm install
ng serve
```

## Production Deployment

### Option 1: Traditional Server Deployment

#### Backend Deployment (Ubuntu/CentOS)

```bash
# 1. Server setup
sudo apt update
sudo apt install python3 python3-pip nginx supervisor

# 2. Application setup
git clone https://github.com/davidassef/PokeAPI.git
cd PokeAPIApp/backend

# 3. Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. Database setup
python scripts/migrate_rbac_schema.py

# 5. Gunicorn configuration
pip install gunicorn
```

**Gunicorn config (`gunicorn.conf.py`):**
```python
bind = "0.0.0.0:8000"
workers = 4
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True
```

**Supervisor config (`/etc/supervisor/conf.d/pokeapi.conf`):**
```ini
[program:pokeapi-backend]
command=/path/to/venv/bin/gunicorn main:app -c gunicorn.conf.py
directory=/path/to/PokeAPIApp/backend
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/pokeapi-backend.log
```

#### Frontend Deployment

```bash
# 1. Build for production
cd frontend
npm install
ng build --configuration=production

# 2. Copy to web server
sudo cp -r dist/* /var/www/html/

# 3. Nginx configuration
sudo nano /etc/nginx/sites-available/pokeapi
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/html;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### Option 2: Cloud Platform Deployment

#### Railway Deployment

**Backend (`railway.json`):**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "gunicorn main:app -c gunicorn.conf.py",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Frontend (Netlify `_redirects`):**
```
# SPA routing
/*    /index.html   200

# API proxy
/api/*  https://your-backend-url.railway.app/api/:splat  200
```

#### Heroku Deployment

**Backend (`Procfile`):**
```
web: gunicorn main:app -c gunicorn.conf.py
release: python scripts/migrate_rbac_schema.py
```

**Frontend (Build settings):**
```bash
# Build command
npm run build --prod

# Publish directory
dist
```

#### Vercel Deployment

**Frontend (`vercel.json`):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend-url.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy PokeAPIApp

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt

      - name: Run tests
        run: |
          cd backend
          pytest tests/ -v --cov=app

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Run tests
        run: |
          cd frontend
          npm run test:ci

      - name: Build
        run: |
          cd frontend
          npm run build --prod

  deploy-backend:
    needs: [test-backend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway
        uses: railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend

  deploy-frontend:
    needs: [test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Netlify
        uses: netlify/actions/build@master
        with:
          publish-dir: frontend/dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Monitoring and Logging

### Application Monitoring

```python
# backend/monitoring.py
import logging
import time
from fastapi import Request
from prometheus_client import Counter, Histogram, generate_latest

# Metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')

async def monitor_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    REQUEST_DURATION.observe(duration)

    return response
```

### Log Configuration

```python
# backend/logging_config.py
import logging.config

LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'default': {
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        },
        'json': {
            'format': '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'default',
            'level': 'INFO',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/app.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'json',
            'level': 'INFO',
        },
    },
    'root': {
        'level': 'INFO',
        'handlers': ['console', 'file'],
    },
}

logging.config.dictConfig(LOGGING_CONFIG)
```

## Security Considerations

### SSL/TLS Configuration

```nginx
# SSL configuration for Nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.com.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Your application configuration...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Environment Security

```bash
# Set secure file permissions
chmod 600 .env
chmod 600 backend/.env
chmod 600 frontend/src/environments/environment.prod.ts

# Use secrets management
export SECRET_KEY=$(openssl rand -hex 32)
export JWT_SECRET_KEY=$(openssl rand -hex 32)
```

## Backup and Recovery

### Database Backup

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_FILE="/app/data/pokemon_app.db"

# Create backup
cp $DB_FILE $BACKUP_DIR/pokemon_app_$DATE.db

# Compress backup
gzip $BACKUP_DIR/pokemon_app_$DATE.db

# Remove backups older than 30 days
find $BACKUP_DIR -name "pokemon_app_*.db.gz" -mtime +30 -delete

echo "Backup completed: pokemon_app_$DATE.db.gz"
```

### Automated Backup (Cron)

```bash
# Add to crontab
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

## Performance Optimization

### Backend Optimizations

```python
# backend/performance.py
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache

# Initialize cache
FastAPICache.init(RedisBackend(url="redis://localhost"), prefix="pokeapi-cache")

# Cache expensive operations
@cache(expire=3600)  # 1 hour cache
async def get_pokemon_list():
    # Expensive database query
    pass
```

### Frontend Optimizations

```typescript
// frontend/src/app/core/interceptors/cache.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // Add cache headers for static resources
    if (req.url.includes('/api/v1/pokemon/')) {
      const cachedReq = req.clone({
        setHeaders: {
          'Cache-Control': 'max-age=3600'
        }
      });
      return next.handle(cachedReq);
    }

    return next.handle(req);
  }
}
```

This deployment guide provides comprehensive instructions for deploying PokeAPIApp in various environments, from local development to production cloud platforms.
