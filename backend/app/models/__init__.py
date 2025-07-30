"""Pacote de modelos de banco de dados SQLAlchemy.

Este pacote define todos os modelos de dados utilizados no sistema PokeAPI_SYNC,
organizando as entidades do banco de dados com suas relações, validações e
comportamentos específicos de negócio.

Modelos incluídos:
    - pokemon.py: Modelo de Pokémon com informações básicas e estatísticas
    - user.py: Modelo de usuário com autenticação, roles e preferências

Características dos modelos:
    - Utilizam SQLAlchemy ORM para mapeamento objeto-relacional
    - Incluem validações de dados através de SQLAlchemy validators
    - Suportam timestamps automáticos (created_at, updated_at)
    - Implementam soft delete quando aplicável
    - Possuem métodos auxiliares para serialização e validação

Relações principais:
    - User → Pokémon (favoritos, capturados)
    - User → UserRole (múltiplas roles por usuário)
    - Pokémon → Cache (registro de sincronização)

Exemplo de uso:
    ```python
    from app.models.pokemon import Pokemon
    from app.models.user import User
    
    # Criar novo Pokémon
    new_pokemon = Pokemon(
        name="Pikachu",
        pokemon_id=25,
        types=["Electric"]
    )
    
    # Criar novo usuário
    new_user = User(
        email="user@example.com",
        username="trainer123",
        hashed_password="hashed_password_here"
    )
    ```

Configurações de banco de dados:
    - Tabelas são criadas automaticamente via Alembic migrations
    - Índices são criados para campos de busca frequentes
    - Constraints garantem integridade referencial
    - Soft delete é implementado através de campo deleted_at

Notas de segurança:
    - Senhas são hasheadas automaticamente antes de serem salvas
    - Dados sensíveis são excluídos da serialização JSON
    - Validações impedem dados inconsistentes
"""