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
            # Verifica se já existe no cache
            cache_entry = db.query(PokemonImageCache).filter(
                PokemonImageCache.pokemon_id == pokemon_id,
                PokemonImageCache.image_type == image_type,
                PokemonImageCache.is_downloaded == True
            ).first()
            
            if cache_entry and os.path.exists(cache_entry.local_path):
                logger.debug(f"Imagem encontrada no cache: {cache_entry.local_path}")
                return cache_entry.local_path
            
            # Tenta baixar a imagem
            return await self._download_pokemon_image(db, pokemon_id, image_type)
            
        except Exception as e:
            logger.error(f"Erro ao obter imagem do Pokémon {pokemon_id}: {e}")
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
                # Atualiza ou cria entrada no cache
                if existing_entry:
                    existing_entry.local_path = str(local_path)
                    existing_entry.is_downloaded = True
                    existing_entry.download_attempts += 1
                    existing_entry.last_attempt = datetime.utcnow()
                    existing_entry.file_size = os.path.getsize(local_path)
                    existing_entry.updated_at = datetime.utcnow()
                else:
                    cache_entry = PokemonImageCache(
                        pokemon_id=pokemon_id,
                        image_type=image_type,
                        original_url=original_url,
                        local_path=str(local_path),
                        file_size=os.path.getsize(local_path),
                        is_downloaded=True,
                        download_attempts=1,
                        last_attempt=datetime.utcnow()
                    )
                    db.add(cache_entry)
                
                db.commit()
                logger.info(f"Imagem baixada com sucesso: {pokemon_id}/{image_type}")
                return str(local_path)
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
        Baixa uma imagem de uma URL para um arquivo local.
        
        Args:
            url: URL da imagem
            local_path: Caminho local onde salvar
            
        Returns:
            True se baixou com sucesso, False caso contrário
        """
        try:
            timeout = aiohttp.ClientTimeout(total=self.timeout_seconds)
            
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        content = await response.read()
                        
                        # Verifica se é uma imagem válida (pelo menos 1KB)
                        if len(content) < 1024:
                            logger.warning(f"Imagem muito pequena, provavelmente inválida: {url}")
                            return False
                        
                        # Salva o arquivo
                        with open(local_path, 'wb') as f:
                            f.write(content)
                        
                        logger.debug(f"Imagem baixada: {url} -> {local_path}")
                        return True
                    else:
                        logger.warning(f"Falha ao baixar imagem - Status {response.status}: {url}")
                        return False
                        
        except asyncio.TimeoutError:
            logger.warning(f"Timeout ao baixar imagem: {url}")
            return False
        except Exception as e:
            logger.error(f"Erro ao baixar imagem {url}: {e}")
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
