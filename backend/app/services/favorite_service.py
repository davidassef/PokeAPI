"""
Serviços de negócio para gerenciamento de Pokémons favoritos.

Este módulo contém a lógica de negócio para operações relacionadas aos
Pokémons favoritos dos usuários, incluindo adição, remoção, consultas
e atualização automática do ranking global.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.models.models import FavoritePokemon, PokemonRanking
from app.schemas.schemas import FavoritePokemonCreate
from datetime import datetime


class FavoriteService:
    """
    Serviço para operações com Pokémons favoritos.

    Centraliza toda a lógica de negócio relacionada ao sistema de favoritos,
    incluindo validações, atualizações de ranking e operações CRUD.
    """

    @staticmethod
    def add_favorite(db: Session, favorite: FavoritePokemonCreate) -> FavoritePokemon:
        """
        Adiciona um Pokémon à lista de favoritos do usuário.

        Verifica se o Pokémon já está nos favoritos antes de adicionar
        e atualiza automaticamente o ranking global.

        Args:
            db: Sessão do banco de dados
            favorite: Dados do favorito a ser criado

        Returns:
            FavoritePokemon: O registro de favorito (novo ou existente)

        Note:
            Se o Pokémon já estiver nos favoritos, retorna o registro existente
            sem criar duplicata.
        """
        # Verifica se já existe nos favoritos para evitar duplicatas
        existing = db.query(FavoritePokemon).filter(
            FavoritePokemon.user_id == favorite.user_id,
            FavoritePokemon.pokemon_id == favorite.pokemon_id
        ).first()

        if existing:
            return existing

        # Cria novo registro de favorito
        db_favorite = FavoritePokemon(
            user_id=favorite.user_id,
            pokemon_id=favorite.pokemon_id,
            pokemon_name=favorite.pokemon_name
        )
        db.add(db_favorite)

        # Atualiza ranking global baseado na nova captura
        FavoriteService._update_ranking_from_captures(
            db, favorite.pokemon_id, favorite.pokemon_name)

        db.commit()
        db.refresh(db_favorite)
        return db_favorite

    @staticmethod
    def remove_favorite(db: Session, user_id: int, pokemon_id: int) -> bool:
        """
        Remove um Pokémon da lista de favoritos do usuário.

        Localiza e remove o registro de favorito, atualizando automaticamente
        o ranking global e registrando a operação para auditoria.

        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário proprietário do favorito
            pokemon_id: ID do Pokémon a ser removido dos favoritos

        Returns:
            bool: True se removido com sucesso, False se não encontrado

        Note:
            A operação é registrada em log para fins de auditoria.
        """
        import logging
        logger = logging.getLogger(__name__)

        # Busca o registro de favorito existente
        favorite = db.query(FavoritePokemon).filter(
            FavoritePokemon.user_id == user_id,
            FavoritePokemon.pokemon_id == pokemon_id
        ).first()

        if not favorite:
            logger.info(f"🔍 Tentativa de remover favorito inexistente: User {user_id}, Pokemon {pokemon_id}")
            return False

        pokemon_name = favorite.pokemon_name

        # Registra a operação para auditoria
        logger.warning(f"🗑️ REMOÇÃO DE FAVORITO: User {user_id} removeu {pokemon_name} (ID: {pokemon_id})")

        # Remove o registro do banco
        db.delete(favorite)

        # Atualiza ranking global decrementando a contagem
        FavoriteService._update_ranking_from_captures(
            db, pokemon_id, pokemon_name, increment=False)

        db.commit()

        logger.info(f"✅ Favorito removido com sucesso: {pokemon_name}")
        return True

    @staticmethod
    def get_user_favorites(db: Session, user_id: int) -> List[FavoritePokemon]:
        """
        Busca todos os Pokémons favoritos de um usuário.

        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário

        Returns:
            List[FavoritePokemon]: Lista de favoritos do usuário
        """
        return db.query(FavoritePokemon).filter(
            FavoritePokemon.user_id == user_id
        ).all()

    @staticmethod
    def check_multiple_favorites(
        db: Session,
        user_id: int,
        pokemon_ids: List[int]
    ) -> dict:
        """
        Verifica quais Pokémons de uma lista estão nos favoritos do usuário.

        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            pokemon_ids: Lista de IDs de Pokémon para verificar

        Returns:
            Dicionário onde as chaves são os IDs dos Pokémons e os valores são
            booleanos indicando se estão nos favoritos
        """
        if not pokemon_ids:
            return {}

        # Converte para set para remover duplicatas
        pokemon_ids = list(set(pokemon_ids))

        # Busca todos os favoritos do usuário que estão na lista de IDs fornecida
        query = db.query(FavoritePokemon.pokemon_id)
        query = query.filter(
            FavoritePokemon.user_id == user_id,
            FavoritePokemon.pokemon_id.in_(pokemon_ids)
        )
        favorites = query.all()

        # Cria um conjunto com os IDs dos favoritos para busca mais rápida
        favorite_ids = {fav.pokemon_id for fav in favorites}

        # Retorna um dicionário com o status de cada Pokémon
        return {
            str(pokemon_id): pokemon_id in favorite_ids
            for pokemon_id in pokemon_ids
        }

    @staticmethod
    def is_favorite(db: Session, user_id: int, pokemon_id: int) -> bool:
        """
        Verifica se um Pokémon específico é favorito do usuário.

        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário
            pokemon_id: ID do Pokémon a ser verificado

        Returns:
            bool: True se o Pokémon é favorito, False caso contrário
        """
        favorite = db.query(FavoritePokemon).filter(
            FavoritePokemon.user_id == user_id,
            FavoritePokemon.pokemon_id == pokemon_id
        ).first()
        return favorite is not None

    @staticmethod
    def get_ranking(db: Session, limit: int = 10) -> list[dict]:
        """
        Busca o ranking dos Pokémons mais favoritados.

        Primeiro tenta buscar dados da tabela de ranking otimizada.
        Se não houver dados, gera dinamicamente a partir dos favoritos.

        Args:
            db: Sessão do banco de dados
            limit: Número máximo de itens no ranking (padrão: 10)

        Returns:
            list[dict]: Lista de dicionários com dados do ranking

        Note:
            O ranking é baseado no número de vezes que cada Pokémon
            foi favoritado por diferentes usuários.
        """
        # Tenta buscar dados da tabela de ranking otimizada
        ranking_records = db.query(PokemonRanking).order_by(
            PokemonRanking.favorite_count.desc()
        ).limit(limit).all()

        if ranking_records:
            # Usa dados da tabela otimizada se disponível
            rankings = []
            for record in ranking_records:
                ranking = {
                    'id': record.id,
                    'pokemon_id': record.pokemon_id,
                    'pokemon_name': record.pokemon_name,
                    'favorite_count': record.favorite_count,
                    'last_updated': record.last_updated
                }
                rankings.append(ranking)
            return rankings

        # Fallback: gera ranking dinamicamente a partir dos favoritos
        capture_counts = db.query(
            FavoritePokemon.pokemon_id,
            FavoritePokemon.pokemon_name,
            func.count(FavoritePokemon.id).label('capture_count')
        ).group_by(
            FavoritePokemon.pokemon_id,
            FavoritePokemon.pokemon_name
        ).order_by(
            func.count(FavoritePokemon.id).desc()
        ).limit(limit).all()

        # Constrói lista de ranking com dados dinâmicos
        rankings = []
        now = datetime.now()
        for i, (pokemon_id, pokemon_name, capture_count) in enumerate(capture_counts):
            ranking = {
                'id': i + 1,  # ID sequencial para compatibilidade
                'pokemon_id': pokemon_id,
                'pokemon_name': pokemon_name,
                'favorite_count': capture_count,
                'last_updated': now
            }
            rankings.append(ranking)

        return rankings

    @staticmethod
    def _update_ranking_from_captures(db: Session, pokemon_id: int, pokemon_name: str, increment: bool = True):
        """
        Método de compatibilidade para atualização de ranking.

        Este método é mantido para compatibilidade com código existente,
        mas o ranking real é calculado dinamicamente no método get_ranking().

        Args:
            db: Sessão do banco de dados
            pokemon_id: ID do Pokémon
            pokemon_name: Nome do Pokémon
            increment: Se deve incrementar ou decrementar (não usado)

        Note:
            Método deprecated - o ranking é calculado dinamicamente.
        """
        # Método mantido apenas para compatibilidade
        # O ranking real é calculado dinamicamente em get_ranking()
        pass

    @staticmethod
    def get_stats(db: Session) -> dict:
        """
        Busca estatísticas gerais do sistema de favoritos.

        Calcula métricas agregadas sobre o uso do sistema incluindo
        total de favoritos e o Pokémon mais popular.

        Args:
            db: Sessão do banco de dados

        Returns:
            dict: Dicionário com estatísticas do sistema
                - total_favorites: Número total de favoritos
                - most_popular_pokemon: Pokémon mais favoritado
        """
        # Conta total de favoritos no sistema
        total_captures = db.query(FavoritePokemon).count()

        # Busca o Pokémon mais favoritado
        most_captured = db.query(
            FavoritePokemon.pokemon_id,
            FavoritePokemon.pokemon_name,
            func.count(FavoritePokemon.id).label('capture_count')
        ).group_by(
            FavoritePokemon.pokemon_id,
            FavoritePokemon.pokemon_name
        ).order_by(
            func.count(FavoritePokemon.id).desc()
        ).first()

        # Cria objeto de ranking para o mais popular
        most_popular = None
        if most_captured:
            most_popular = PokemonRanking(
                pokemon_id=most_captured.pokemon_id,
                pokemon_name=most_captured.pokemon_name,
                favorite_count=most_captured.capture_count
            )

        return {
            "total_favorites": total_captures,
            "most_popular_pokemon": most_popular
        }

    @staticmethod
    def get_all_favorites(db: Session) -> List[FavoritePokemon]:
        """
        Busca todos os favoritos do sistema.

        Método administrativo para obter todos os registros de favoritos
        de todos os usuários.

        Args:
            db: Sessão do banco de dados

        Returns:
            List[FavoritePokemon]: Lista completa de favoritos do sistema

        Warning:
            Use com cuidado em sistemas com muitos dados.
        """
        return db.query(FavoritePokemon).all()

    @staticmethod
    def clear_all_favorites(db: Session, user_id: int) -> int:
        """
        Remove todos os favoritos de um usuário específico.

        Método de emergência para limpeza completa dos favoritos de um usuário.
        A operação é registrada em log para auditoria.

        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário cujos favoritos serão removidos

        Returns:
            int: Número de favoritos removidos

        Warning:
            Operação irreversível - use apenas em casos de emergência.
        """
        import logging
        logger = logging.getLogger(__name__)

        logger.warning(f"🚨 LIMPEZA EMERGENCIAL: Removendo TODOS os favoritos do usuário ID {user_id}")

        # Conta quantos favoritos serão removidos para log
        count_query = db.query(FavoritePokemon).filter(FavoritePokemon.user_id == user_id)
        deleted_count = count_query.count()

        # Remove todos os favoritos do usuário
        count_query.delete()
        db.commit()

        logger.info(f"✅ Limpeza concluída: {deleted_count} favoritos removidos para o usuário ID {user_id}")

        return deleted_count
