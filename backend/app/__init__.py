"""Pacote principal da aplicação FastAPI.

Este pacote organiza toda a estrutura da aplicação FastAPI do PokeAPI_SYNC,
seguindo os princípios de arquitetura limpa e separação de responsabilidades.

Módulos incluídos:
    - core: Configurações centrais, segurança, banco de dados e middleware
    - models: Definições de modelos de dados SQLAlchemy
    - routes: Definições de rotas e endpoints da API REST
    - schemas: Validação de dados com Pydantic para request/response
    - services: Lógica de negócios e integrações com APIs externas
    - utils: Funções auxiliares e utilitários compartilhados

Estrutura do pacote:
    app/
    ├── __init__.py              # Este arquivo - inicialização do app
    ├── core/                    # Configurações e infraestrutura
    │   ├── __init__.py
    │   ├── config.py           # Configurações da aplicação ✅
    │   ├── database.py         # Configuração SQLAlchemy ✅
    │   ├── auth.py             # Segurança JWT ✅
    │   ├── auth_middleware.py  # Middleware de autenticação
    │   └── rbac.py             # Controle de acesso baseado em roles
    ├── models/                  # Modelos de banco de dados
    ├── routes/                  # Endpoints da API
    ├── schemas/                 # Validação de dados
    ├── services/                # Lógica de negócio
    └── utils/                   # Utilitários

Usage:
    Este pacote é importado e utilizado pelo arquivo main.py:
    ```python
    from app.core.config import settings
    from app.core.database import engine, Base
    from app.routes import pokemon, auth
    ```

Notas:
    - Todos os módulos são lazy-loaded quando necessário
    - Segue padrão de importação absoluta para clareza
    - Configurado para suportar hot-reload durante desenvolvimento
"""