<div align="center">

# 🎮 PokeAPIApp v1.5
### Pokédex Responsiva Completa

[![Version](https://img.shields.io/badge/Version-1.5-blue.svg)](https://github.com/davidassef/PokeAPI)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](https://pokeapi-la6k.onrender.com/health)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-17.x-red.svg)](https://angular.io/)
[![Ionic](https://img.shields.io/badge/Ionic-7.x-blue.svg)](https://ionicframework.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.x-green.svg)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-Playwright%20E2E-brightgreen.svg)](https://github.com/davidassef/PokeAPI)

**Uma aplicação web/mobile completa para explorar, capturar e gerenciar Pokémon**
*Interface responsiva • Sistema de autenticação robusto • Testes E2E automatizados*

</div>

---

## 🚀 Acesso Rápido à Aplicação

<div align="center">

### 🌐 **[ACESSAR APLICAÇÃO EM PRODUÇÃO](https://pokeapi-frontend.onrender.com)**

[![Frontend Status](https://img.shields.io/badge/Frontend-Online-brightgreen.svg)](https://pokeapi-frontend.onrender.com)
[![Backend Status](https://img.shields.io/badge/Backend-Online-brightgreen.svg)](https://pokeapi-la6k.onrender.com/health)

### 🔑 Credenciais de Teste
| Campo | Valor |
|-------|-------|
| **📧 Email** | `davidassef@gmail.com` |
| **🔒 Senha** | `Senha123` |

</div>

## 📸 Preview da Aplicação

<div align="center">

### 💻 Interface Web (Desktop)

<table>
  <tr>
    <td align="center">
      <strong>🏠 Home - Tema Claro</strong><br/>
      <a href="https://github.com/davidassef/PokeAPI/blob/main/frontend/src/assets/img/Home-Web-Light-Theme.png">
        <img src="https://github.com/davidassef/PokeAPI/raw/main/frontend/src/assets/img/Home-Web-Light-Theme.png" alt="Home Tema Claro" width="300"/>
      </a>
    </td>
    <td align="center">
      <strong>🌙 Home - Tema Escuro</strong><br/>
      <a href="https://github.com/davidassef/PokeAPI/blob/main/frontend/src/assets/img/Home-Web-Dark-Theme.png">
        <img src="https://github.com/davidassef/PokeAPI/raw/main/frontend/src/assets/img/Home-Web-Dark-Theme.png" alt="Home Tema Escuro" width="300"/>
      </a>
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>📋 Modal - Tema Claro</strong><br/>
      <a href="https://github.com/davidassef/PokeAPI/blob/main/frontend/src/assets/img/Modal-Details-Web-Light-Theme.png">
        <img src="https://github.com/davidassef/PokeAPI/raw/main/frontend/src/assets/img/Modal-Details-Web-Light-Theme.png" alt="Modal Tema Claro" width="300"/>
      </a>
    </td>
    <td align="center">
      <strong>🌑 Modal - Tema Escuro</strong><br/>
      <a href="https://github.com/davidassef/PokeAPI/blob/main/frontend/src/assets/img/Modal-Details-Web-Dark-Theme.png">
        <img src="https://github.com/davidassef/PokeAPI/raw/main/frontend/src/assets/img/Modal-Details-Web-Dark-Theme.png" alt="Modal Tema Escuro" width="300"/>
      </a>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2">
      <strong>🏆 Sistema de Rankings</strong><br/>
      <a href="https://github.com/davidassef/PokeAPI/blob/main/frontend/src/assets/img/Ranking-Web.png">
        <img src="https://github.com/davidassef/PokeAPI/raw/main/frontend/src/assets/img/Ranking-Web.png" alt="Sistema de Rankings" width="400"/>
      </a>
    </td>
  </tr>
</table>

### 📱 Interface Mobile

<table>
  <tr>
    <td align="center">
      <strong>📱 Home Mobile - Tema Claro</strong><br/>
      <a href="https://github.com/davidassef/PokeAPI/blob/main/frontend/src/assets/img/Home-Mobile-Light-Theme.png">
        <img src="https://github.com/davidassef/PokeAPI/raw/main/frontend/src/assets/img/Home-Mobile-Light-Theme.png" alt="Home Mobile Tema Claro" width="200"/>
      </a>
    </td>
    <td align="center">
      <strong>🌙 Home Mobile - Tema Escuro</strong><br/>
      <a href="https://github.com/davidassef/PokeAPI/blob/main/frontend/src/assets/img/Home-Mobile-Dark-Theme.png">
        <img src="https://github.com/davidassef/PokeAPI/raw/main/frontend/src/assets/img/Home-Mobile-Dark-Theme.png" alt="Home Mobile Tema Escuro" width="200"/>
      </a>
    </td>
    <td align="center">
      <strong>📋 Modal Mobile - Tema Escuro</strong><br/>
      <a href="https://github.com/davidassef/PokeAPI/blob/main/frontend/src/assets/img/Modal-Details-Mobile-Dark-Theme.png">
        <img src="https://github.com/davidassef/PokeAPI/raw/main/frontend/src/assets/img/Modal-Details-Mobile-Dark-Theme.png" alt="Modal Mobile Tema Escuro" width="200"/>
      </a>
    </td>
  </tr>
</table>

*📌 Clique nas imagens para visualizar em tamanho completo*

</div>

## ⚡ Quick Start para Desenvolvedores

<div align="center">

### 🛠️ Setup Rápido em 3 Passos

</div>

**1️⃣ Clone e Configuração Inicial**
```bash
git clone https://github.com/davidassef/PokeAPI.git
cd PokeAPI_SYNC
```

**2️⃣ Backend (FastAPI)**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

**3️⃣ Frontend (Angular/Ionic) - Novo Terminal**
```bash
cd frontend
npm install
ng serve
```

<div align="center">

### 🌐 URLs de Acesso Local
| Serviço | URL | Descrição |
|---------|-----|-----------|
| **🎨 Frontend** | http://localhost:8100 | Interface da aplicação |
| **⚙️ Backend** | http://localhost:8000 | API REST |
| **📚 Docs API** | http://localhost:8000/docs | Swagger interativo |

</div>

## 🛠️ Stack Tecnológico Principal

<div align="center">

### 🏗️ Arquitetura Moderna e Robusta

</div>

| 🎯 Categoria | 🚀 Tecnologia | 📊 Versão | 💡 Propósito |
|-------------|---------------|-----------|-------------|
| **🎨 Frontend** | Angular + Ionic | 17.x + 7.x | Interface responsiva web/mobile |
| **⚙️ Backend** | FastAPI | 0.104.x | API REST de alta performance |
| **💻 Linguagens** | TypeScript + Python | 5.x + 3.11+ | Desenvolvimento type-safe |
| **☁️ Deploy** | Render | - | Hospedagem em produção |
| **🧪 Testes** | Playwright E2E | Latest | Testes end-to-end automatizados |
| **💾 Database** | SQLite + SQLAlchemy | 3.x + 2.x | Persistência de dados |

---

## 📚 Documentação Técnica Completa

<details>
<summary><strong>📖 Documentos Disponíveis</strong></summary>

### **Documentação Principal**
- 📋 **README.md**: Este arquivo (visão geral)
- 📚 **[DOCUMENTACAO_TECNICA_COMPLETA.md](./docs/DOCUMENTACAO_TECNICA_COMPLETA.md)**: Documentação técnica detalhada
- 🔧 **API Docs**: http://localhost:8000/docs (Swagger interativo)
- 🧪 **Test Reports**: Relatórios gerados automaticamente

### **Documentação Técnica Específica**
- 🏗️ **[Arquitetura do Sistema](./docs/10_01_ARQUITETURA_SISTEMA.md)**
- 🔐 **[Sistema RBAC](./docs/40_01_SISTEMA_RBAC.md)**
- 🌐 **[Referência da API](./docs/50_01_REFERENCIA_API.md)**
- 🚀 **[Guia de Deploy](./docs/20_02_GUIA_DEPLOY_COMPLETO.md)**
- 📊 **[Sistema de Ranking](./docs/30_01_SISTEMA_RANKING.md)**

</details>

## ⚙️ Configuração Avançada de Ambiente

<details>
<summary><strong>🔧 Configuração Detalhada</strong></summary>

### **Pré-requisitos**
- **Node.js**: 18.x ou superior
- **Python**: 3.11 ou superior
- **npm**: 9.x ou superior
- **Git**: Para clonagem do repositório

### **Variáveis de Ambiente (Backend)**
```bash
# .env file
DEBUG=True
DATABASE_URL=sqlite:///./pokemon_app.db
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:4200
```

### **Configuração de Proxy (Frontend)**
O frontend usa `proxy.conf.json` para redirecionar chamadas da API durante o desenvolvimento.

### **Docker (Alternativo)**
```bash
# Clone o repositório
git clone https://github.com/davidassef/PokeAPI.git
cd PokeAPI_SYNC

# Inicie com Docker Compose
docker-compose up -d

# Acesse a aplicação
# Frontend: http://localhost:4200
# Backend: http://localhost:8000
```

</details>

## 🏗️ Arquitetura do Sistema e Fluxo de Dados

<details>
<summary><strong>🏛️ Visão Arquitetural</strong></summary>

### **Arquitetura Geral**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│  Angular/Ionic  │◄──►│    FastAPI      │◄──►│    SQLite       │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PokéAPI       │    │   JWT Auth      │    │   File Storage  │
│   (Externa)     │    │   + RBAC        │    │   (Uploads)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Padrões Arquiteturais**
- **Frontend**: Component-based architecture com serviços injetáveis
- **Backend**: API RESTful com separação de responsabilidades
- **Database**: Modelo relacional com SQLAlchemy ORM
- **Authentication**: JWT com refresh tokens e RBAC
- **Sync**: Sistema dual (push/pull) para sincronização de dados

### **Fluxo de Dados**
1. **Frontend** faz requisições HTTP para o **Backend**
2. **Backend** autentica via JWT e consulta **Database**
3. **Backend** integra com **PokéAPI** para dados externos
4. **Sincronização** bidirecional mantém consistência

</details>

## 🔌 API Endpoints e Referência Completa

<details>
<summary><strong>🌐 Principais Endpoints</strong></summary>

### **Autenticação**
- `POST /auth/login` - Login de usuário
- `POST /auth/register` - Registro de usuário
- `POST /auth/reset-password` - Reset de senha
- `GET /auth/me` - Dados do usuário atual

### **Pokémon**
- `GET /pokemon` - Lista de Pokémon com paginação
- `GET /pokemon/{id}` - Detalhes de um Pokémon
- `GET /pokemon/search` - Busca de Pokémon

### **Favoritos/Captura**
- `GET /favorites` - Lista de favoritos do usuário
- `POST /favorites/{pokemon_id}` - Adicionar aos favoritos
- `DELETE /favorites/{pokemon_id}` - Remover dos favoritos

### **Rankings**
- `GET /ranking/local` - Ranking local
- `GET /ranking/global` - Ranking global
- `GET /ranking/stats` - Estatísticas de ranking

### **Administração**
- `GET /admin/users` - Lista de usuários (admin)
- `GET /admin/stats` - Estatísticas do sistema (admin)

**📚 Documentação Completa:** http://localhost:8000/docs

</details>

## 🧪 Guias de Testes e Desenvolvimento

<details>
<summary><strong>🎯 Suite de Testes Completa</strong></summary>

### **Frontend (Angular/Ionic)**
```bash
cd frontend

# Testes unitários
npm run test

# Testes com cobertura
npm run test:coverage

# Testes E2E com Playwright
npm run e2e

# Testes específicos de autenticação
node scripts/run-auth-tests.js
```

### **Backend (FastAPI)**
```bash
cd backend

# Todos os testes
pytest

# Testes com cobertura
pytest --cov=app --cov-report=html

# Testes específicos
pytest tests/test_auth.py -v
```

### **Cobertura de Testes**
| Categoria | Cobertura | Status |
|-----------|-----------|--------|
| **Frontend Unitários** | 95%+ | ✅ Excelente |
| **Backend Unitários** | 90%+ | ✅ Excelente |
| **Integração API** | 100% | ✅ Completo |
| **E2E Críticos** | 100% | ✅ Completo |
| **Autenticação** | 95%+ | ✅ Robusto |

</details>

## 🐛 Troubleshooting e Problemas Conhecidos

<details>
<summary><strong>🔧 Soluções para Problemas Comuns</strong></summary>

### **Problemas de Instalação**
- **Node.js versão incompatível**: Use Node.js 18.x ou superior
- **Erro de permissão npm**: Execute `npm config set prefix ~/.npm-global`
- **Python não encontrado**: Certifique-se de ter Python 3.11+ instalado

### **Problemas de Execução**
- **Porta já em uso**: Altere as portas em `angular.json` e `main.py`
- **CORS Error**: Verifique configuração em `proxy.conf.json`
- **Database locked**: Feche outras instâncias da aplicação

### **Problemas de Deploy**
- **Build falha**: Execute `npm run build` localmente primeiro
- **Environment variables**: Configure todas as variáveis necessárias
- **Health check falha**: Verifique se o backend está respondendo

### **Performance**
- **Carregamento lento**: Ative cache do navegador
- **Imagens não carregam**: Verifique conexão com PokéAPI
- **Modal lento**: Limpe cache do navegador

</details>

## 📝 Changelog Detalhado e Histórico de Versões

<details>
<summary><strong>🗓️ Histórico de Versões</strong></summary>

### **v1.5.0** (Atual)
- ✅ Sistema completo de favoritos implementado
- ✅ Limpeza de logs com LoggerService centralizado
- ✅ Correção do carregamento duplo das abas do modal
- ✅ Suite completa de testes E2E com Playwright
- ✅ Otimizações de performance e UX

### **v1.4.0**
- ✅ Sistema de captura otimizado (50% mais rápido)
- ✅ Páginas mobile dedicadas com paridade completa
- ✅ Sistema de rankings local e global
- ✅ Internacionalização completa (pt-BR, en-US, es-ES, ja-JP)

### **v1.3.0**
- ✅ Sistema de autenticação JWT com RBAC
- ✅ Modal de detalhes mobile corrigido
- ✅ Sistema de temas dark/light
- ✅ Integração com PokéAPI otimizada

### **v1.2.0**
- ✅ Interface responsiva web/mobile
- ✅ Sistema de busca e filtros avançados
- ✅ Componentes Ionic implementados
- ✅ Arquitetura modular estabelecida

### **v1.1.0**
- ✅ Backend FastAPI implementado
- ✅ Database SQLite com SQLAlchemy
- ✅ API endpoints básicos
- ✅ Sistema de autenticação básico

### **v1.0.0**
- ✅ Frontend Angular/Ionic inicial
- ✅ Integração básica com PokéAPI
- ✅ Lista e detalhes de Pokémon
- ✅ Estrutura do projeto estabelecida

</details>

---

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia o [guia de contribuição](CONTRIBUTING.md) antes de submeter pull requests.

### **Como Contribuir**
1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### **Contato**
- 👨‍💻 **Desenvolvedor**: David Assef Carneiro
- 📧 **Email**: davidassef@gmail.com
- 🐙 **GitHub**: [@davidassef](https://github.com/davidassef)

## 📄 Licença e Disclaimers

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

### **Uso da PokeAPI**
Este projeto utiliza dados da [PokeAPI](https://pokeapi.co/), uma API RESTful gratuita para dados de Pokémon. Este é um projeto **não-comercial/educacional** que respeita os termos de uso da PokeAPI.

### **Créditos**
- **PokeAPI**: Dados de Pokémon fornecidos por [PokeAPI.co](https://pokeapi.co/)
- **Pokémon**: © Nintendo/Game Freak/Creatures Inc.
- **Desenvolvedor**: David Assef Carneiro

### **Disclaimer**
Este projeto é desenvolvido de forma independente e não possui afiliação oficial com Nintendo, Game Freak ou The Pokémon Company. Pokémon é uma marca registrada da Nintendo.

---

<div align="center">

**⭐ Se este projeto foi útil, considere dar uma estrela no GitHub!**

**🎮 Desenvolvido com ❤️ por [David Assef](https://github.com/davidassef)**

[![GitHub stars](https://img.shields.io/github/stars/davidassef/PokeAPI.svg?style=social&label=Star)](https://github.com/davidassef/PokeAPI)

