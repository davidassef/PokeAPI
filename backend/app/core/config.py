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
    Classe de configurações da aplicação usando Pydantic Settings.

    Centraliza todas as configurações necessárias para o funcionamento
    do backend, com suporte a variáveis de ambiente e valores padrão.
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
        Retorna URL do banco de dados com lógica de fallback inteligente.

        Implementa sistema de prioridades para diferentes ambientes:
        1. DATABASE_URL (PostgreSQL/MySQL externo para produção)
        2. Volume persistente do Render (SQLite em produção)
        3. SQLite local (desenvolvimento)

        Returns:
            str: URL de conexão com o banco de dados

        Note:
            A lógica garante persistência de dados em diferentes ambientes
            de deployment (Render, Heroku, local).
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
        """Configuração do Pydantic Settings para carregar variáveis de ambiente."""
        env_file = ".env"


# Instância global das configurações para uso em toda a aplicação
settings = Settings()
