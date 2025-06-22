# 🛠️ Guia de Configuração de Desenvolvimento - PokeAPI App

## 📋 Pré-requisitos

### Sistema Operacional
- **Windows 10/11**, **macOS 10.15+**, ou **Linux Ubuntu 18.04+**

### Ferramentas Obrigatórias

#### Node.js e npm
```bash
# Instalar Node.js LTS (versão 18+)
# Download: https://nodejs.org/

# Verificar instalação
node --version  # v18.17.0+
npm --version   # 9.6.7+
```

#### Python
```bash
# Instalar Python 3.9+
# Download: https://python.org/

# Verificar instalação
python --version  # 3.9.0+
pip --version     # 23.0+
```

#### Git
```bash
# Instalar Git
# Download: https://git-scm.com/

# Verificar instalação
git --version  # 2.40.0+
```

### Ferramentas Recomendadas

#### Visual Studio Code
```bash
# Download: https://code.visualstudio.com/
# Extensões recomendadas:
- Angular Language Service
- Ionic Extension Pack
- Python Extension Pack
- GitLens
- Thunder Client (para testar APIs)
```

#### Ionic CLI
```bash
# Instalar globalmente
npm install -g @ionic/cli @angular/cli

# Verificar instalação
ionic --version   # 7.0.0+
ng version        # 17.0.0+
```

## 🚀 Configuração do Projeto

### 1. Clone do Repositório
```bash
# Clonar o projeto
git clone https://github.com/seu-usuario/pokeapi-app.git
cd pokeapi-app
```

### 2. Configuração do Frontend (Ionic + Angular)

```bash
# Navegar para o diretório frontend
cd pokeapp

# Instalar dependências
npm install

# Verificar se não há vulnerabilidades
npm audit

# Corrigir vulnerabilidades (se houver)
npm audit fix
```

#### Configuração de Ambiente
```bash
# Criar arquivo de ambiente local (opcional)
cp src/environments/environment.ts src/environments/environment.local.ts

# Editar configurações locais se necessário
```

#### Variáveis de Ambiente Frontend
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
  pokeApiUrl: 'https://pokeapi.co/api/v2',
  enableDevTools: true,
  cacheTimeout: 300000 // 5 minutos
};
```

### 3. Configuração do Backend (FastAPI)

```bash
# Navegar para o diretório backend
cd ../backend

# Criar ambiente virtual Python
python -m venv venv

# Ativar ambiente virtual
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Verificar instalação
pip list
```

#### Configuração do Banco de Dados
```bash
# O SQLite será criado automaticamente na primeira execução
# Para PostgreSQL (produção), configure a variável DATABASE_URL
```

#### Variáveis de Ambiente Backend
```bash
# Criar arquivo .env na raiz do backend
touch .env

# Adicionar configurações
DATABASE_URL=sqlite:///./pokeapi_app.db
SECRET_KEY=sua-chave-secreta-muito-segura
CORS_ORIGINS=http://localhost:8100,http://localhost:4200
DEBUG=True
```

## 🔧 Scripts de Desenvolvimento

### Frontend (Ionic)

#### Comandos Básicos
```bash
# Modo desenvolvimento com hot reload
npm start
# ou
ionic serve

# Build para produção
npm run build

# Testes unitários
npm test

# Testes E2E
npm run e2e

# Linting
npm run lint

# Formatação de código
npm run format
```

#### Comandos Mobile
```bash
# Adicionar plataforma iOS (requer macOS + Xcode)
ionic cap add ios

# Adicionar plataforma Android (requer Android Studio)
ionic cap add android

# Build e sync com capacitor
ionic cap build

# Executar em dispositivo/emulador
ionic cap run ios
ionic cap run android

# Abrir IDE nativa
ionic cap open ios
ionic cap open android
```

### Backend (FastAPI)

#### Comandos Básicos
```bash
# Servidor de desenvolvimento
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Testes
pytest

# Testes com coverage
pytest --cov=app tests/

# Formatação de código
black .
isort .

# Linting
flake8 .
```

## 📱 Configuração Mobile (Capacitor)

### Pré-requisitos Adicionais

#### Para iOS (apenas macOS)
```bash
# Instalar Xcode via App Store
# Instalar Xcode Command Line Tools
xcode-select --install

# Instalar CocoaPods
sudo gem install cocoapods
```

#### Para Android
```bash
# Download Android Studio: https://developer.android.com/studio
# Instalar Android SDK e ferramentas via Android Studio

# Configurar variáveis de ambiente
export ANDROID_HOME=/path/to/android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Configuração do Capacitor

```bash
# Na pasta do frontend (pokeapp)
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android

# Inicializar Capacitor
npx cap init

# Configurar capacitor.config.ts
```

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pokeapi.app',
  appName: 'PokeAPI App',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Erro de permissões npm (Windows)
```bash
# Executar como administrador ou configurar pasta global
npm config set prefix "C:\Users\%USERNAME%\AppData\Roaming\npm"
```

#### 2. Erro de certificado SSL
```bash
# Desabilitar verificação SSL (apenas desenvolvimento)
npm config set strict-ssl false
```

#### 3. Porta já em uso
```bash
# Frontend (mudar porta)
ionic serve --port 8101

# Backend (mudar porta)
uvicorn main:app --reload --port 8001
```

#### 4. Problemas com Python virtual environment
```bash
# Recriar ambiente virtual
rm -rf venv
python -m venv venv
# Reativar e reinstalar dependências
```

#### 5. Erro de CORS no desenvolvimento
```bash
# Verificar configuração do backend
# Adicionar origins do frontend no main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8100", "http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🔄 Fluxo de Desenvolvimento

### 1. Inicialização Diária
```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate  # ou venv\Scripts\activate no Windows
uvicorn main:app --reload

# Terminal 2: Frontend  
cd pokeapp
npm start
```

### 2. Desenvolvimento com Hot Reload
- **Frontend**: http://localhost:8100 (auto-reload em mudanças)
- **Backend**: http://localhost:8000 (auto-reload em mudanças)
- **API Docs**: http://localhost:8000/docs (Swagger automático)

### 3. Testes Durante Desenvolvimento
```bash
# Frontend - executar testes em watch mode
npm run test:watch

# Backend - executar testes específicos
pytest tests/test_favorites.py -v
```

## 📊 Monitoramento e Debug

### Frontend (Angular DevTools)
```bash
# Instalar extensão Angular DevTools no navegador
# Chrome: https://chrome.google.com/webstore/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh

# Habilitar modo debug
localStorage.setItem('debug', 'true');
```

### Backend (FastAPI Debug)
```python
# Habilitar logs detalhados em development
import logging
logging.basicConfig(level=logging.DEBUG)

# Usar debugger
import pdb; pdb.set_trace()
```

### Logs e Monitoramento
```bash
# Frontend - console do navegador
console.log('Debug info:', data);

# Backend - logs estruturados
import logging
logger = logging.getLogger(__name__)
logger.info("Processing request", extra={"user_id": user_id})
```

## 🎯 Performance e Otimização

### Frontend
```bash
# Análise de bundle
npm run build -- --stats-json
npx webpack-bundle-analyzer dist/stats.json

# Lighthouse audit
npm install -g lighthouse
lighthouse http://localhost:8100 --output html
```

### Backend
```bash
# Profiling com cProfile
python -m cProfile -o profile.stats main.py

# Análise de queries SQL
# Habilitar echo=True no SQLAlchemy para ver queries
```

## 📚 Recursos Adicionais

### Documentação Oficial
- [Ionic Documentation](https://ionicframework.com/docs)
- [Angular Documentation](https://angular.io/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Capacitor Documentation](https://capacitorjs.com/docs)

### Ferramentas Úteis
- [PokeAPI Explorer](https://pokeapi.co/)
- [Ionic Creator](https://creator.ionic.io/)
- [Angular CLI](https://cli.angular.io/)
- [SQLite Browser](https://sqlitebrowser.org/)

---

**⚡ Dica**: Use o VS Code com as extensões recomendadas para uma experiência de desenvolvimento otimizada!

**🆘 Problemas?** Consulte a seção de troubleshooting ou abra uma issue no repositório.
