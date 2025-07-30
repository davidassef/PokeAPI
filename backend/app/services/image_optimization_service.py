"""
Serviço de otimização de imagens para Pokémons.

Este módulo implementa técnicas avançadas de otimização de imagens incluindo:
- Compressão com qualidade ajustável
- Conversão para formatos mais eficientes (WebP)
- Redimensionamento inteligente
- Cache otimizado de imagens processadas
- Verificação de integridade
"""

import os
import asyncio
from pathlib import Path
from typing import Optional, Tuple, Dict, List
from PIL import Image
import logging
from datetime import datetime
import hashlib
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from app.core.database import Base

logger = logging.getLogger(__name__)


class OptimizedImageCache(Base):
    """
    Modelo para cache de imagens otimizadas.
    
    Armazena metadados das imagens processadas com diferentes níveis de otimização.
    """
    __tablename__ = "optimized_image_cache"

    id = Column(Integer, primary_key=True, index=True)
    pokemon_id = Column(Integer, nullable=False, index=True)
    image_type = Column(String(50), nullable=False)
    original_path = Column(String(500), nullable=False)
    optimized_path = Column(String(500), nullable=False)
    optimization_type = Column(String(20), nullable=False)  # 'compressed', 'webp', 'thumbnail'
    quality = Column(Integer, default=85)
    original_size = Column(Integer, default=0)
    optimized_size = Column(Integer, default=0)
    compression_ratio = Column(Integer, default=0)  # Porcentagem de redução
    dimensions = Column(String(20), nullable=True)  # "WxH"
    is_optimized = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ImageOptimizationService:
    """
    Serviço de otimização avançada de imagens dos Pokémons.
    
    Responsável por comprimir e otimizar imagens mantendo qualidade visual
    aceitável e reduzindo drasticamente o tamanho dos arquivos.
    """

    def __init__(self, optimized_dir: str = "app/data/optimized"):
        """
        Inicializa o serviço de otimização.
        
        Args:
            optimized_dir: Diretório para armazenar imagens otimizadas
        """
        self.optimized_dir = Path(optimized_dir)
        self.optimized_dir.mkdir(parents=True, exist_ok=True)
        
        # Configurações de otimização
        self.quality_settings = {
            'high': 95,    # Alta qualidade, menor compressão
            'medium': 85,  # Qualidade balanceada
            'low': 75,     # Alta compressão, qualidade aceitável
            'auto': 0      # Automático baseado no tamanho
        }
        
        # Tamanhos padrão para thumbnails
        self.thumbnail_sizes = {
            'small': (150, 150),
            'medium': (300, 300),
            'large': (500, 500)
        }
        
        logger.info(f"ImageOptimizationService inicializado: {self.optimized_dir}")

    async def optimize_pokemon_image(
        self, 
        db: Session, 
        pokemon_id: int, 
        image_type: str = 'official-artwork',
        optimization_type: str = 'medium',
        target_format: str = 'webp'
    ) -> Optional[str]:
        """
        Otimiza uma imagem de Pokémon com compressão inteligente.
        
        Args:
            db: Sessão do banco de dados
            pokemon_id: ID do Pokémon
            image_type: Tipo de imagem
            optimization_type: Nível de otimização ('high', 'medium', 'low', 'auto')
            target_format: Formato alvo ('webp', 'jpeg', 'png')
            
        Returns:
            Caminho da imagem otimizada ou None se falhou
        """
        try:
            from app.services.image_cache_service import ImageCacheService
            
            # Busca imagem original
            cache_service = ImageCacheService()
            original_path = await cache_service.get_pokemon_image(db, pokemon_id, image_type)
            
            if not original_path or not os.path.exists(original_path):
                logger.warning(f"Imagem original não encontrada: {pokemon_id}/{image_type}")
                return None

            # Verifica se já existe otimização
            existing = self._get_existing_optimization(
                db, pokemon_id, image_type, optimization_type, target_format
            )
            
            if existing and os.path.exists(existing.optimized_path):
                logger.info(f"Otimização já existe: {existing.optimized_path}")
                return existing.optimized_path

            # Processa otimização
            optimized_path = await self._process_optimization(
                original_path, pokemon_id, image_type, optimization_type, target_format
            )
            
            if optimized_path:
                # Registra no banco
                await self._save_optimization_record(
                    db, pokemon_id, image_type, original_path, optimized_path, 
                    optimization_type, target_format
                )
                
            return optimized_path

        except Exception as e:
            logger.error(f"Erro ao otimizar imagem {pokemon_id}: {e}")
            return None

    async def _process_optimization(
        self,
        original_path: str,
        pokemon_id: int,
        image_type: str,
        optimization_type: str,
        target_format: str
    ) -> Optional[str]:
        """
        Processa a otimização real da imagem.
        """
        try:
            with Image.open(original_path) as img:
                # Converte para RGB se necessário
                if img.mode in ('RGBA', 'LA') and target_format == 'jpeg':
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB' and target_format in ['jpeg', 'webp']:
                    img = img.convert('RGB')

                # Determina qualidade
                if optimization_type == 'auto':
                    quality = self._determine_optimal_quality(original_path)
                else:
                    quality = self.quality_settings.get(optimization_type, 85)

                # Define caminho otimizado
                filename = f"{pokemon_id}_{image_type}_{optimization_type}.{target_format}"
                optimized_path = self.optimized_dir / filename

                # Salva com otimização
                save_kwargs = {
                    'format': target_format.upper(),
                    'optimize': True,
                    'quality': quality
                }

                if target_format == 'webp':
                    save_kwargs['method'] = 6  # Método mais lento mas melhor compressão
                    save_kwargs['lossless'] = False

                # Salva imagem otimizada
                img.save(optimized_path, **save_kwargs)

                # Verifica integridade
                if os.path.exists(optimized_path):
                    original_size = os.path.getsize(original_path)
                    optimized_size = os.path.getsize(optimized_path)
                    compression_ratio = int(((original_size - optimized_size) / original_size) * 100)

                    logger.info(
                        f"Imagem otimizada: {pokemon_id}/{image_type} | "
                        f"{original_size} → {optimized_size} bytes | "
                        f"Redução: {compression_ratio}%"
                    )

                    return str(optimized_path)

        except Exception as e:
            logger.error(f"Erro no processamento de otimização: {e}")
            return None

    def _determine_optimal_quality(self, image_path: str) -> int:
        """
        Determina qualidade ótima baseada no tamanho original.
        """
        try:
            file_size = os.path.getsize(image_path)
            
            if file_size > 500000:  # > 500KB
                return 75
            elif file_size > 200000:  # > 200KB
                return 85
            else:
                return 95
                
        except:
            return 85

    def _get_existing_optimization(
        self, 
        db: Session, 
        pokemon_id: int, 
        image_type: str, 
        optimization_type: str, 
        target_format: str
    ) -> Optional[OptimizedImageCache]:
        """
        Busca otimização existente no banco.
        """
        return db.query(OptimizedImageCache).filter(
            OptimizedImageCache.pokemon_id == pokemon_id,
            OptimizedImageCache.image_type == image_type,
            OptimizedImageCache.optimization_type == optimization_type,
            OptimizedImageCache.is_optimized == True
        ).first()

    async def _save_optimization_record(
        self, 
        db: Session,
        pokemon_id: int,
        image_type: str,
        original_path: str,
        optimized_path: str,
        optimization_type: str,
        target_format: str
    ):
        """
        Salva registro de otimização no banco.
        """
        try:
            with Image.open(optimized_path) as img:
                dimensions = f"{img.width}x{img.height}"

            original_size = os.path.getsize(original_path)
            optimized_size = os.path.getsize(optimized_path)
            compression_ratio = int(((original_size - optimized_size) / original_size) * 100)

            # Remove registro antigo se existir
            existing = self._get_existing_optimization(
                db, pokemon_id, image_type, optimization_type, target_format
            )
            if existing:
                db.delete(existing)

            # Cria novo registro
            record = OptimizedImageCache(
                pokemon_id=pokemon_id,
                image_type=image_type,
                original_path=original_path,
                optimized_path=optimized_path,
                optimization_type=optimization_type,
                quality=self.quality_settings.get(optimization_type, 85),
                original_size=original_size,
                optimized_size=optimized_size,
                compression_ratio=compression_ratio,
                dimensions=dimensions,
                is_optimized=True
            )

            db.add(record)
            db.commit()

        except Exception as e:
            logger.error(f"Erro ao salvar registro de otimização: {e}")
            db.rollback()

    async def batch_optimize_images(
        self,
        db: Session,
        pokemon_ids: List[int],
        image_types: List[str] = None,
        optimization_type: str = 'medium'
    ) -> Dict[str, int]:
        """
        Otimiza imagens em lote para múltiplos Pokémons.
        
        Args:
            db: Sessão do banco de dados
            pokemon_ids: Lista de IDs dos Pokémons
            image_types: Tipos de imagem a otimizar
            optimization_type: Nível de otimização
            
        Returns:
            Estatísticas da otimização
        """
        if image_types is None:
            image_types = ['official-artwork', 'sprite', 'home']

        stats = {
            'total': len(pokemon_ids) * len(image_types),
            'optimized': 0,
            'failed': 0,
            'skipped': 0
        }

        for pokemon_id in pokemon_ids:
            for image_type in image_types:
                try:
                    result = await self.optimize_pokemon_image(
                        db, pokemon_id, image_type, optimization_type
                    )
                    if result:
                        stats['optimized'] += 1
                    else:
                        stats['failed'] += 1
                except Exception as e:
                    logger.error(f"Erro ao otimizar {pokemon_id}/{image_type}: {e}")
                    stats['failed'] += 1

        return stats

    def get_optimization_stats(self, db: Session) -> Dict[str, any]:
        """
        Retorna estatísticas de otimização.
        """
        try:
            total_images = db.query(OptimizedImageCache).count()
            optimized_images = db.query(OptimizedImageCache).filter(
                OptimizedImageCache.is_optimized == True
            ).count()

            total_original_size = db.query(OptimizedImageCache).filter(
                OptimizedImageCache.is_optimized == True
            ).with_entities(db.func.sum(OptimizedImageCache.original_size)).scalar() or 0

            total_optimized_size = db.query(OptimizedImageCache).filter(
                OptimizedImageCache.is_optimized == True
            ).with_entities(db.func.sum(OptimizedImageCache.optimized_size)).scalar() or 0

            avg_compression = db.query(OptimizedImageCache).filter(
                OptimizedImageCache.is_optimized == True
            ).with_entities(db.func.avg(OptimizedImageCache.compression_ratio)).scalar() or 0

            return {
                'total_optimized_images': optimized_images,
                'total_processed': total_images,
                'total_original_size_mb': round(total_original_size / (1024 * 1024), 2),
                'total_optimized_size_mb': round(total_optimized_size / (1024 * 1024), 2),
                'space_saved_mb': round((total_original_size - total_optimized_size) / (1024 * 1024), 2),
                'average_compression_ratio': round(avg_compression, 1),
                'compression_percentage': round(
                    ((total_original_size - total_optimized_size) / total_original_size * 100) if total_original_size > 0 else 0,
                    1
                )
            }

        except Exception as e:
            logger.error(f"Erro ao obter estatísticas: {e}")
            return {}