# 🐱‍👤 PokeAPIApp - Pokédex Completa e Responsiva

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=for-the-badge)](https://github.com/davidassef/PokeAPI)
[![Frontend](https://img.shields.io/badge/Frontend-Ionic%20+%20Angular-blue?style=for-the-badge&logo=ionic)](https://ionicframework.com/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-red?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Security](https://img.shields.io/badge/Security-RBAC%20Enabled-green?style=for-the-badge&logo=shield)](https://github.com/davidassef/PokeAPI)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%20AA-blue?style=for-the-badge&logo=accessibility)](https://www.w3.org/WAI/WCAG21/quickref/)
[![i18n](https://img.shields.io/badge/i18n-4%20Languages-orange?style=for-the-badge)](https://github.com/davidassef/PokeAPI)

Uma aplicação web/mobile completa para explorar e gerenciar Pokémon, desenvolvida com Angular/Ionic e FastAPI. O projeto oferece experiências otimizadas tanto para desktop quanto para dispositivos móveis, com sistema de autenticação robusto, captura de Pokémon, ranking dinâmico e muito mais.

---

## ✨ Funcionalidades Principais

### 🔐 **Sistema de Autenticação Completo**
- **Login/Registro** com validação robusta
- **Reset de senha** via perguntas secretas (sem necessidade de email)
- **Sistema RBAC** com roles de Administrador e Visitante
- **JWT tokens** com refresh automático
- **Persistência de sessão** entre páginas e recarregamentos

### 🎯 **Captura e Gerenciamento de Pokémon**
- **Captura interativa** com animações e sons
- **Sistema de favoritos** com sincronização em tempo real
- **Gerenciamento de coleção** pessoal
- **Contadores** de Pokémon vistos e capturados
- **Sincronização offline** com armazenamento local

### 📊 **Sistema de Ranking e Estatísticas**
- **Ranking dinâmico** dos Pokémon mais capturados
- **Estatísticas globais** da comunidade
- **Métricas pessoais** de progresso
- **Comparação** entre usuários

### 🎨 **Interface e Experiência do Usuário**
- **Temas claro/escuro** com transições suaves
- **Cores dinâmicas** por página (Home=azul, Capturados=vermelho, Ranking=amarelo)
- **Design responsivo** para web e mobile
- **Modais inteligentes** com hierarquia z-index otimizada
- **Player de música** integrado com controles
- **Animações fluidas** e feedback visual

### 🌍 **Internacionalização (i18n)**
- **4 idiomas** suportados: Português (pt-BR), Inglês (en-US), Espanhol (es-ES), Japonês (ja-JP)
- **Troca instantânea** de idioma
- **Traduções completas** de toda a interface
- **Formatação localizada** de números e datas

### 📱 **Versões Mobile e Web Otimizadas**
- **Páginas separadas** para mobile (`/pages/mobile/`) e web (`/pages/web/`)
- **Detecção automática** de dispositivo
- **Navegação otimizada** para cada plataforma
- **Gestos touch** nativos no mobile
- **Scroll inteligente** com ocultação de headers

### 🛡️ **Sistema RBAC (Role-Based Access Control)**
- **Roles definidos**: Administrador e Visitante
- **Permissões granulares** por funcionalidade
- **Interface condicional** baseada em permissões
- **Endpoints protegidos** no backend
- **Conta admin padrão** (admin/admin) para desenvolvimento

---

## 🎥 Demonstração Visual

### 🌙 **Tema Escuro (Dark Theme)**
<div align="center">

| Home | Detalhes do Pokémon | Ranking |
|:----------:|:--------:|:-------:|
| ![Home Dark](frontend/src/assets/img/Home-Web-Dark-Theme.png) | ![Detalhes Dark](frontend/src/assets/img/Modal-Details-Web-Dark-Theme.png) | ![Ranking](frontend/src/assets/img/Ranking-Web.png) |

</div>

### ☀️ **Tema Claro (Light Theme)**
<div align="center">

| Home | Detalhes do Pokémon |
|:----------:|:--------:|
| ![Home Light](frontend/src/assets/img/Home-Web-Light-Theme.png) | ![Detalhes Light](frontend/src/assets/img/Modal-Details-Web-Light-Theme.png) |

</div>

> **💡 Dica**: O aplicativo detecta automaticamente a preferência do sistema e permite alternar entre os temas manualmente através das configurações.

---

## 🚀 Instalação e Configuração

### 📋 **Pré-requisitos**
- **Node.js** 18.x ou superior
- **Python** 3.11 ou superior
- **Git** para controle de versão
- **VS Code** (recomendado) com extensões Angular e Python

### ⚡ **Instalação Rápida**

```bash
# 1. Clone o repositório
git clone https://github.com/davidassef/PokeAPI.git
cd PokeAPIApp

# 2. Configure o backend
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edite o arquivo .env conforme necessário

# 3. Inicie o backend
uvicorn main:app --reload --port 8000

# 4. Configure o frontend (novo terminal)
cd ../frontend
npm install

# 5. Inicie o frontend + client-server
npm start
```

### 🌐 **URLs de Acesso**
- **Frontend**: http://localhost:8100
- **Backend API**: http://localhost:8000
- **Documentação da API**: http://localhost:8000/docs
- **Client-Server** (desenvolvimento): http://localhost:3001

### 🔧 **Scripts Disponíveis**

#### Frontend
```bash
npm start              # Inicia frontend + client-server
npm run start:dev      # Modo desenvolvimento
npm run build          # Build para produção
npm run build:prod     # Build otimizado com redirects
npm test               # Executa testes
```

#### Backend
```bash
uvicorn main:app --reload                    # Desenvolvimento
python scripts/migrate_rbac_schema.py        # Migração RBAC
pytest                                       # Executa testes
pytest --cov                                 # Testes com cobertura
```

---

## 🏗️ Arquitetura Técnica

### **Stack Tecnológico**

#### Frontend
- **Framework**: Angular 17 + Ionic 8
- **Linguagem**: TypeScript
- **Estilização**: SCSS + CSS Variables
- **Estado**: RxJS + Services
- **Internacionalização**: ngx-translate
- **Armazenamento**: Ionic Storage
- **Build**: Angular CLI + Capacitor

#### Backend
- **Framework**: FastAPI 0.104+
- **Linguagem**: Python 3.11+
- **ORM**: SQLAlchemy 2.x
- **Banco de Dados**: SQLite
- **Autenticação**: JWT + python-jose
- **Validação**: Pydantic 2.x
- **Servidor**: Uvicorn + Gunicorn (produção)

#### Ferramentas de Desenvolvimento
- **Testes**: Pytest (backend), Jasmine/Karma (frontend)
- **Linting**: ESLint, Flake8, Black
- **Versionamento**: Git + GitHub
- **Deploy**: Render (backend), Netlify (frontend)

---

## 📁 Estrutura Detalhada do Projeto

```
PokeAPIApp/
├── 📁 backend/                    # Backend FastAPI
│   ├── 📁 app/                    # Código principal da aplicação
│   │   ├── 📁 core/               # Configurações, auth, database
│   │   ├── 📁 models/             # Modelos SQLAlchemy
│   │   ├── 📁 routes/             # Endpoints da API
│   │   ├── 📁 schemas/            # Esquemas Pydantic
│   │   ├── 📁 services/           # Lógica de negócio
│   │   └── 📁 utils/              # Funções utilitárias
│   ├── 📁 tests/                  # Testes do backend
│   ├── 📁 scripts/                # Scripts de migração e setup
│   ├── main.py                    # Aplicação principal
│   ├── requirements.txt           # Dependências Python
│   └── .env.example              # Configurações de exemplo
│
├── 📁 frontend/                   # Frontend Angular/Ionic
│   ├── 📁 src/
│   │   ├── 📁 app/
│   │   │   ├── 📁 core/           # Serviços principais
│   │   │   │   ├── 📁 services/   # AuthService, PokeApiService, etc.
│   │   │   │   ├── 📁 guards/     # Route guards
│   │   │   │   └── 📁 interceptors/ # HTTP interceptors
│   │   │   ├── 📁 shared/         # Componentes compartilhados
│   │   │   │   ├── 📁 components/ # Modais, cards, etc.
│   │   │   │   └── 📁 pipes/      # Pipes customizados
│   │   │   ├── 📁 pages/          # Páginas da aplicação
│   │   │   │   ├── 📁 web/        # Páginas para desktop
│   │   │   │   └── 📁 mobile/     # Páginas para mobile
│   │   │   └── 📁 models/         # Interfaces e tipos
│   │   ├── 📁 assets/             # Imagens, sons, i18n
│   │   │   ├── 📁 i18n/           # Arquivos de tradução
│   │   │   ├── 📁 sounds/         # Efeitos sonoros
│   │   │   └── 📁 music/          # Trilha sonora
│   │   └── 📁 environments/       # Configurações de ambiente
│   ├── 📁 docs/                   # Documentação do frontend
│   ├── package.json               # Dependências Node.js
│   ├── ionic.config.json          # Configurações do Ionic
│   └── client-server.js           # Servidor de sincronização local
│
├── 📁 docs/                       # Documentação completa
│   ├── 📁 01_DESENVOLVIMENTO/     # Guias de desenvolvimento
│   ├── 📁 20_DEPLOY/              # Guias de deploy
│   ├── 📁 50_API/                 # Documentação da API
│   └── 📁 99_REFERENCIAS/         # Referências técnicas
│
├── 📁 scripts/                    # Scripts de automação
│   ├── config-environment.sh      # Configuração de ambiente
│   └── deploy-production.sh       # Deploy para produção
│
└── 📁 tests/                      # Testes end-to-end
    ├── 📁 e2e/                    # Testes Cypress
    └── 📁 integration/            # Testes de integração
```

---

## 🔒 Sistema de Segurança e Autenticação

### **Autenticação JWT**
- **Tokens seguros** com expiração configurável
- **Refresh tokens** para renovação automática
- **Middleware de autenticação** em todas as rotas protegidas
- **Logout seguro** com invalidação de tokens

### **Sistema RBAC (Role-Based Access Control)**
- **Roles disponíveis**:
  - `VISITOR`: Acesso básico (visualização, busca, ranking)
  - `USER`: Funcionalidades completas (captura, favoritos, perfil)
  - `ADMINISTRATOR`: Acesso total (gerenciamento de Pokémon, usuários)

- **Permissões granulares**:
  - `VIEW_POKEMON_LIST`, `VIEW_POKEMON_DETAILS`
  - `CAPTURE_POKEMON`, `MANAGE_PERSONAL_COLLECTION`
  - `ADD_POKEMON`, `EDIT_POKEMON`, `DELETE_POKEMON`
  - `MANAGE_USERS`, `ACCESS_ADMIN_DASHBOARD`

### **Reset de Senha com Perguntas Secretas**
- **4 perguntas disponíveis**: Nome do primeiro pet, cidade natal, primeira escola, nome da mãe
- **Criptografia segura** das respostas
- **Validação robusta** sem necessidade de email
- **Processo em 3 etapas**: solicitação → verificação → redefinição

### **Proteção de Dados**
- **Senhas criptografadas** com bcrypt
- **Dados sensíveis** protegidos no backend
- **Validação de entrada** em todos os endpoints
- **Rate limiting** para prevenir ataques
- **Logs de auditoria** para monitoramento

---

## 📝 Documentação

- [Índice Principal](docs/01_00_INDICE_DOCUMENTACAO.md)
- [Configuração de Ambiente](docs/01_01_CONFIGURACAO_AMBIENTE.md)
- [Estrutura do Projeto](docs/01_02_ESTRUTURA_PROJETO.md)
- [Changelog](CHANGELOG.md)

---

## 🤝 Contribua

Contribuições são bem-vindas! Veja as instruções em [docs/README.md](docs/README.md).

---

## 📄 Licença

MIT. Veja o arquivo [LICENSE](LICENSE).

---

## 👤 Autor

**David Assef**
[GitHub](https://github.com/davidassef) | [LinkedIn](https://www.linkedin.com/in/david-assef-carneiro-2a2891b9/)

> Para detalhes técnicos, deploy, banco de dados e changelog, consulte a documentação em `/docs`.
