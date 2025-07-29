"""
Serviço de ranking baseado no armazenamento consolidado dos clientes.

Este módulo implementa a lógica de negócio para geração e atualização
do ranking global de Pokémons mais capturados, baseado nos dados
consolidados de todos os clientes conectados ao sistema.
"""

import logging
from typing import Dict, List
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.models import PokemonRanking
from app.services.client_storage_service import ClientStorageService

logger = logging.getLogger(__name__)


class RankingService:
    """
    Serviço para gerenciamento do ranking global de Pokémons.

    Responsável por calcular e manter atualizado o ranking dos Pokémons
    mais capturados baseado nos dados consolidados de todos os clientes
    conectados ao sistema pull-based.

    Attributes:
        storage_service: Serviço de armazenamento de dados dos clientes
    """

    def __init__(self, storage_service: ClientStorageService):
        """
        Inicializa o serviço de ranking.

        Args:
            storage_service: Instância do serviço de armazenamento de clientes
        """
        self.storage_service = storage_service

    def update_ranking_from_storage(self, db: Session, force_update: bool = False) -> Dict[str, int]:
        """
        Atualiza a tabela de ranking baseado nos dados consolidados do storage.

        Este método reconstrói completamente o ranking global removendo
        todas as entradas existentes e inserindo novos dados baseados
        nas capturas consolidadas de todos os clientes.

        Args:
            db: Sessão do banco de dados
            force_update: Se True, força atualização mesmo se não houver mudanças

        Returns:
            Dict[str, int]: Estatísticas da atualização contendo:
                - deleted_count: Número de entradas removidas
                - inserted_count: Número de entradas inseridas
                - errors_count: Número de erros durante inserção

        Note:
            Esta operação é custosa pois reconstrói todo o ranking.
            Use com moderação em sistemas com muitos dados.
        """
        logger.info("🏆 Iniciando atualização do ranking baseado no storage")

        # Obtém dados consolidados do ranking de todos os clientes
        ranking_data = self.storage_service.get_ranking_data(limit=100)
        logger.info(f"📊 Dados do ranking obtidos: {len(ranking_data)} entradas")

        # Remove todas as entradas existentes do ranking
        deleted_count = db.query(PokemonRanking).count()
        db.query(PokemonRanking).delete()
        logger.info(f"🗑️ Removidas {deleted_count} entradas antigas do ranking")

        # Insere novas entradas baseadas nos dados consolidados
        inserted_count = 0
        errors_count = 0

        for pokemon_id, capture_count in ranking_data:
            try:
                # Obtém nome do Pokémon (pode ser otimizado com cache futuro)
                pokemon_name = self._get_pokemon_name(pokemon_id)

                # Cria nova entrada de ranking
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
                errors_count += 1
                logger.error(f"❌ Erro ao inserir ranking para pokémon {pokemon_id}: {e}")

        # Persiste todas as mudanças no banco
        try:
            db.commit()
            logger.info(f"✅ Commit realizado com sucesso: {inserted_count} entradas inseridas")
        except Exception as e:
            logger.error(f"❌ Erro no commit: {e}")
            db.rollback()
            raise

        # Compila estatísticas da operação
        stats = {
            "deleted_count": deleted_count,
            "inserted_count": inserted_count,
            "errors_count": errors_count,
            "total_unique_pokemons": len(ranking_data),
            "top_pokemon_id": ranking_data[0][0] if ranking_data else None,
            "top_pokemon_count": ranking_data[0][1] if ranking_data else 0
        }

        logger.info(f"🎯 Ranking atualizado com sucesso: {inserted_count} entradas inseridas")
        return stats

    def get_ranking(self, db: Session, limit: int = 10) -> List[PokemonRanking]:
        """
        Retorna o ranking atual dos Pokémons mais capturados.

        Busca as entradas do ranking ordenadas por número de capturas
        em ordem decrescente, com desempate por ID do Pokémon.

        Args:
            db: Sessão do banco de dados
            limit: Número máximo de Pokémons no ranking (padrão: 10)

        Returns:
            List[PokemonRanking]: Lista ordenada das entradas do ranking
        """
        return (
            db.query(PokemonRanking)
            .order_by(
                PokemonRanking.favorite_count.desc(),
                PokemonRanking.pokemon_id.asc()  # Desempate por ID
            )
            .limit(limit)
            .all()
        )

    def get_ranking_with_storage_comparison(self, db: Session, limit: int = 10) -> Dict:
        """
        Retorna ranking atual e compara com dados do storage para verificação.

        Método útil para debug e verificação de consistência entre
        os dados persistidos no banco e os dados consolidados no storage.

        Args:
            db: Sessão do banco de dados
            limit: Número máximo de itens para comparação

        Returns:
            Dict: Dicionário contendo ranking do banco, storage e análise de consistência
        """
        # Obtém ranking atual do banco de dados
        db_ranking = self.get_ranking(db, limit)

        # Obtém ranking consolidado do storage
        storage_ranking = self.storage_service.get_ranking_data(limit)

        # Analisa consistência entre as duas fontes
        is_consistent = True
        differences = []

        # Compara posição por posição entre banco e storage
        for i, (storage_id, storage_count) in enumerate(storage_ranking):
            if i < len(db_ranking):
                db_entry = db_ranking[i]
                # Verifica se ID e contagem coincidem
                if db_entry.pokemon_id != storage_id or db_entry.favorite_count != storage_count:
                    is_consistent = False
                    differences.append({
                        "position": i + 1,
                        "storage": {"id": storage_id, "count": storage_count},
                        "database": {"id": db_entry.pokemon_id, "count": db_entry.favorite_count}
                    })
            else:
                # Storage tem mais entradas que o banco
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
        Obtém o nome do Pokémon baseado no seu ID.

        Implementação temporária usando mapeamento estático dos Pokémons
        mais comuns. Em produção, deveria usar cache ou busca na API/database.

        Args:
            pokemon_id: ID do Pokémon na PokeAPI

        Returns:
            str: Nome do Pokémon ou fallback "pokemon_{id}"

        TODO:
            Implementar cache persistente ou integração com PokeAPI
            para obter nomes de todos os Pokémons dinamicamente.
        """
        # Mapeamento estático dos Pokémons mais populares
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
        Força a reconstrução completa do ranking do zero.

        Remove todos os dados existentes do ranking e reconstrói
        completamente baseado nos dados consolidados do storage.

        Args:
            db: Sessão do banco de dados

        Returns:
            Dict[str, int]: Estatísticas da reconstrução incluindo:
                - deleted_count: Entradas removidas
                - inserted_count: Entradas inseridas
                - errors_count: Erros durante inserção

        Warning:
            Operação custosa que reconstrói todo o ranking.
            Use apenas quando necessário para correção de inconsistências.
        """
        logger.info("🔄 Iniciando reconstrução completa forçada do ranking")

        # Remove todas as entradas existentes
        deleted_count = db.query(PokemonRanking).count()
        db.query(PokemonRanking).delete()

        # Reconstrói ranking baseado no storage atual
        stats = self.update_ranking_from_storage(db, force_update=True)
        stats["deleted_count"] = deleted_count

        logger.info(f"🎯 Ranking reconstruído com sucesso: {deleted_count} removidos, {stats['inserted_count']} inseridos")
        return stats
