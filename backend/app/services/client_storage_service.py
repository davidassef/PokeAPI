"""
Serviço para gerenciar o armazenamento dos dados dos clientes.
Mantém um registro consolidado de todos os pokémons capturados por todos os clientes.
"""

import json
import logging
from typing import Dict, List, Tuple
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)


class ClientStorageService:
    """Serviço para gerenciar armazenamento consolidado dos dados dos clientes."""

    def __init__(self, storage_file: str = "client_storage.json"):
        self.storage_file = Path(storage_file)
        self.data = self._load_storage()

    def _load_storage(self) -> Dict:
        """Carrega dados do arquivo de armazenamento."""
        if self.storage_file.exists():
            try:
                with open(self.storage_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Erro ao carregar storage: {e}")
                return self._create_empty_storage()
        else:
            return self._create_empty_storage()

    def _create_empty_storage(self) -> Dict:
        """Cria estrutura vazia do storage."""
        return {
            "clients": {},  # user_id -> lista de pokémons capturados
            "pokemon_counts": {},  # pokemon_id -> contagem total
            "last_updated": datetime.now().isoformat(),
            "version": "1.0"
        }

    def _save_storage(self):
        """Salva dados no arquivo de armazenamento."""
        try:
            self.data["last_updated"] = datetime.now().isoformat()
            with open(self.storage_file, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
            logger.info(f"💾 Storage salvo: {self.storage_file}")
        except Exception as e:
            logger.error(f"Erro ao salvar storage: {e}")

    def update_client_captures(self, user_id: str, captured_pokemons: List[Dict]) -> Dict[str, int]:
        """
        Atualiza as capturas de um cliente específico.

        Args:
            user_id: ID do usuário/cliente
            captured_pokemons: Lista de pokémons capturados [{pokemon_id, pokemon_name, ...}]

        Returns:
            Dict com estatísticas da atualização
        """
        logger.info(f"🔄 Atualizando capturas do cliente {user_id}")

        # Converter lista para set de IDs para facilitar comparação
        new_pokemon_ids = {pokemon['pokemon_id'] for pokemon in captured_pokemons}
        old_pokemon_ids = set(self.data["clients"].get(user_id, []))

        # Calcular diferenças
        added = new_pokemon_ids - old_pokemon_ids
        removed = old_pokemon_ids - new_pokemon_ids

        # Atualizar dados do cliente
        self.data["clients"][user_id] = list(new_pokemon_ids)

        # Recalcular contagens globais
        self._recalculate_pokemon_counts()

        # Salvar mudanças
        self._save_storage()

        stats = {
            "added_count": len(added),
            "removed_count": len(removed),
            "total_captures": len(new_pokemon_ids),
            "added_pokemons": list(added),
            "removed_pokemons": list(removed)
        }

        logger.info(f"📊 Cliente {user_id}: +{len(added)}, -{len(removed)}, total: {len(new_pokemon_ids)}")
        return stats

    def _recalculate_pokemon_counts(self):
        """Recalcula as contagens globais de pokémons."""
        counts = {}

        # Contar pokémons de todos os clientes
        for user_id, pokemon_ids in self.data["clients"].items():
            for pokemon_id in pokemon_ids:
                counts[pokemon_id] = counts.get(pokemon_id, 0) + 1

        self.data["pokemon_counts"] = counts
        logger.info(f"🔢 Recalculadas contagens: {len(counts)} pokémons únicos")

    def get_pokemon_counts(self) -> Dict[int, int]:
        """Retorna contagens de pokémons (pokemon_id -> count)."""
        return self.data["pokemon_counts"].copy()

    def get_client_captures(self, user_id: str) -> List[int]:
        """Retorna pokémons capturados por um cliente específico."""
        return self.data["clients"].get(user_id, [])

    def get_all_clients(self) -> List[str]:
        """Retorna lista de todos os clientes."""
        return list(self.data["clients"].keys())

    def get_ranking_data(self, limit: int = 10) -> List[Tuple[int, int]]:
        """
        Retorna dados para ranking (pokemon_id, count) ordenados por:
        1. Maior contagem
        2. Menor ID (critério de desempate)

        Args:
            limit: Número máximo de pokémons no ranking

        Returns:
            Lista de tuplas (pokemon_id, count)
        """
        counts = self.get_pokemon_counts()

        # Ordenar por contagem (desc) e depois por ID (asc)
        sorted_pokemons = sorted(
            counts.items(),
            key=lambda x: (-x[1], x[0])  # -count, +pokemon_id
        )

        return sorted_pokemons[:limit]

    def get_storage_stats(self) -> Dict:
        """Retorna estatísticas do storage."""
        counts = self.get_pokemon_counts()
        return {
            "total_clients": len(self.data["clients"]),
            "total_unique_pokemons": len(counts),
            "total_captures": sum(counts.values()),
            "last_updated": self.data["last_updated"],
            "version": self.data["version"]
        }

    def remove_client(self, user_id: str) -> bool:
        """Remove um cliente e recalcula contagens."""
        if user_id in self.data["clients"]:
            del self.data["clients"][user_id]
            self._recalculate_pokemon_counts()
            self._save_storage()
            logger.info(f"🗑️ Cliente {user_id} removido do storage")
            return True
        return False

    def clear_storage(self):
        """Limpa todos os dados do storage."""
        self.data = self._create_empty_storage()
        self._save_storage()
        logger.info("🧹 Storage limpo")
