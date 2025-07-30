"""
Configurações principais do backend PokeAPI_SYNC.

Este módulo centraliza todas as configurações da aplicação usando Pydantic Settings,
permitindo configuração via variáveis de ambiente e valores padrão seguros.
Inclui configurações de banco de dados, CORS, autenticação e deployment.
"""
import os
import secrets
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Configurações centralizadas da aplicação PokeAPI_SYNC.
    
    Esta classe gerencia todas as configurações da aplicação usando Pydantic Settings,
    permitindo configuração via variáveis de ambiente com valores padrão seguros.
    
    As configurações são organizadas por categorias: API, banco de dados, CORS,
    APIs externas, JWT, segurança e deployment.
    
    Attributes:
        app_name (str): Nome da aplicação exibido na documentação.
        app_version (str): Versão atual da API.
        debug (bool): Flag de debug para ambiente de desenvolvimento.
        database_url (str): URL padrão do banco de dados.
        cors_origins (list[str]): Lista de origens permitidas para CORS.
        pokeapi_base_url (str): URL base da PokeAPI oficial.
        secret_key (str): Chave secreta para assinatura JWT.
        algorithm (str): Algoritmo de assinatura JWT.
        access_token_expire_minutes (int): Tempo de expiração do access token em minutos.
        refresh_token_expire_days (int): Tempo de expiração do refresh token em dias.
        bcrypt_rounds (int): Número de rounds para hash bcrypt.
        password_min_length (int): Comprimento mínimo de senha.
        password_max_length (int): Comprimento máximo de senha.
        
    Example:
        >>> from app.core.config import settings
        >>> print(settings.app_name)
        'PokeAPI Backend'
    """

    # ===== CONFIGURAÇÕES DA API =====

    # Nome da aplicação exibido na documentação
    app_name: str = "PokeAPI Backend"

    # Versão atual da API
    app_version: str = "1.5"

    # Flag de debug para desenvolvimento
    debug: bool = True

    # ===== CONFIGURAÇÕES DE BANCO DE DADOS =====

    # URL padrão do banco de dados
    # Pode ser sobrescrita pela variável de ambiente DATABASE_URL
    database_url: str = Field(
        default="sqlite:///./pokemon_app.db",
        env="DATABASE_URL"
    )

    @property
    def get_database_url(self) -> str:
        """
        Retorna URL de conexão do banco de dados com lógica inteligente de fallback.
        
        Implementa sistema de prioridades para diferentes ambientes de deployment:
        1. DATABASE_URL (PostgreSQL/MySQL externo para produção via variável de ambiente)
        2. Volume persistente do Render (SQLite em produção)
        3. SQLite local (desenvolvimento)
        
        A lógica garante persistência de dados independentemente do ambiente,
        adaptando-se automaticamente entre desenvolvimento local e produção.
        
        Returns:
            str: URL de conexão com o banco de dados pronta para uso.
            
        Examples:
            >>> settings = Settings()
            >>> url = settings.get_database_url
            >>> print(url)
            'sqlite:///./pokemon_app.db'
            
        Note:
            Em produção no Render, a função automaticamente detecta o ambiente
            e usa o diretório persistente /opt/render/project/data/ para SQLite,
            garantindo que os dados não sejam perdidos entre deploys.
        """
        import os

        # Prioridade 1: Banco externo via variável de ambiente
        if os.getenv("DATABASE_URL"):
            return os.getenv("DATABASE_URL")

        # Prioridade 2: Volume persistente do Render
        persistent_path = "/opt/render/project/data/pokemon_app.db"
        if os.path.exists("/opt/render/project/data"):
            os.makedirs("/opt/render/project/data", exist_ok=True)
            return f"sqlite:///{persistent_path}"

        # Prioridade 3: SQLite local para desenvolvimento
        return self.database_url

    # ===== CONFIGURAÇÕES DE CORS =====

    # Lista de origens permitidas para requisições CORS
    # Inclui URLs de desenvolvimento local e produção
    cors_origins: list[str] = [
        "http://localhost:4200",    # Angular dev server
        "http://localhost:8100",    # Ionic dev server
        "http://127.0.0.1:4200",    # Angular dev server (IP)
        "http://127.0.0.1:8100",    # Ionic dev server (IP)
        "https://poke-api-mauve.vercel.app"  # Frontend em produção (Vercel)
    ]

    # ===== APIS EXTERNAS =====

    # URL base da PokeAPI oficial para dados dos Pokémons
    pokeapi_base_url: str = "https://pokeapi.co/api/v2"

    # ===== CONFIGURAÇÕES JWT =====

    # Chave secreta para assinatura de tokens JWT
    # Usa variável de ambiente ou gera automaticamente
    secret_key: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))

    # Algoritmo de assinatura JWT
    algorithm: str = "HS256"

    # Tempo de expiração do access token em minutos
    access_token_expire_minutes: int = 30

    # Tempo de expiração do refresh token em dias
    refresh_token_expire_days: int = 7

    # ===== CONFIGURAÇÕES DE SEGURANÇA =====

    # Número de rounds para hash bcrypt (balanceado: seguro mas rápido)
    bcrypt_rounds: int = 8

    # Comprimento mínimo de senha
    password_min_length: int = 6

    # Comprimento máximo de senha
    password_max_length: int = 100

    class Config:
        """
        Configuração do Pydantic Settings para carregamento de variáveis de ambiente.
        
        Define o comportamento de carregamento de variáveis de ambiente,
        incluindo suporte para arquivo .env local.
        
        Attributes:
            env_file (str): Nome do arquivo de variáveis de ambiente a ser carregado.
            
        Example:
            >>> # Criar arquivo .env na raiz do projeto
            >>> # SECRET_KEY=your-secret-key-here
            >>> settings = Settings()
            >>> # As variáveis do .env serão automaticamente carregadas
        """
        env_file = ".env"


# Instância global das configurações para uso em toda a aplicação
"""
Instância global das configurações da aplicação.

Esta instância é usada em todo o projeto para acessar configurações
centralizadas de forma consistente e eficiente.

Example:
    >>> from app.core.config import settings
    >>> database_url = settings.get_database_url
    >>> secret_key = settings.secret_key
"""
settings = Settings()
