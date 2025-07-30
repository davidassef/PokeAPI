"""Pacote de rotas e endpoints da API REST.

Este pacote define todos os endpoints RESTful da aplicação PokeAPI_SYNC,
organizando as rotas por domínio de negócio e seguindo as convenções REST.

Endpoints incluídos:
    - pokemon.py: Rotas para gerenciamento de Pokémon (CRUD, busca, filtros)
    - auth.py: Rotas de autenticação (login, registro, refresh tokens)

Características das rotas:
    - Seguem convenções RESTful com métodos HTTP apropriados
    - Incluem validação de dados com Pydantic schemas
    - Implementam autenticação e autorização via JWT
    - Possuem tratamento consistente de erros
    - Suportam paginação para listagens grandes

Prefixos de rota:
    - /api/v1/pokemon - Operações relacionadas a Pokémon
    - /api/v1/auth - Operações de autenticação e autorização

Middlewares aplicados:
    - Rate limiting para prevenir abuso
    - CORS para permitir requisições cross-origin
    - Logging para auditoria de requisições
    - Validação de tokens JWT para rotas protegidas

Exemplo de estrutura de endpoints:
    ```python
    # Rotas de Pokémon
    GET    /api/v1/pokemon          # Listar Pokémon com paginação
    GET    /api/v1/pokemon/{id}    # Obter detalhes de um Pokémon
    POST   /api/v1/pokemon         # Criar novo Pokémon (admin)
    PUT    /api/v1/pokemon/{id}     # Atualizar Pokémon (admin)
    DELETE /api/v1/pokemon/{id}     # Remover Pokémon (admin)
    
    # Rotas de autenticação
    POST   /api/v1/auth/register    # Registrar novo usuário
    POST   /api/v1/auth/login       # Login com email/senha
    POST   /api/v1/auth/refresh     # Renovar token de acesso
    POST   /api/v1/auth/logout      # Logout e invalidar token
    ```

Configuração de segurança:
    - Rotas públicas não requerem autenticação
    - Rotas protegidas exigem header Authorization Bearer
    - Roles específicas são verificadas para operações administrativas
    - Rate limiting baseado em IP e usuário autenticado

Notas de desenvolvimento:
    - Todos os endpoints incluem documentação OpenAPI/Swagger
    - Respostas seguem padrão JSON consistente
    - Códigos HTTP apropriados são retornados para cada cenário
    - Mensagens de erro são claras e úteis para debugging
"""