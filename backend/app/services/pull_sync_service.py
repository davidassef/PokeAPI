"""
Serviço para sistema pull-based de sincronização.
O backend puxa dados dos clientes ao invés de receber push.
"""
import httpx
import asyncio
import logging
import time
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.schemas.schemas import (
    ClientSyncData,
    PullRequest,
    PullResponse,
    CaptureData,
    ClientRegistration,
    FavoritePokemonCreate
)
from app.services.favorite_service import FavoriteService
from app.services.client_storage_service import ClientStorageService
from app.services.ranking_service import RankingService

logger = logging.getLogger(__name__)


class PullSyncService:
    """Serviço para puxar dados dos clientes."""

    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=30.0)
        self.registered_clients: Dict[str, ClientRegistration] = {}

        # Inicializar serviços de storage e ranking
        self.storage_service = ClientStorageService()
        self.ranking_service = RankingService(self.storage_service)

    async def register_client(self, registration: ClientRegistration) -> bool:
        """Registra um novo cliente para sincronização."""
        try:
            # Testar conectividade com o cliente
            response = await self.http_client.get(
                f"{registration.client_url}/api/client/health",
                timeout=10.0
            )

            if response.status_code == 200:
                self.registered_clients[registration.user_id] = registration
                logger.info(f"✅ Cliente registrado: {registration.user_id} -> {registration.client_url}")
                return True
            else:
                logger.warning(f"❌ Cliente não respondeu: {registration.client_url}")
                return False

        except Exception as e:
            logger.error(f"❌ Erro ao registrar cliente {registration.client_url}: {e}")
            return False

    async def unregister_client(self, user_id: str) -> bool:
        """Remove cliente do registro."""
        if user_id in self.registered_clients:
            del self.registered_clients[user_id]
            logger.info(f"🗑️  Cliente removido: {user_id}")
            return True
        return False

    async def get_registered_clients(self) -> List[ClientRegistration]:
        """Retorna lista de clientes registrados."""
        return list(self.registered_clients.values())

    async def pull_client_data(self, client_url: str, since: Optional[datetime] = None) -> Optional[ClientSyncData]:
        """Puxa dados de um cliente específico."""
        try:
            params = {}
            if since:
                params["since"] = since.isoformat()

            logger.info(f"🔍 Puxando dados de: {client_url}")

            response = await self.http_client.get(
                f"{client_url}/api/client/sync-data",
                params=params,
                timeout=15.0
            )

            if response.status_code == 200:
                data = response.json()
                sync_data = ClientSyncData(**data)
                logger.info(f"📥 Recebidos {len(sync_data.captures)} capturas de {client_url}")
                return sync_data
            else:
                logger.warning(f"❌ Cliente retornou erro {response.status_code}: {client_url}")
                return None

        except httpx.TimeoutException:
            logger.warning(f"⏰ Timeout ao consultar cliente: {client_url}")
            return None
        except Exception as e:
            logger.error(f"❌ Erro ao puxar dados de {client_url}: {e}")
            return None

    async def acknowledge_sync(self, client_url: str, capture_ids: List[str]) -> bool:
        """Confirma para o cliente que os dados foram sincronizados."""
        try:
            response = await self.http_client.post(
                f"{client_url}/api/client/acknowledge",
                json={"capture_ids": capture_ids},
                timeout=10.0
            )

            if response.status_code == 200:
                logger.info(f"✅ Sincronização confirmada para {len(capture_ids)} capturas em {client_url}")
                return True
            else:
                logger.warning(f"❌ Erro ao confirmar sync com {client_url}: {response.status_code}")
                return False

        except Exception as e:
            logger.error(f"❌ Erro ao confirmar sync com {client_url}: {e}")
            return False

    async def process_client_data(self, db: Session, sync_data: ClientSyncData) -> Dict[str, int]:
        """Processa dados recebidos de um cliente."""
        processed = 0
        failed = 0
        capture_ids_to_ack = []

        for capture in sync_data.captures:
            try:
                # Evitar duplicatas verificando timestamp + pokemon_id + user_id
                # (isso seria melhor implementado com um cache ou unique constraint)

                if capture.action in ("capture", "favorite") and not capture.synced:
                    # Mapear user_id string para user_id int (temporário)
                    user_id = 1  # Por enquanto usar ID fixo, depois implementar mapeamento

                    # Verificar se é uma remoção ou adição
                    is_removal = (hasattr(capture, 'metadata') and
                                  capture.metadata and
                                  capture.metadata.get('removed', False))

                    if is_removal:
                        # Processar remoção
                        result = FavoriteService.remove_favorite(db, user_id, capture.pokemon_id)

                        if result:
                            processed += 1
                            capture_ids_to_ack.append(capture.capture_id)
                            logger.info(f"🗑️  Removido: {capture.pokemon_name} (ID: {capture.pokemon_id})")
                        else:
                            logger.warning(f"⚠️  Não foi possível remover: {capture.pokemon_name} (ID: {capture.pokemon_id})")
                    else:
                        # Processar adição
                        fav_create = FavoritePokemonCreate(
                            user_id=user_id,
                            pokemon_id=capture.pokemon_id,
                            pokemon_name=capture.pokemon_name
                        )

                        result = FavoriteService.add_favorite(db, fav_create)
                        processed += 1
                        capture_ids_to_ack.append(capture.capture_id)

                        logger.info(f"📝 Adicionado: {capture.pokemon_name} (ID: {capture.pokemon_id})")

            except Exception as e:
                logger.error(f"❌ Erro ao processar captura {capture.capture_id}: {e}")
                failed += 1

        return {
            "processed": processed,
            "failed": failed,
            "capture_ids": capture_ids_to_ack
        }

    async def sync_all_clients(self, db: Session, since: Optional[datetime] = None) -> PullResponse:
        """Sincroniza todos os clientes registrados."""
        start_time = time.time()

        logger.info(f"🚀 Iniciando sync de {len(self.registered_clients)} clientes")

        clients_processed = 0
        total_captures = 0
        failed_clients = []
        errors = []

        for user_id, registration in self.registered_clients.items():
            try:
                # Puxar dados do cliente
                sync_data = await self.pull_client_data(registration.client_url, since)

                if sync_data:
                    # Processar dados
                    result = await self.process_client_data(db, sync_data)

                    # Confirmar sincronização se houve dados processados
                    if result["capture_ids"]:
                        await self.acknowledge_sync(
                            registration.client_url,
                            result["capture_ids"]
                        )

                    clients_processed += 1
                    total_captures += result["processed"]

                    logger.info(f"✅ Cliente {user_id}: {result['processed']} capturas processadas")
                else:
                    failed_clients.append(registration.client_url)
                    logger.warning(f"❌ Falha ao sincronizar cliente: {user_id}")

            except Exception as e:
                error_msg = f"Erro no cliente {user_id}: {str(e)}"
                errors.append(error_msg)
                failed_clients.append(registration.client_url)
                logger.error(error_msg)

        processing_time = time.time() - start_time

        logger.info(f"🎯 Sync concluído: {clients_processed} clientes, {total_captures} capturas, {processing_time:.2f}s")

        return PullResponse(
            success=len(failed_clients) == 0,
            clients_processed=clients_processed,
            total_captures=total_captures,
            failed_clients=failed_clients,
            errors=errors,
            processing_time=processing_time
        )

    async def sync_recent_changes(self, db: Session) -> PullResponse:
        """Sincroniza apenas mudanças recentes (últimos 15 minutos)."""
        since = datetime.now() - timedelta(minutes=15)
        return await self.sync_all_clients(db, since)

    async def cleanup_inactive_clients(self) -> int:
        """Remove clientes inativos."""
        inactive_clients = []

        for user_id, registration in self.registered_clients.items():
            try:
                response = await self.http_client.get(
                    f"{registration.client_url}/api/client/health",
                    timeout=5.0
                )

                if response.status_code != 200:
                    inactive_clients.append(user_id)

            except Exception:
                inactive_clients.append(user_id)

        # Remover clientes inativos
        for user_id in inactive_clients:
            await self.unregister_client(user_id)

        if inactive_clients:
            logger.info(f"🧹 Removidos {len(inactive_clients)} clientes inativos")

        return len(inactive_clients)

    async def close(self):
        """Fecha recursos."""
        await self.http_client.aclose()

    async def full_sync_with_consistency_check(self, db: Session) -> Dict[str, any]:
        """
        Sincronização completa com verificação de consistência.
        Garante que o banco de dados reflita exatamente o que está nos clientes.
        """
        start_time = time.time()
        logger.info("🔄 Iniciando sincronização completa com verificação de consistência")

        # 1. Coletar todos os Pokémons capturados de todos os clientes
        all_client_captures = set()  # Set de (user_id, pokemon_id)
        failed_clients = []

        for user_id, registration in self.registered_clients.items():
            try:
                # Obter TODOS os dados do cliente (não apenas pendentes)
                response = await self.http_client.get(
                    f"{registration.client_url}/api/client/all-captures",
                    timeout=15.0
                )

                if response.status_code == 200:
                    client_data = response.json()
                    captures = client_data.get('captures', [])

                    # Processar apenas capturas ativas (não removidas)
                    for capture in captures:
                        metadata = capture.get('metadata', {})
                        is_removed = metadata.get('removed', False)

                        if not is_removed and capture.get('action') in ('capture', 'favorite'):
                            # Mapear user_id string para int
                            mapped_user_id = 1  # Por enquanto fixo
                            all_client_captures.add((mapped_user_id, capture['pokemon_id']))

                    # Contar capturas ativas
                    active_captures = [c for c in captures
                                       if not c.get('metadata', {}).get('removed', False)]
                    logger.info("📱 Cliente %s: %d capturas ativas", user_id, len(active_captures))

                else:
                    logger.warning(f"❌ Cliente {registration.client_url} retornou erro {response.status_code}")
                    failed_clients.append(registration.client_url)

            except Exception as e:
                logger.error(f"❌ Erro ao consultar cliente {user_id}: {e}")
                failed_clients.append(registration.client_url)

        # 2. Obter todos os favoritos do banco de dados
        db_favorites = FavoriteService.get_user_favorites(db, 1)  # Por enquanto user_id fixo
        db_captures = set((fav.user_id, fav.pokemon_id) for fav in db_favorites)

        logger.info(f"🏗️  Capturas nos clientes: {len(all_client_captures)}")
        logger.info(f"🏛️  Favoritos no banco: {len(db_captures)}")

        # 3. Encontrar diferenças
        to_add = all_client_captures - db_captures  # Nos clientes mas não no banco
        to_remove = db_captures - all_client_captures  # No banco mas não nos clientes

        added_count = 0
        removed_count = 0

        # 4. Adicionar Pokémons que estão nos clientes mas não no banco
        for user_id, pokemon_id in to_add:
            try:
                # Encontrar nome do Pokémon (buscar nos dados dos clientes)
                pokemon_name = await self._get_pokemon_name_from_clients(pokemon_id)
                if pokemon_name:
                    fav_create = FavoritePokemonCreate(
                        user_id=user_id,
                        pokemon_id=pokemon_id,
                        pokemon_name=pokemon_name
                    )
                    FavoriteService.add_favorite(db, fav_create)
                    added_count += 1
                    logger.info(f"➕ Adicionado: {pokemon_name} (ID: {pokemon_id})")

            except Exception as e:
                logger.error(f"❌ Erro ao adicionar {pokemon_id}: {e}")

        # 5. Remover Pokémons que estão no banco mas não nos clientes
        for user_id, pokemon_id in to_remove:
            try:
                # Buscar nome antes de remover
                fav = next((f for f in db_favorites if f.pokemon_id == pokemon_id), None)
                pokemon_name = fav.pokemon_name if fav else f"pokemon_{pokemon_id}"

                result = FavoriteService.remove_favorite(db, user_id, pokemon_id)
                if result:
                    removed_count += 1
                    logger.info(f"➖ Removido: {pokemon_name} (ID: {pokemon_id})")

            except Exception as e:
                logger.error(f"❌ Erro ao remover {pokemon_id}: {e}")

        processing_time = time.time() - start_time

        result = {
            "success": len(failed_clients) == 0,
            "clients_checked": len(self.registered_clients),
            "failed_clients": failed_clients,
            "total_client_captures": len(all_client_captures),
            "total_db_favorites": len(db_captures),
            "added_count": added_count,
            "removed_count": removed_count,
            "processing_time": processing_time
        }

        logger.info(f"🎯 Sincronização completa concluída: +{added_count}, -{removed_count}, {processing_time:.2f}s")
        return result

    async def sync_complete_state(self, db: Session) -> Dict[str, any]:
        """
        Sincronização completa que garante que o banco reflita
        exatamente o que está nos clientes.
        """
        start_time = time.time()
        logger.info("🔄 Iniciando sincronização completa do estado...")

        try:
            # 1. Coletar todos os pokémons capturados de todos os clientes
            all_captured_pokemons = set()
            client_errors = []

            for user_id, registration in self.registered_clients.items():
                try:
                    # Buscar TODAS as capturas do cliente (não apenas pendentes)
                    response = await self.http_client.get(
                        f"{registration.client_url}/api/client/all-captures",
                        timeout=15.0
                    )

                    if response.status_code == 200:
                        data = response.json()
                        captures = data.get('captures', [])

                        # Filtrar apenas capturas ativas (não removidas)
                        for capture in captures:
                            if not capture.get('metadata', {}).get('removed', False):
                                all_captured_pokemons.add(capture['pokemon_id'])

                        active_captures = [c for c in captures
                                          if not c.get('metadata', {}).get('removed', False)]
                        logger.info(f"📥 Cliente {user_id}: {len(active_captures)} pokémons capturados")
                    else:
                        client_errors.append(f"Cliente {user_id} retornou {response.status_code}")

                except Exception as e:
                    client_errors.append(f"Erro no cliente {user_id}: {str(e)}")
                    logger.error(f"❌ Erro ao consultar cliente {user_id}: {e}")

            # 2. Buscar pokémons atualmente no banco de dados
            current_favorites = FavoriteService.get_user_favorites(db, 1)  # user_id fixo
            current_pokemon_ids = {fav.pokemon_id for fav in current_favorites}

            logger.info(f"📊 Estado atual - Clientes: {len(all_captured_pokemons)} | Banco: {len(current_pokemon_ids)}")

            # 3. Calcular diferenças
            to_add = all_captured_pokemons - current_pokemon_ids
            to_remove = current_pokemon_ids - all_captured_pokemons

            # 4. Aplicar mudanças
            added_count = 0
            removed_count = 0

            # Adicionar pokémons que estão nos clientes mas não no banco
            for pokemon_id in to_add:
                try:
                    # Buscar nome do pokémon (simplificado - poderia buscar da PokeAPI)
                    pokemon_name = f"pokemon_{pokemon_id}"  # Placeholder

                    fav_create = FavoritePokemonCreate(
                        user_id=1,
                        pokemon_id=pokemon_id,
                        pokemon_name=pokemon_name
                    )

                    FavoriteService.add_favorite(db, fav_create)
                    added_count += 1
                    logger.info(f"➕ Adicionado: {pokemon_name} (ID: {pokemon_id})")

                except Exception as e:
                    logger.error(f"❌ Erro ao adicionar pokémon {pokemon_id}: {e}")

            # Remover pokémons que estão no banco mas não nos clientes
            for pokemon_id in to_remove:
                try:
                    result = FavoriteService.remove_favorite(db, 1, pokemon_id)
                    if result:
                        removed_count += 1
                        logger.info(f"➖ Removido: pokémon ID {pokemon_id}")

                except Exception as e:
                    logger.error(f"❌ Erro ao remover pokémon {pokemon_id}: {e}")

            processing_time = time.time() - start_time

            result = {
                "success": True,
                "clients_consulted": len(self.registered_clients),
                "client_errors": client_errors,
                "total_captured_in_clients": len(all_captured_pokemons),
                "total_in_database": len(current_pokemon_ids),
                "added_to_database": added_count,
                "removed_from_database": removed_count,
                "processing_time": processing_time
            }

            logger.info(f"✅ Sincronização completa concluída: +{added_count} -{removed_count} em {processing_time:.2f}s")
            return result

        except Exception as e:
            logger.error(f"❌ Erro na sincronização completa: {e}")
            return {
                "success": False,
                "error": str(e),
                "processing_time": time.time() - start_time
            }
    async def cleanup_orphaned_and_duplicate_favorites(self, db: Session) -> Dict[str, any]:
        """
        Remove favoritos órfãos (sem usuários correspondentes) e duplicados.
        """
        start_time = time.time()
        logger.info("🧹 Iniciando limpeza de favoritos órfãos e duplicados...")

        try:
            # 1. Buscar todos os favoritos
            all_favorites = FavoriteService.get_all_favorites(db)
            logger.info(f"📊 Total de favoritos no banco: {len(all_favorites)}")

            # 2. Buscar todos os user_ids únicos
            user_ids = {fav.user_id for fav in all_favorites}
            logger.info(f"👥 User IDs únicos nos favoritos: {user_ids}")

            # 3. Verificar quais user_ids existem na tabela de usuários
            from app.models.user import User
            existing_users = db.query(User).filter(User.id.in_(user_ids)).all()
            existing_user_ids = {user.id for user in existing_users}

            logger.info(f"✅ User IDs existentes: {existing_user_ids}")

            # 4. Encontrar favoritos órfãos (sem usuário correspondente)
            orphaned_favorites = [fav for fav in all_favorites
                                  if fav.user_id not in existing_user_ids]

            # 5. Encontrar favoritos duplicados (mesmo user_id + pokemon_id)
            seen_combinations = set()
            duplicate_favorites = []

            for fav in all_favorites:
                combination = (fav.user_id, fav.pokemon_id)
                if combination in seen_combinations:
                    duplicate_favorites.append(fav)
                else:
                    seen_combinations.add(combination)

            logger.info(f"👻 Favoritos órfãos encontrados: {len(orphaned_favorites)}")
            logger.info(f"🔄 Favoritos duplicados encontrados: {len(duplicate_favorites)}")

            # 6. Remover favoritos órfãos
            orphaned_removed = 0
            for fav in orphaned_favorites:
                try:
                    db.delete(fav)
                    orphaned_removed += 1
                    logger.info(f"🗑️  Removido órfão: user_id={fav.user_id}, pokemon_id={fav.pokemon_id}")
                except Exception as e:
                    logger.error(f"❌ Erro ao remover órfão {fav.id}: {e}")

            # 7. Remover favoritos duplicados
            duplicates_removed = 0
            for fav in duplicate_favorites:
                try:
                    db.delete(fav)
                    duplicates_removed += 1
                    logger.info(f"🗑️  Removido duplicado: user_id={fav.user_id}, pokemon_id={fav.pokemon_id}")
                except Exception as e:
                    logger.error(f"❌ Erro ao remover duplicado {fav.id}: {e}")

            # 8. Commit das mudanças
            db.commit()

            processing_time = time.time() - start_time

            result = {
                "success": True,
                "total_favorites_before": len(all_favorites),
                "orphaned_removed": orphaned_removed,
                "duplicates_removed": duplicates_removed,
                "total_removed": orphaned_removed + duplicates_removed,
                "processing_time": processing_time
            }

            logger.info(f"✅ Limpeza concluída: {orphaned_removed} órfãos + {duplicates_removed} duplicados removidos em {processing_time:.2f}s")
            return result

        except Exception as e:
            logger.error(f"❌ Erro na limpeza: {e}")
            db.rollback()
            return {
                "success": False,
                "error": str(e),
                "processing_time": time.time() - start_time
            }

    async def _get_pokemon_name_from_clients(self, pokemon_id: int) -> Optional[str]:
        """Busca o nome do Pokémon nos dados dos clientes."""
        for user_id, registration in self.registered_clients.items():
            try:
                response = await self.http_client.get(
                    f"{registration.client_url}/api/client/all-captures",
                    timeout=10.0
                )

                if response.status_code == 200:
                    client_data = response.json()
                    captures = client_data.get('captures', [])

                    for capture in captures:
                        if capture.get('pokemon_id') == pokemon_id:
                            return capture.get('pokemon_name')

            except Exception:
                continue

        return f"pokemon_{pokemon_id}"  # Fallback

    async def sync_with_storage_system(self, db: Session) -> Dict[str, any]:
        """
        Sincronização completa usando o novo sistema de storage.

        1. Coleta dados de todos os clientes
        2. Atualiza o client_storage com os dados consolidados
        3. Atualiza o ranking baseado no storage
        4. Atualiza a tabela de favoritos para manter compatibilidade
        """
        start_time = time.time()
        logger.info("🔄 Iniciando sincronização com sistema de storage")

        clients_processed = 0
        failed_clients = []
        total_captures = 0

        try:
            # 1. Coletar dados de todos os clientes
            for user_id, registration in self.registered_clients.items():
                try:
                    # Buscar TODAS as capturas do cliente
                    response = await self.http_client.get(
                        f"{registration.client_url}/api/client/all-captures",
                        timeout=15.0
                    )

                    if response.status_code == 200:
                        client_data = response.json()
                        captures = client_data.get('captures', [])

                        # Filtrar apenas capturas ativas (não removidas)
                        active_captures = []
                        for capture in captures:
                            metadata = capture.get('metadata', {})
                            is_removed = metadata.get('removed', False)

                            if not is_removed and capture.get('action') in ('capture', 'favorite'):
                                active_captures.append({
                                    'pokemon_id': capture['pokemon_id'],
                                    'pokemon_name': capture['pokemon_name'],
                                    'timestamp': capture['timestamp']
                                })

                        # Atualizar storage do cliente
                        storage_stats = self.storage_service.update_client_captures(
                            user_id, active_captures
                        )

                        clients_processed += 1
                        total_captures += len(active_captures)

                        logger.info(
                            f"✅ Cliente {user_id}: {len(active_captures)} capturas ativas "
                            f"(+{storage_stats['added_count']}, -{storage_stats['removed_count']})"
                        )

                    else:
                        logger.warning(f"❌ Cliente {user_id} retornou erro {response.status_code}")
                        failed_clients.append(user_id)

                except Exception as e:
                    logger.error(f"❌ Erro ao processar cliente {user_id}: {e}")
                    failed_clients.append(user_id)

            # 2. Atualizar ranking baseado no storage
            ranking_stats = self.ranking_service.update_ranking_from_storage(db)

            # 3. Atualizar tabela de favoritos para manter compatibilidade
            favorites_stats = await self._sync_favorites_with_storage(db)

            processing_time = time.time() - start_time

            result = {
                "success": len(failed_clients) == 0,
                "clients_processed": clients_processed,
                "failed_clients": failed_clients,
                "total_captures": total_captures,
                "ranking_stats": ranking_stats,
                "favorites_stats": favorites_stats,
                "storage_stats": self.storage_service.get_storage_stats(),
                "processing_time": processing_time
            }

            logger.info(
                f"🎯 Sincronização com storage concluída: "
                f"{clients_processed} clientes, {total_captures} capturas, "
                f"{ranking_stats['inserted_count']} ranking entries, "
                f"{processing_time:.2f}s"
            )

            return result

        except Exception as e:
            logger.error(f"❌ Erro na sincronização com storage: {e}")
            return {
                "success": False,
                "error": str(e),
                "processing_time": time.time() - start_time
            }

    async def _sync_favorites_with_storage(self, db: Session) -> Dict[str, int]:
        """
        Sincroniza tabela de favoritos com dados do storage.
        Mantém compatibilidade com sistema legado.
        """
        logger.info("🔄 Sincronizando favoritos com storage")

        # Limpar favoritos atuais
        current_favorites = FavoriteService.get_user_favorites(db, 1)
        removed_count = 0

        for favorite in current_favorites:
            FavoriteService.remove_favorite(db, favorite.user_id, favorite.pokemon_id)
            removed_count += 1

        # Adicionar favoritos baseados no storage
        pokemon_counts = self.storage_service.get_pokemon_counts()
        added_count = 0

        for pokemon_id, count in pokemon_counts.items():
            try:
                # Adicionar como favorito (representa que foi capturado)
                pokemon_name = self.ranking_service._get_pokemon_name(pokemon_id)

                fav_create = FavoritePokemonCreate(
                    user_id=1,  # User ID fixo por enquanto
                    pokemon_id=pokemon_id,
                    pokemon_name=pokemon_name
                )

                FavoriteService.add_favorite(db, fav_create)
                added_count += 1

            except Exception as e:
                logger.error(f"Erro ao adicionar favorito {pokemon_id}: {e}")

        logger.info(f"✅ Favoritos sincronizados: -{removed_count}, +{added_count}")

        return {
            "removed_count": removed_count,
            "added_count": added_count,
            "total_favorites": added_count
        }

    async def get_storage_ranking(self, limit: int = 10) -> List[Dict]:
        """
        Retorna ranking baseado no storage (sem acessar banco de dados).
        """
        ranking_data = self.storage_service.get_ranking_data(limit)

        return [
            {
                "position": i + 1,
                "pokemon_id": pokemon_id,
                "pokemon_name": self.ranking_service._get_pokemon_name(pokemon_id),
                "capture_count": count
            }
            for i, (pokemon_id, count) in enumerate(ranking_data)
        ]

    async def get_storage_stats(self) -> Dict:
        """Retorna estatísticas do storage."""
        return self.storage_service.get_storage_stats()


# Instância global do serviço
pull_service = PullSyncService()
