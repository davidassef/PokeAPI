"""
Serviço de cache de imagens dos Pokémons.

Este módulo implementa um sistema robusto de cache de imagens que:
- Baixa imagens da PokeAPI e GitHub
- Armazena localmente no servidor
- Serve imagens através do backend
- Elimina dependência de APIs externas
- Melhora performance e confiabilidade
"""

import os
import aiohttp
import asyncio
import hashlib
from pathlib import Path
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from app.core.database import Base

logger = logging.getLogger(__name__)


class PokemonImageCache(Base):
    """
    Modelo para cache de imagens dos Pokémons.

    Armazena metadados das imagens cacheadas incluindo URLs originais,
    caminhos locais, status de download e timestamps.
    """

    __tablename__ = "pokemon_image_cache"

    # Campos principais
    id = Column(Integer, primary_key=True, index=True)
    pokemon_id = Column(Integer, nullable=False, index=True)
    image_type = Column(String(50), nullable=False)  # 'official-artwork', 'sprite', 'shiny', etc.
    original_url = Column(Text, nullable=False)
    local_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)

    # Status e controle
    is_downloaded = Column(Boolean, default=False)
    download_attempts = Column(Integer, default=0)
    last_attempt = Column(DateTime, nullable=True)

    # Auditoria
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ImageCacheService:
    """
    Serviço para gerenciamento de cache de imagens dos Pokémons.

    Responsável por baixar, armazenar e servir imagens dos Pokémons
    de forma otimizada e confiável.
    """

    def __init__(self, cache_dir: str = "pokemon_images"):
        """
        Inicializa o serviço de cache de imagens.

        Args:
            cache_dir: Diretório base para armazenar as imagens
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        # URLs base para diferentes tipos de imagem
        self.image_urls = {
            'official-artwork': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{}.png',
            'sprite': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{}.png',
            'sprite-shiny': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/{}.png',
            'home': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/{}.png',
            'home-shiny': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/{}.png'
        }

        # Configurações
        self.max_download_attempts = 3
        self.retry_delay_hours = 24
        self.timeout_seconds = 30

        logger.info(f"ImageCacheService inicializado com diretório: {self.cache_dir}")

    async def get_pokemon_image(self, db: Session, pokemon_id: int, image_type: str = 'official-artwork') -> Optional[str]:
        """
        Obtém o caminho local de uma imagem do Pokémon.

        Se a imagem não estiver em cache, tenta baixá-la.

        Args:
            db: Sessão do banco de dados
            pokemon_id: ID do Pokémon (1-1010+)
            image_type: Tipo de imagem desejada

        Returns:
            Caminho local da imagem ou None se não disponível
        """
        try:
            logger.info(f"🔍 Solicitação de imagem: Pokémon {pokemon_id}, tipo {image_type}")

            # PRIORIDADE MÁXIMA: Verifica se já existe no cache local
            cache_entry = db.query(PokemonImageCache).filter(
                PokemonImageCache.pokemon_id == pokemon_id,
                PokemonImageCache.image_type == image_type,
                PokemonImageCache.is_downloaded == True
            ).first()

            if cache_entry and os.path.exists(cache_entry.local_path):
                # Verifica integridade do arquivo
                if self._verify_image_integrity(cache_entry.local_path, cache_entry.file_size):
                    logger.info(f"✅ CACHE HIT: Servindo do cache local: {cache_entry.local_path}")
                    logger.info(f"📁 Arquivo: {cache_entry.file_size} bytes, criado em {cache_entry.created_at}")
                    return cache_entry.local_path
                else:
                    logger.warning(f"⚠️ Arquivo corrompido detectado, removendo: {cache_entry.local_path}")
                    # Remove arquivo corrompido
                    try:
                        os.remove(cache_entry.local_path)
                        logger.info(f"🗑️ Arquivo corrompido removido: {cache_entry.local_path}")
                    except Exception as e:
                        logger.error(f"❌ Erro ao remover arquivo corrompido: {e}")
                    # Marca como não baixado para forçar novo download
                    cache_entry.is_downloaded = False
                    cache_entry.updated_at = datetime.utcnow()
                    db.commit()
                    logger.info(f"🔄 Cache marcado para re-download: {pokemon_id}/{image_type}")
            elif cache_entry:
                logger.warning(f"⚠️ Entrada no cache existe mas arquivo não encontrado: {cache_entry.local_path}")
                # Marca como não baixado para forçar novo download
                cache_entry.is_downloaded = False
                cache_entry.updated_at = datetime.utcnow()
                db.commit()

            # Tenta baixar a imagem
            logger.info(f"📥 Iniciando download: Pokémon {pokemon_id}, tipo {image_type}")
            result = await self._download_pokemon_image(db, pokemon_id, image_type)

            if result:
                logger.info(f"✅ Download concluído com sucesso: {result}")
            else:
                logger.warning(f"❌ Falha no download: Pokémon {pokemon_id}, tipo {image_type}")

            return result

        except Exception as e:
            logger.error(f"❌ Erro crítico ao obter imagem do Pokémon {pokemon_id}: {e}")
            import traceback
            logger.error(f"Stack trace: {traceback.format_exc()}")
            return None

    async def _download_pokemon_image(self, db: Session, pokemon_id: int, image_type: str) -> Optional[str]:
        """
        Baixa uma imagem do Pokémon e armazena localmente.

        Args:
            db: Sessão do banco de dados
            pokemon_id: ID do Pokémon
            image_type: Tipo de imagem

        Returns:
            Caminho local da imagem baixada ou None se falhou
        """
        try:
            # Verifica se deve tentar baixar (controle de retry)
            existing_entry = db.query(PokemonImageCache).filter(
                PokemonImageCache.pokemon_id == pokemon_id,
                PokemonImageCache.image_type == image_type
            ).first()

            if existing_entry and not self._should_retry_download(existing_entry):
                logger.debug(f"Pulando download - muitas tentativas recentes: {pokemon_id}/{image_type}")
                return None

            # Constrói URL da imagem
            if image_type not in self.image_urls:
                logger.warning(f"Tipo de imagem não suportado: {image_type}")
                return None

            original_url = self.image_urls[image_type].format(pokemon_id)

            # Define caminho local
            filename = f"{pokemon_id}_{image_type}.png"
            local_path = self.cache_dir / filename

            # Baixa a imagem
            success = await self._download_image(original_url, local_path)

            if success:
                # GARANTIA CRÍTICA: Salva no cache local
                file_size = os.path.getsize(local_path)

                if existing_entry:
                    # Atualiza entrada existente
                    existing_entry.local_path = str(local_path)
                    existing_entry.is_downloaded = True
                    existing_entry.download_attempts += 1
                    existing_entry.last_attempt = datetime.utcnow()
                    existing_entry.file_size = file_size
                    existing_entry.updated_at = datetime.utcnow()
                    logger.info(f"📝 Atualizando entrada existente no cache")
                else:
                    # Cria nova entrada no cache
                    cache_entry = PokemonImageCache(
                        pokemon_id=pokemon_id,
                        image_type=image_type,
                        original_url=original_url,
                        local_path=str(local_path),
                        file_size=file_size,
                        is_downloaded=True,
                        download_attempts=1,
                        last_attempt=datetime.utcnow()
                    )
                    db.add(cache_entry)
                    logger.info(f"📝 Criando nova entrada no cache")

                # COMMIT CRÍTICO: Garante persistência no banco
                db.commit()

                # VERIFICAÇÃO FINAL: Confirma que tudo foi salvo
                verification_entry = db.query(PokemonImageCache).filter(
                    PokemonImageCache.pokemon_id == pokemon_id,
                    PokemonImageCache.image_type == image_type,
                    PokemonImageCache.is_downloaded == True
                ).first()

                if verification_entry and os.path.exists(verification_entry.local_path):
                    logger.info(f"✅ SUCESSO TOTAL: Imagem salva e verificada")
                    logger.info(f"📁 Arquivo: {verification_entry.local_path} ({file_size} bytes)")
                    logger.info(f"💾 Banco: ID={verification_entry.id}, downloaded={verification_entry.is_downloaded}")
                    return str(local_path)
                else:
                    logger.error(f"❌ ERRO CRÍTICO: Falha na verificação pós-salvamento")
                    return None
            else:
                # Registra tentativa falhada
                if existing_entry:
                    existing_entry.download_attempts += 1
                    existing_entry.last_attempt = datetime.utcnow()
                else:
                    cache_entry = PokemonImageCache(
                        pokemon_id=pokemon_id,
                        image_type=image_type,
                        original_url=original_url,
                        local_path=str(local_path),
                        is_downloaded=False,
                        download_attempts=1,
                        last_attempt=datetime.utcnow()
                    )
                    db.add(cache_entry)

                db.commit()
                return None

        except Exception as e:
            logger.error(f"Erro ao baixar imagem {pokemon_id}/{image_type}: {e}")
            return None

    async def _download_image(self, url: str, local_path: Path) -> bool:
        """
        Baixa uma imagem de uma URL para um arquivo local com verificações robustas.

        Args:
            url: URL da imagem
            local_path: Caminho local onde salvar

        Returns:
            True se baixou com sucesso, False caso contrário
        """
        try:
            logger.info(f"🌐 Iniciando download de: {url}")

            # Configuração de timeout mais robusta
            timeout = aiohttp.ClientTimeout(
                total=self.timeout_seconds,
                connect=10,  # 10s para conectar
                sock_read=20  # 20s para ler dados
            )

            # Headers para simular browser real
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache'
            }

            async with aiohttp.ClientSession(timeout=timeout, headers=headers) as session:
                async with session.get(url) as response:
                    logger.info(f"📡 Resposta recebida: Status {response.status} para {url}")

                    if response.status == 200:
                        content = await response.read()
                        content_length = len(content)

                        logger.info(f"📦 Conteúdo baixado: {content_length} bytes")

                        # Verificações de integridade mais rigorosas
                        if content_length < 500:
                            logger.warning(f"⚠️ Imagem muito pequena ({content_length} bytes), provavelmente inválida: {url}")
                            return False

                        # Verifica se é realmente uma imagem (magic bytes)
                        if not self._is_valid_image_content(content):
                            logger.warning(f"⚠️ Conteúdo não é uma imagem válida: {url}")
                            return False

                        # Cria diretório se não existir
                        local_path.parent.mkdir(parents=True, exist_ok=True)

                        # Salva o arquivo com verificação
                        try:
                            with open(local_path, 'wb') as f:
                                f.write(content)

                            # Verifica se o arquivo foi salvo corretamente
                            if not os.path.exists(local_path):
                                logger.error(f"❌ Arquivo não foi criado: {local_path}")
                                return False

                            saved_size = os.path.getsize(local_path)
                            if saved_size != content_length:
                                logger.error(f"❌ Tamanho do arquivo salvo ({saved_size}) difere do baixado ({content_length})")
                                os.remove(local_path)
                                return False

                            logger.info(f"✅ Imagem salva com sucesso: {local_path} ({saved_size} bytes)")
                            return True

                        except Exception as save_error:
                            logger.error(f"❌ Erro ao salvar arquivo {local_path}: {save_error}")
                            # Remove arquivo parcial se existir
                            if os.path.exists(local_path):
                                try:
                                    os.remove(local_path)
                                except:
                                    pass
                            return False

                    else:
                        logger.warning(f"❌ Falha no download - Status {response.status}: {url}")
                        return False

        except asyncio.TimeoutError:
            logger.warning(f"⏰ Timeout ao baixar imagem: {url}")
            return False
        except aiohttp.ClientError as e:
            logger.error(f"🌐 Erro de rede ao baixar {url}: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Erro inesperado ao baixar {url}: {e}")
            import traceback
            logger.error(f"Stack trace: {traceback.format_exc()}")
            return False

    def _should_retry_download(self, cache_entry: PokemonImageCache) -> bool:
        """
        Verifica se deve tentar baixar novamente uma imagem.

        Args:
            cache_entry: Entrada do cache

        Returns:
            True se deve tentar novamente, False caso contrário
        """
        if cache_entry.download_attempts >= self.max_download_attempts:
            return False

        if cache_entry.last_attempt:
            time_since_last = datetime.utcnow() - cache_entry.last_attempt
            if time_since_last < timedelta(hours=self.retry_delay_hours):
                return False

        return True

    async def preload_pokemon_images(self, db: Session, pokemon_ids: List[int], image_types: List[str] = None) -> Dict[str, int]:
        """
        Pré-carrega imagens de múltiplos Pokémons.

        Args:
            db: Sessão do banco de dados
            pokemon_ids: Lista de IDs dos Pokémons
            image_types: Tipos de imagem a baixar (padrão: ['official-artwork'])

        Returns:
            Estatísticas do preload (sucesso, falhas, etc.)
        """
        if image_types is None:
            image_types = ['official-artwork']

        stats = {
            'total': len(pokemon_ids) * len(image_types),
            'success': 0,
            'failed': 0,
            'skipped': 0
        }

        logger.info(f"Iniciando preload de {stats['total']} imagens...")

        # Processa em lotes para não sobrecarregar
        batch_size = 10
        for i in range(0, len(pokemon_ids), batch_size):
            batch = pokemon_ids[i:i + batch_size]

            tasks = []
            for pokemon_id in batch:
                for image_type in image_types:
                    task = self.get_pokemon_image(db, pokemon_id, image_type)
                    tasks.append((pokemon_id, image_type, task))

            # Executa lote
            results = await asyncio.gather(*[task for _, _, task in tasks], return_exceptions=True)

            # Processa resultados
            for (pokemon_id, image_type, _), result in zip(tasks, results):
                if isinstance(result, Exception):
                    stats['failed'] += 1
                    logger.error(f"Erro no preload {pokemon_id}/{image_type}: {result}")
                elif result:
                    stats['success'] += 1
                else:
                    stats['skipped'] += 1

            # Pequena pausa entre lotes
            await asyncio.sleep(0.5)

        logger.info(f"Preload concluído: {stats}")
        return stats

    def get_cache_stats(self, db: Session) -> Dict:
        """
        Obtém estatísticas do cache de imagens.

        Args:
            db: Sessão do banco de dados

        Returns:
            Dicionário com estatísticas do cache
        """
        try:
            total_entries = db.query(PokemonImageCache).count()
            downloaded = db.query(PokemonImageCache).filter(PokemonImageCache.is_downloaded == True).count()
            failed = db.query(PokemonImageCache).filter(
                PokemonImageCache.is_downloaded == False,
                PokemonImageCache.download_attempts >= self.max_download_attempts
            ).count()

            # Calcula tamanho total do cache
            total_size = 0
            cache_entries = db.query(PokemonImageCache).filter(PokemonImageCache.is_downloaded == True).all()
            for entry in cache_entries:
                if os.path.exists(entry.local_path):
                    total_size += entry.file_size

            return {
                'total_entries': total_entries,
                'downloaded': downloaded,
                'failed': failed,
                'pending': total_entries - downloaded - failed,
                'total_size_mb': round(total_size / (1024 * 1024), 2),
                'cache_directory': str(self.cache_dir)
            }

        except Exception as e:
            logger.error(f"Erro ao obter estatísticas do cache: {e}")
            return {}

    def _verify_image_integrity(self, file_path: str, expected_size: int) -> bool:
        """
        Verifica a integridade de um arquivo de imagem.

        Args:
            file_path: Caminho do arquivo
            expected_size: Tamanho esperado em bytes

        Returns:
            True se o arquivo está íntegro, False caso contrário
        """
        try:
            if not os.path.exists(file_path):
                return False

            # Verifica tamanho
            actual_size = os.path.getsize(file_path)
            if actual_size != expected_size:
                logger.warning(f"Tamanho incorreto: esperado {expected_size}, atual {actual_size}")
                return False

            # Verifica se é uma imagem válida lendo os primeiros bytes
            with open(file_path, 'rb') as f:
                header = f.read(20)
                if not self._is_valid_image_content(header):
                    logger.warning(f"Header de imagem inválido: {file_path}")
                    return False

            return True

        except Exception as e:
            logger.error(f"Erro ao verificar integridade de {file_path}: {e}")
            return False

    def _is_valid_image_content(self, content: bytes) -> bool:
        """
        Verifica se o conteúdo é de uma imagem válida baseado nos magic bytes.

        Args:
            content: Primeiros bytes do arquivo

        Returns:
            True se é uma imagem válida, False caso contrário
        """
        if len(content) < 4:
            return False

        # Magic bytes para diferentes formatos de imagem
        image_signatures = [
            b'\x89PNG\r\n\x1a\n',  # PNG
            b'\xff\xd8\xff',       # JPEG
            b'GIF87a',             # GIF87a
            b'GIF89a',             # GIF89a
            b'RIFF',               # WebP (começa com RIFF)
            b'BM',                 # BMP
        ]

        for signature in image_signatures:
            if content.startswith(signature):
                return True

        # Verifica WebP especificamente (RIFF...WEBP)
        if content.startswith(b'RIFF') and len(content) >= 12:
            if content[8:12] == b'WEBP':
                return True

        return False

    async def force_download_image(self, db: Session, pokemon_id: int, image_type: str = 'official-artwork') -> Optional[str]:
        """
        Força o download de uma imagem, ignorando cache e tentativas anteriores.

        Útil para reprocessar imagens corrompidas ou atualizadas.

        Args:
            db: Sessão do banco de dados
            pokemon_id: ID do Pokémon
            image_type: Tipo de imagem

        Returns:
            Caminho local da imagem ou None se falhou
        """
        try:
            logger.info(f"🔄 Forçando download: Pokémon {pokemon_id}, tipo {image_type}")

            # Remove entrada existente do cache
            existing_entry = db.query(PokemonImageCache).filter(
                PokemonImageCache.pokemon_id == pokemon_id,
                PokemonImageCache.image_type == image_type
            ).first()

            if existing_entry:
                # Remove arquivo físico se existir
                if os.path.exists(existing_entry.local_path):
                    try:
                        os.remove(existing_entry.local_path)
                        logger.info(f"🗑️ Arquivo antigo removido: {existing_entry.local_path}")
                    except Exception as e:
                        logger.warning(f"Erro ao remover arquivo antigo: {e}")

                # Remove entrada do banco
                db.delete(existing_entry)
                db.commit()
                logger.info(f"🗑️ Entrada do cache removida do banco")

            # Força novo download
            return await self._download_pokemon_image(db, pokemon_id, image_type)

        except Exception as e:
            logger.error(f"Erro ao forçar download {pokemon_id}/{image_type}: {e}")
            return None

    async def download_image_async(self, pokemon_id: int, image_type: str = 'official-artwork') -> bool:
        """
        Método assíncrono para download de imagem, usado pelo retry script.

        Args:
            pokemon_id: ID do Pokémon
            image_type: Tipo de imagem

        Returns:
            True se o download foi bem-sucedido, False caso contrário
        """
        from app.core.database import SessionLocal
        
        db = SessionLocal()
        try:
            result = await self._download_pokemon_image(db, pokemon_id, image_type)
            return result is not None
        finally:
            db.close()
