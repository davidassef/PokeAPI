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
│   ├── 📄 main.py                 # Ponto de entrada da aplicação
│   ├── 📄 requirements.txt        # Dependências Python
│   └── 📄 pytest.ini             # Configuração de testes
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
├── 📁 data/                       # Bancos de dados
│   ├── 📄 pokemon_app.db          # Banco principal
│   └── 📄 test_pokemon.db         # Banco de testes
│
├── 📁 docs/                       # Documentação geral
│   ├── 📄 AUTH_SISTEMA_SIMPLIFICADO.md
│   ├── 📄 DEVELOPMENT_PLAN.md
│   ├── 📄 PROJECT_STRUCTURE.md
│   ├── 📄 README_PULL_SYNC.md
│   ├── 📄 README_RANKING_SYSTEM.md
│   └── 📄 SYNC_COMPLETE_GUIDE.md
│
├── 📁 scripts/                    # Scripts de automação
│   ├── 📁 build/                  # Scripts de build
│   │   ├── 📄 build-backend.sh
│   │   └── 📄 build-frontend.sh
│   ├── 📁 database/               # Scripts de banco de dados
│   │   ├── 📄 add_sample_data.py
│   │   ├── 📄 clean_database.py
│   │   └── 📄 verify-config.sh
│   ├── 📁 deployment/             # Scripts de deploy
│   │   ├── 📄 quick-start.sh
│   │   ├── 📄 start-backend.sh
│   │   ├── 📄 start-frontend.sh
│   │   ├── 📄 start-pull-sync-only.sh
│   │   ├── 📄 start-pull-sync.bat
│   │   ├── 📄 start-pull-sync.sh
│   │   ├── 📄 start_client_server.bat
│   │   ├── 📄 start_ranking_system.bat
│   │   ├── 📄 start_ranking_system.ps1
│   │   └── 📄 start_ranking_system.py
│   └── 📁 sync/                   # Scripts de sincronização
│       ├── 📄 pull-sync.env
│       ├── 📄 PULL_SYNC_FINAL.md
│       └── 📄 pull_sync_test_results.json
│
├── 📁 tests/                      # Testes end-to-end
│   ├── 📁 e2e/                    # Testes E2E globais
│   └── 📄 test_ranking_system.py  # Testes do sistema de ranking
│
├── 📁 tools/                      # Ferramentas de debug e utilidades
│   └── 📄 debug_storage.html      # Debug do localStorage
│
├── 📁 config/                     # Configurações de deploy
│
├── 📁 data/                       # Dados persistentes
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

### Frontend (`/frontend/`)
- **src/app/**: Aplicação Angular principal
- **core/**: Serviços principais e configurações
- **shared/**: Componentes, pipes e módulos reutilizáveis
- **pages/**: Páginas/rotas da aplicação
- **models/**: Interfaces e tipos TypeScript
- **services/**: Serviços para comunicação com API

### Scripts (`/scripts/`)
- **build/**: Scripts de construção da aplicação
- **database/**: Scripts de migração e limpeza de dados
- **deployment/**: Scripts de deploy e inicialização
- **sync/**: Scripts de sincronização de dados

### Testes (`/tests/`)
- **e2e/**: Testes end-to-end globais
- **test_ranking_system.py**: Testes específicos do sistema de ranking

### Ferramentas (`/tools/`)
- **debug_storage.html**: Ferramenta de debug para localStorage
- Utilitários e ferramentas de desenvolvimento

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
