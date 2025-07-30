"""Pacote de serviços e lógica de negócios.

Este pacote encapsula toda a lógica de negócios da aplicação PokeAPI_SYNC,
organizando serviços especializados por domínio e mantendo uma separação clara
entre a camada de apresentação (routes) e a camada de dados (models).

Serviços incluídos:
    - pokeapi_service.py: Integração com PokeAPI externa, sincronização de dados
    - auth_service.py: Autenticação, autorização, gerenciamento de usuários

Características dos serviços:
    - Implementam padrão Service Layer para lógica de negócios
    - Gerenciam integrações com APIs externas (PokeAPI)
    - Implementam cache e estratégias de otimização
    - Validam regras de negócio complexas
    - Gerenciam transações de banco de dados
    - Implementam retry policies para operações críticas

Integrações externas:
    - PokeAPI Service: Consumo da PokeAPI RESTful para dados de Pokémon
    - Auth Service: Integração com sistemas de autenticação JWT
    - Cache Service: Redis para cache de respostas e dados frequentes

Padrões de implementação:
    - Dependency Injection via FastAPI Depends
    - Async/await para operações I/O intensivas
    - Circuit breaker para APIs externas
    - Rate limiting e retry policies
    - Logging estruturado para auditoria

Exemplo de uso:
    ```python
    from app.services.pokeapi_service import PokeAPIService
    from app.services.auth_service import AuthService
    
    # Serviço de Pokémon
    poke_service = PokeAPIService()
    pokemon_data = await poke_service.get_pokemon_by_id(25)
    
    # Serviço de autenticação
    auth_service = AuthService()
    user = await auth_service.authenticate_user(email, password)
    token = auth_service.create_access_token(user.id)
    ```

Configurações de serviço:
    - Timeouts configuráveis para chamadas externas
    - Retry policies com backoff exponencial
    - Circuit breaker para falhas em cascata
    - Cache TTL configurável por tipo de dado
    - Rate limiting por IP e usuário

Notas de segurança:
    - Serviços não expõem dados sensíveis diretamente
    - Validações de entrada são realizadas em múltiplas camadas
    - Logs não incluem informações sensíveis
    - Integrações com APIs externas usam HTTPS sempre
"""