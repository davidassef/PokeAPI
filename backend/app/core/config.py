"""
Configurações principais do backend PokeAPI App.
"""
import os
import secrets
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configurações da aplicação."""

    # API Config
    app_name: str = "PokeAPI Backend"
    app_version: str = "1.5"
    debug: bool = True

    # Database - CORREÇÃO CRÍTICA: Múltiplas opções de persistência
    database_url: str = Field(
        default="sqlite:///./pokemon_app.db",
        env="DATABASE_URL"
    )

    @property
    def get_database_url(self) -> str:
        """
        Retorna URL do banco com lógica de fallback.
        Prioridade: DATABASE_URL > Volume persistente > Local
        """
        import os

        # 1. Usar DATABASE_URL se definida (PostgreSQL/MySQL externo)
        if os.getenv("DATABASE_URL"):
            return os.getenv("DATABASE_URL")

        # 2. Usar volume persistente do Render se disponível
        persistent_path = "/opt/render/project/data/pokemon_app.db"
        if os.path.exists("/opt/render/project/data"):
            os.makedirs("/opt/render/project/data", exist_ok=True)
            return f"sqlite:///{persistent_path}"

        # 3. Fallback para SQLite local (desenvolvimento)
        return self.database_url

    # CORS
    cors_origins: list[str] = [
        "http://localhost:4200",
        "http://localhost:8100",
        "http://127.0.0.1:4200",
        "http://127.0.0.1:8100",
        # ✅ CORREÇÃO CRÍTICA: Novo domínio da Vercel
        "https://poke-api-mauve.vercel.app"
    ]

    # External APIs
    pokeapi_base_url: str = "https://pokeapi.co/api/v2"

    # JWT Configuration
    secret_key: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Security Configuration
    bcrypt_rounds: int = 8  # Número de rounds para bcrypt (balanceado: seguro mas rápido)
    password_min_length: int = 6
    password_max_length: int = 100

    class Config:
        env_file = ".env"


settings = Settings()
