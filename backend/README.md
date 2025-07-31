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

### Sincronização
- `POST /api/v1/sync-capture/` - Sincronizar capturas do frontend

### Administração
- `GET /api/v1/admin/database-status` - Status do banco de dados
- `POST /api/v1/admin/clear-fictitious-data` - Limpar dados fictícios/mock
- `DELETE /api/v1/admin/reset-database` - ⚠️ Reset completo do banco

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

### 🔧 Gerenciamento do Banco

O backend possui endpoints administrativos para gerenciar o estado do banco:

#### Status do Banco
```bash
GET /api/v1/admin/database-status
```
Retorna informações sobre o estado atual do banco:
- Quantidade de usuários, favoritos e rankings
- Status geral (vazio/populado)

#### Limpar Dados Fictícios
```bash
POST /api/v1/admin/clear-fictitious-data
```
Remove dados de teste/mock criados durante desenvolvimento:
- Usuários fictícios (admin, test, demo)
- Rankings pré-populados
- Favoritos associados a usuários fictícios

#### Reset Completo
```bash
DELETE /api/v1/admin/reset-database
```
⚠️ **ATENÇÃO**: Remove TODOS os dados do banco!
- Apaga todas as tabelas completamente
- Operação irreversível
- Use apenas para testes ou desenvolvimento

### 📊 Fluxo de Dados

1. **Estado Inicial**: Banco vazio após reset
2. **Alimentação**: Dados criados APENAS pelo frontend via sincronização
3. **Integração**: Frontend sincroniza ações via `/api/v1/sync-capture/`
4. **Ranking**: Atualizado automaticamente baseado nos favoritos

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
- ✅ **Docstrings Google-style** implementadas
- ✅ **Documentação de schemas** completa
- ✅ **Utilitários documentados** com exemplos

## 📚 Documentação de Código

### Docstrings
Todas as funções, classes e métodos estão documentados com **Google-style docstrings**, incluindo:
- Descrição clara da funcionalidade
- Parâmetros com tipos e descrições
- Valores de retorno com tipos
- Exceções levantadas
- Exemplos de uso quando aplicável

### Schemas Documentados
Todos os schemas Pydantic possuem:
- Descrição detalhada da finalidade
- Exemplos de valores válidos
- Validações customizadas documentadas
- Relacionamentos entre schemas explicados

### Exemplos de Docstring
```python
def create_user(user: UserCreate, db: Session = Depends(get_db)) -> UserResponse:
    """Cria um novo usuário no sistema.
    
    Args:
        user: Dados do usuário a ser criado
        db: Sessão do banco de dados
        
    Returns:
        UserResponse: Dados do usuário criado com ID gerado
        
    Raises:
        HTTPException: Se o email já estiver cadastrado
        
    Example:
        >>> user_data = {"name": "Ash", "email": "ash@pokemon.com"}
        >>> response = create_user(user_data)
        >>> print(response.id)  # 1
    """
```

## 🔮 Próximas Implementações

- [ ] Testes unitários e integração
- [ ] Deploy com Docker
- [ ] Logs estruturados
- [ ] Rate limiting
- [ ] WebSockets para atualizações em tempo real
- [ ] Cache Redis
- [ ] Autenticação JWT
