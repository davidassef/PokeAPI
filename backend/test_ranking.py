#!/usr/bin/env python3
"""
Script para testar o novo sistema de ranking baseado no storage.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.services.client_storage_service import ClientStorageService
from app.services.ranking_service import RankingService

def test_ranking_system():
    """Testa o sistema de ranking do storage."""
    print("🧪 Testando sistema de ranking baseado no storage...")

    # Criar instâncias dos serviços
    storage_service = ClientStorageService()
    ranking_service = RankingService(storage_service)

    # Testar estatísticas do storage
    stats = storage_service.get_storage_stats()
    print(f"📊 Storage Stats: {stats}")

    # Testar ranking do storage
    ranking_data = storage_service.get_ranking_data(limit=10)
    print(f"🏆 Ranking Data: {ranking_data}")

    # Testar atualização do ranking no banco
    with SessionLocal() as db:
        print("🔄 Testando atualização do ranking...")

        try:
            result = ranking_service.update_ranking_from_storage(db)
            print(f"✅ Resultado: {result}")

            # Verificar se foi inserido
            ranking = ranking_service.get_ranking(db, limit=5)
            print(f"📋 Ranking do banco: {len(ranking)} entradas")

            for i, entry in enumerate(ranking):
                print(f"  {i+1}. {entry.pokemon_name} (ID: {entry.pokemon_id}) - {entry.favorite_count} capturas")

        except Exception as e:
            print(f"❌ Erro: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_ranking_system()
