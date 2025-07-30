"""Pacote de schemas Pydantic para validação e serialização.

Este pacote define todos os schemas de dados utilizados para validação,
serialização e documentação da API PokeAPI_SYNC, utilizando Pydantic
para garantir tipagem forte e validação automática de dados.

Schemas incluídos:
    - pokemon.py: Schemas para dados de Pokémon (criação, atualização, resposta)
    - user.py: Schemas para dados de usuário (registro, login, perfil)

Características dos schemas:
    - Utilizam Pydantic para validação automática de dados
    - Incluem validações customizadas e transformações de dados
    - Suportam serialização/deserialização JSON automática
    - Documentam automaticamente a API via OpenAPI/Swagger
    - Implementam configurações de segurança para dados sensíveis

Tipos de schemas:
    - Request Schemas: Para validação de dados de entrada (Create, Update)
    - Response Schemas: Para serialização de respostas da API
    - Base Schemas: Para campos compartilhados entre múltiplos schemas
    - Config Schemas: Para configurações e parâmetros de API

Validações implementadas:
    - Formato de email válido
    - Força de senha (mínimo 8 caracteres, caracteres especiais)
    - Validação de tipos de Pokémon existentes
    - Limites de caracteres para strings
    - Valores numéricos dentro de ranges válidos
    - Formato de URLs e UUIDs

Exemplo de uso:
    ```python
    from app.schemas.pokemon import PokemonCreate, PokemonResponse
    from app.schemas.user import UserCreate, UserResponse
    
    # Validar dados de entrada
    new_pokemon = PokemonCreate(
        name="Pikachu",
        pokemon_id=25,
        types=["Electric"],
        height=40,
        weight=60
    )
    
    # Serializar resposta da API
    user_response = UserResponse(
        id=1,
        email="user@example.com",
        username="trainer123",
        is_active=True
    )
    ```

Configurações de segurança:
    - Campos sensíveis são excluídos da serialização por padrão
    - Senhas nunca são retornadas nas respostas da API
    - Dados PII são mascarados quando apropriado
    - Validação estrita previne injeção de dados maliciosos

Integração com FastAPI:
    - Schemas são usados automaticamente para documentação OpenAPI
    - Erros de validação geram respostas 422 com detalhes claros
    - Tipos são inferidos automaticamente para documentação
    - Exemplos são incluídos na documentação interativa

Notas de performance:
    - Pydantic é otimizado para performance
    - Cache de validação é utilizado para schemas frequentes
    - Conversões de tipo são realizadas automaticamente
    - Erros de validação são retornados rapidamente
"""