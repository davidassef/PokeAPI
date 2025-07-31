"""
Pacote de utilitários e funções auxiliares para o backend PokeAPI_SYNC.

Este pacote fornece funções utilitárias reutilizáveis para:
- Manipulação de cache e armazenamento
- Processamento de imagens e arquivos
- Validações customizadas e sanitização
- Formatação de dados e conversões
- Logging e monitoramento

Módulos disponíveis:
    - cache_utils: Funções para gerenciamento de cache
    - image_utils: Manipulação e processamento de imagens
    - validators: Validadores customizados para dados

Uso típico:
    ```python
    from app.utils.cache_utils import get_cached_data
    from app.utils.image_utils import process_pokemon_image
    from app.utils.validators import validate_pokemon_name
    ```

Todos os utilitários são projetados para serem:
    - Reutilizáveis em diferentes contextos
    - Testáveis de forma isolada
    - Documentados com exemplos claros
    - Seguros para uso em produção
"""