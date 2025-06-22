# 🐍 Backend PokeAPI App

Backend FastAPI para aplicativo Pokédex desenvolvido com **Ionic + Angular**.

## 🛠️ Stack Tecnológico

- **FastAPI**: Framework web moderno e rápido
- **SQLAlchemy**: ORM para banco de dados
- **Pydantic**: Validação de dados e serialização
- **SQLite**: Banco de dados (desenvolvimento)
- **HTTPX**: Cliente HTTP assíncrono
- **Uvicorn**: Servidor ASGI

## 📁 Estrutura do Projeto

```
backend/
├── app/
│   ├── core/           # Configurações e database
│   ├── models/         # Modelos SQLAlchemy
│   ├── schemas/        # Schemas Pydantic
│   ├── services/       # Lógica de negócio
│   ├── routes/         # Rotas da API
│   └── utils/          # Utilitários
├── main.py            # Aplicação principal
├── requirements.txt   # Dependências
└── .env.example      # Configurações de exemplo
```

## 🚀 Como Executar

### 1. Instalar Dependências

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configurar Ambiente

```bash
cp .env.example .env
# Edite o arquivo .env conforme necessário
```

### 3. Executar o Servidor

```bash
uvicorn main:app --reload
```

A API estará disponível em: http://localhost:8000

## 📚 Documentação da API

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🛡️ Endpoints Principais

### Usuários
- `POST /api/v1/users/` - Criar usuário
- `GET /api/v1/users/` - Listar usuários
- `GET /api/v1/users/{id}` - Buscar usuário
- `PUT /api/v1/users/{id}` - Atualizar usuário
- `DELETE /api/v1/users/{id}` - Deletar usuário

### Favoritos
- `POST /api/v1/favorites/` - Adicionar favorito
- `DELETE /api/v1/favorites/{user_id}/{pokemon_id}` - Remover favorito
- `GET /api/v1/favorites/user/{user_id}` - Listar favoritos do usuário
- `GET /api/v1/favorites/check/{user_id}/{pokemon_id}` - Verificar se é favorito

### Ranking
- `GET /api/v1/ranking/` - Top Pokémons mais favoritados
- `GET /api/v1/ranking/stats` - Estatísticas gerais

### Pokémons (Proxy para PokeAPI)
- `GET /api/v1/pokemon/{id_or_name}` - Buscar Pokémon
- `GET /api/v1/pokemon/` - Listar Pokémons
- `GET /api/v1/pokemon/{id_or_name}/species` - Espécie do Pokémon
- `GET /api/v1/pokemon/search/{query}` - Buscar por nome
- `GET /api/v1/pokemon/types/all` - Listar tipos
- `GET /api/v1/pokemon/type/{type_name}` - Detalhes do tipo

## 🗄️ Banco de Dados

O projeto usa SQLite por padrão para desenvolvimento. As tabelas são:

- **users**: Usuários do sistema
- **favorite_pokemons**: Pokémons favoritos dos usuários  
- **pokemon_rankings**: Ranking dos Pokémons mais favoritados

## 🔧 Desenvolvimento

### Executar com Debug
```bash
uvicorn main:app --reload --log-level debug
```

### Testes (quando implementados)
```bash
pytest
```

### Linting
```bash
black .
flake8 .
mypy .
```

## 🌐 Integração com Frontend

O backend está configurado para aceitar requisições CORS dos seguintes origins:
- http://localhost:4200 (Angular dev server)
- http://localhost:8100 (Ionic dev server)

## 📊 Funcionalidades

- ✅ **CRUD de Usuários** completo
- ✅ **Sistema de Favoritos** com persistência
- ✅ **Ranking** de Pokémons mais favoritados
- ✅ **Proxy para PokeAPI** com cache inteligente
- ✅ **Validação robusta** com Pydantic
- ✅ **Documentação automática** com Swagger
- ✅ **CORS configurado** para frontend
- ✅ **Tratamento de erros** consistente

## 🔮 Próximas Implementações

- [ ] Autenticação JWT
- [ ] Cache Redis
- [ ] Testes unitários e integração
- [ ] Deploy com Docker
- [ ] Logs estruturados
- [ ] Rate limiting
- [ ] WebSockets para atualizações em tempo real
