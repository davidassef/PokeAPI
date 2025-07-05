"""
Serviço de ranking baseado no armazenamento consolidado dos clientes.
Gera ranking dinâmico baseado nas contagens reais de capturas.
"""

import logging
from typing import Dict, List
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.models import PokemonRanking
from app.services.client_storage_service import ClientStorageService

logger = logging.getLogger(__name__)


class RankingService:
    """Serviço para gerenciar ranking de pokémons baseado nas capturas dos clientes."""

    def __init__(self, storage_service: ClientStorageService):
        self.storage_service = storage_service

    def update_ranking_from_storage(self, db: Session, force_update: bool = False) -> Dict[str, int]:
        """
        Atualiza a tabela de ranking baseado nos dados do storage.

        Args:
            db: Sessão do banco de dados
            force_update: Se True, força atualização mesmo se não houver mudanças

        Returns:
            Dict com estatísticas da atualização
        """
        logger.info("🏆 Atualizando ranking baseado no storage")

        # Obter dados do ranking do storage
        ranking_data = self.storage_service.get_ranking_data(limit=100)  # Pegar mais para ter flexibilidade

        logger.info(f"📊 Dados do ranking obtidos: {len(ranking_data)} entradas")

        # Limpar ranking atual
        deleted_count = db.query(PokemonRanking).count()
        db.query(PokemonRanking).delete()
        logger.info(f"🗑️ Removidas {deleted_count} entradas antigas do ranking")

        # Inserir novo ranking
        inserted_count = 0
        for pokemon_id, capture_count in ranking_data:
            try:
                # Buscar nome do pokémon (pode ser melhorado com cache)
                pokemon_name = self._get_pokemon_name(pokemon_id)

                ranking_entry = PokemonRanking(
                    pokemon_id=pokemon_id,
                    pokemon_name=pokemon_name,
                    favorite_count=capture_count,
                    last_updated=datetime.now()
                )

                db.add(ranking_entry)
                inserted_count += 1

                logger.info(f"➕ Adicionado ao ranking: {pokemon_name} (ID: {pokemon_id}) - {capture_count} capturas")

            except Exception as e:
                logger.error(f"Erro ao inserir ranking para pokémon {pokemon_id}: {e}")

        # Commit das mudanças
        try:
            db.commit()
            logger.info(f"✅ Commit realizado com sucesso: {inserted_count} entradas")
        except Exception as e:
            logger.error(f"❌ Erro no commit: {e}")
            db.rollback()
            raise

        stats = {
            "inserted_count": inserted_count,
            "total_unique_pokemons": len(ranking_data),
            "top_pokemon_id": ranking_data[0][0] if ranking_data else None,
            "top_pokemon_count": ranking_data[0][1] if ranking_data else 0
        }

        logger.info(f"🎯 Ranking atualizado: {inserted_count} entradas inseridas")
        return stats

    def get_ranking(self, db: Session, limit: int = 10) -> List[PokemonRanking]:
        """
        Retorna ranking atual dos pokémons.

        Args:
            db: Sessão do banco de dados
            limit: Número máximo de pokémons no ranking

        Returns:
            Lista de entradas do ranking ordenada por posição
        """
        return (
            db.query(PokemonRanking)
            .order_by(PokemonRanking.favorite_count.desc(), PokemonRanking.pokemon_id.asc())
            .limit(limit)
            .all()
        )

    def get_ranking_with_storage_comparison(self, db: Session, limit: int = 10) -> Dict:
        """
        Retorna ranking atual e compara com dados do storage.
        Útil para debug e verificação de consistência.
        """
        # Ranking do banco
        db_ranking = self.get_ranking(db, limit)

        # Ranking do storage
        storage_ranking = self.storage_service.get_ranking_data(limit)

        # Comparar consistência
        is_consistent = True
        differences = []

        for i, (storage_id, storage_count) in enumerate(storage_ranking):
            if i < len(db_ranking):
                db_entry = db_ranking[i]
                if db_entry.pokemon_id != storage_id or db_entry.favorite_count != storage_count:
                    is_consistent = False
                    differences.append({
                        "position": i + 1,
                        "storage": {"id": storage_id, "count": storage_count},
                        "database": {"id": db_entry.pokemon_id, "count": db_entry.favorite_count}
                    })
            else:
                is_consistent = False
                differences.append({
                    "position": i + 1,
                    "storage": {"id": storage_id, "count": storage_count},
                    "database": None
                })

        return {
            "database_ranking": [
                {
                    "position": i + 1,
                    "pokemon_id": entry.pokemon_id,
                    "pokemon_name": entry.pokemon_name,
                    "capture_count": entry.favorite_count,
                    "last_updated": entry.last_updated.isoformat() if entry.last_updated else None
                }
                for i, entry in enumerate(db_ranking)
            ],
            "storage_ranking": [
                {
                    "position": i + 1,
                    "pokemon_id": pokemon_id,
                    "capture_count": count,
                    "pokemon_name": self._get_pokemon_name(pokemon_id)
                }
                for i, (pokemon_id, count) in enumerate(storage_ranking)
            ],
            "is_consistent": is_consistent,
            "differences": differences,
            "storage_stats": self.storage_service.get_storage_stats()
        }

    def _get_pokemon_name(self, pokemon_id: int) -> str:
        """
        Obtém nome do pokémon por ID.
        TODO: Implementar cache ou busca na API/database.
        """
        # Mapeamento simples para os pokémons mais comuns
        pokemon_names = {
            1: "bulbasaur", 2: "ivysaur", 3: "venusaur", 4: "charmander",
            5: "charmeleon", 6: "charizard", 7: "squirtle", 8: "wartortle",
            9: "blastoise", 10: "caterpie", 11: "metapod", 12: "butterfree",
            13: "weedle", 14: "kakuna", 15: "beedrill", 16: "pidgey",
            17: "pidgeotto", 18: "pidgeot", 19: "rattata", 20: "raticate",
            21: "spearow", 22: "fearow", 23: "ekans", 24: "arbok",
            25: "pikachu", 26: "raichu", 27: "sandshrew", 28: "sandslash",
            29: "nidoran-f", 30: "nidorina", 31: "nidoqueen", 32: "nidoran-m",
            33: "nidorino", 34: "nidoking", 35: "clefairy", 36: "clefable",
            37: "vulpix", 38: "ninetales", 39: "jigglypuff", 40: "wigglytuff",
            94: "gengar", 130: "gyarados", 144: "articuno", 150: "mewtwo"
        }
        return pokemon_names.get(pokemon_id, f"pokemon_{pokemon_id}")

    def force_ranking_rebuild(self, db: Session) -> Dict[str, int]:
        """
        Força reconstrução completa do ranking.
        Remove todos os dados antigos e reconstrói baseado no storage.
        """
        logger.info("🔄 Forçando reconstrução completa do ranking")

        # Limpar tabela de ranking
        deleted_count = db.query(PokemonRanking).count()
        db.query(PokemonRanking).delete()

        # Reconstruir ranking
        stats = self.update_ranking_from_storage(db, force_update=True)
        stats["deleted_count"] = deleted_count

        logger.info(f"🎯 Ranking reconstruído: {deleted_count} removidos, {stats['inserted_count']} inseridos")
        return stats
