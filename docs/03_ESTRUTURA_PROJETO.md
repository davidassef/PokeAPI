# 📁 Estrutura do Projeto - PokeAPIApp

## 🏗️ Visão Geral da Arquitetura

Este documento descreve a estrutura organizacional do projeto PokeAPIApp, um aplicativo full-stack moderno para explorar o mundo Pokémon.

## 📂 Estrutura de Pastas

```
PokeAPIApp/
├── 📁 backend/                    # Aplicação FastAPI
│   ├── 📁 app/                    # Código principal da aplicação
│   │   ├── 📁 core/               # Configurações, auth, database
│   │   ├── 📁 data/               # Arquivos de dados e seeds
│   │   ├── 📁 models/             # Modelos SQLAlchemy
│   │   ├── 📁 routes/             # Endpoints da API
│   │   ├── 📁 schemas/            # Esquemas Pydantic
│   │   ├── 📁 services/           # Lógica de negócio
│   │   └── 📁 utils/              # Funções utilitárias
│   ├── 📁 docs/                   # Documentação específica do backend
│   ├── 📁 tests/                  # Testes do backend
│   ├── 📁 logs/                   # Logs do backend
│   ├── 📄 main.py                 # Ponto de entrada da aplicação
│   ├── 📄 requirements.txt        # Dependências Python
│   ├── 📄 pytest.ini             # Configuração de testes
│   └── 📄 README.md               # Documentação principal
│
├── 📁 frontend/                   # Aplicação Ionic + Angular
│   ├── 📁 src/                    # Código fonte
│   │   ├── 📁 app/                # Aplicação Angular
│   │   │   ├── 📁 core/           # Serviços principais
│   │   │   ├── 📁 shared/         # Componentes reutilizáveis
│   │   │   ├── 📁 pages/          # Páginas da aplicação
│   │   │   ├── 📁 models/         # Modelos TypeScript
│   │   │   └── 📁 services/       # Serviços Angular
│   │   ├── 📁 assets/             # Recursos estáticos
│   │   └── 📁 environments/       # Configurações de ambiente
│   ├── 📁 docs/                   # Documentação específica do frontend
│   ├── 📁 tests/                  # Testes do frontend
│   ├── 📄 angular.json            # Configuração do Angular
│   ├── 📄 ionic.config.json       # Configuração do Ionic
│   └── 📄 package.json            # Dependências Node.js
│
├── 📁 config/                     # Configurações de deploy
│   ├── 📄 railway.json            # Configuração Railway
│   └── 📄 render.yaml             # Configuração Render
│
├── 📁 scripts/                    # Scripts de automação e deploy
│   ├── 📁 build/                  # Scripts de build
│   │   ├── 📄 build-backend.sh
│   │   └── 📄 build-frontend.sh
│   ├── 📁 database/               # Scripts de banco de dados
│   │   ├── 📄 clean_database.py
│   │   └── 📄 verify-config.sh
│   ├── 📁 deployment/             # Scripts de deploy
│   │   ├── 📄 start-backend.sh
│   │   ├── 📄 start-frontend.sh
│   │   ├── 📄 start-pull-sync-only.sh
│   │   ├── 📄 start-pull-sync.bat
│   │   └── 📄 start-pull-sync.sh
│   └── 📁 legacy/                 # Scripts de inicialização e utilitários antigos
│       ├── 📄 start-backend.sh
│       ├── 📄 start-frontend.sh
│       ├── 📄 start-pull-sync-only.sh
│       ├── 📄 start-pull-sync.bat
│       └── 📄 start-pull-sync.sh
│
├── 📁 tests/                      # Testes end-to-end integrados
│   └── 📁 e2e/                    # Testes E2E globais
│
├── 📁 .github/                    # GitHub Actions e instruções
│   └── 📁 instructions/           # Instruções para desenvolvimento
│
├── 📄 README.md                   # Documentação principal
├── 📄 package.json                # Dependências do workspace
└── 📄 .gitignore                  # Arquivos ignorados pelo Git
```

## 🔧 Responsabilidades das Pastas

### Backend (`/backend/`)
- **app/**: Código principal da aplicação FastAPI
- **core/**: Configurações, autenticação, conexão com banco
- **models/**: Modelos de dados SQLAlchemy
- **routes/**: Endpoints da API REST
- **schemas/**: Validação e serialização com Pydantic
- **services/**: Lógica de negócio
- **utils/**: Funções utilitárias e helpers
- **data/**: Bancos de dados SQLite e arquivos de dados
- **scripts/**: Scripts Python utilitários e de manutenção
- **logs/**: Logs do backend

### Frontend (`/frontend/`)
- **src/app/**: Aplicação Angular principal
- **core/**: Serviços principais e configurações
- **shared/**: Componentes, pipes e módulos reutilizáveis
- **pages/**: Páginas/rotas da aplicação
- **models/**: Interfaces e tipos TypeScript
- **services/**: Serviços para comunicação com API
- **assets/**: Recursos estáticos
- **environments/**: Configurações de ambiente

### Scripts (`/scripts/`)
- **build/**: Scripts de construção da aplicação
- **database/**: Scripts de migração e limpeza de dados
- **deployment/**: Scripts de deploy e inicialização
- **sync/**: Scripts de sincronização de dados
- **legacy/**: Scripts de inicialização e utilitários antigos

### Configurações (`/config/`)
- Arquivos de configuração de deploy (Railway, Render)
- Separados do código fonte para melhor organização

### Dados (`/data/`)
- Bancos de dados SQLite
- Arquivos de dados persistentes

## 🎯 Benefícios da Estrutura

1. **Separação Clara**: Backend e frontend completamente separados
2. **Modularidade**: Cada pasta tem responsabilidade específica
3. **Escalabilidade**: Fácil adicionar novos módulos
4. **Manutenibilidade**: Código organizado e fácil de encontrar
5. **Deployment**: Configurações centralizadas
6. **Testes**: Estrutura clara para diferentes tipos de teste

## 🚀 Próximos Passos

1. Implementar testes unitários em cada módulo
2. Adicionar documentação específica por módulo
3. Configurar CI/CD pipelines
4. Implementar monitoramento e logs
5. Adicionar ferramentas de qualidade de código

---

📝 **Nota**: Esta estrutura segue as melhores práticas de desenvolvimento full-stack e pode ser evoluída conforme o projeto cresce.
