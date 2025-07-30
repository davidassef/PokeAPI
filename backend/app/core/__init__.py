"""Pacote core da aplicação FastAPI.

Este pacote contém os componentes essenciais e de infraestrutura do sistema,
responsável por configurações, segurança, conexão com banco de dados e
middlewares fundamentais para o funcionamento da aplicação.

Módulos incluídos:
    - config.py: Gerenciamento de configurações da aplicação (banco de dados, JWT, etc.)
    - database.py: Configuração do SQLAlchemy com engine, sessões e conexões
    - auth.py: Sistema de autenticação JWT com validação de tokens e controle de acesso
    - auth_middleware.py: Middleware para interceptar e validar requisições autenticadas
    - rbac.py: Sistema de controle de acesso baseado em roles (Role-Based Access Control)

Responsabilidades deste pacote:
    - Gerenciar configurações de ambiente e segurança
    - Estabelecer e manter conexões com banco de dados
    - Implementar autenticação e autorização de usuários
    - Fornecer middlewares para validação de requisições
    - Definir políticas de acesso baseadas em roles

Exemplo de uso:
    ```python
    from app.core.config import settings
    from app.core.database import get_db
    from app.core.auth import get_current_active_user
    from app.core.rbac import check_permission
    ```

Notas de segurança:
    - Todas as configurações sensíveis são carregadas de variáveis de ambiente
    - Tokens JWT são validados em todas as requisições protegidas
    - Senhas são hasheadas antes de serem armazenadas
    - Implementação segue as melhores práticas de OWASP
"""