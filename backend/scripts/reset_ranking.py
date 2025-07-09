#!/usr/bin/env python3
"""
Script para zerar a tabela de ranking (pokemon_rankings) do banco de dados local.
Uso: python reset_ranking.py
"""
from app.core.config import Settings
from sqlalchemy import create_engine, text

if __name__ == "__main__":
    print("🗑️  Zerando tabela de ranking (pokemon_rankings)...")
    settings = Settings()
    engine = create_engine(settings.database_url)
    with engine.connect() as conn:
        result = conn.execute(text("DELETE FROM pokemon_rankings"))
        conn.commit()
        print(f"✅ Ranking zerado com sucesso! Linhas removidas: {result.rowcount}") 