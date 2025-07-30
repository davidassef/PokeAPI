"""Pacote backend do PokeAPI_SYNC.

Este pacote contém toda a infraestrutura do servidor para o projeto PokeAPI_SYNC,
incluindo configuração da aplicação FastAPI, modelos de banco de dados,
serviços de integração com APIs externas, autenticação JWT, e sistema de cache.

Módulos principais:
    - app.core: Configurações centrais, segurança e conexão com banco de dados
    - app.models: Definições de modelos SQLAlchemy
    - app.routes: Endpoints da API REST
    - app.schemas: Validação de dados com Pydantic
    - app.services: Lógica de negócios e integrações externas
    - app.utils: Utilitários e funções auxiliares

Exemplo de estrutura:
    backend/
    ├── app/
    │   ├── core/          # Configurações e segurança
    │   ├── models/        # Modelos de dados
    │   ├── routes/        # Rotas da API
    │   ├── schemas/       # Validação de dados
    │   ├── services/      # Serviços de negócio
    │   └── utils/         # Utilitários
    ├── tests/             # Testes unitários e de integração
    └── scripts/           # Scripts de administração

Usage:
    Este pacote é executado através do arquivo main.py:
    ```bash
    python -m uvicorn backend.main:app --reload
    ```
"""