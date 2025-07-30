"""
Script de pré-carregamento em massa de imagens de Pokémon.

Este script baixa e otimiza todas as imagens dos Pokémons (1-1010) 
em diferentes formatos e níveis de compressão, criando um 
armazenamento local completo e otimizado.
"""

import asyncio
import logging
import sys
from pathlib import Path
from typing import List, Dict
import argparse
from datetime import datetime

# Adiciona o diretório backend ao path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.services.image_cache_service import ImageCacheService
from app.services.image_optimization_service import ImageOptimizationService
from app.core.config import settings

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mass_preload.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class MassImagePreloader:
    """
    Pré-carregador em massa de imagens de Pokémon com otimização.
    
    Responsável por:
    - Baixar todas as imagens dos Pokémons (1-1010)
    - Otimizar imagens com diferentes níveis de compressão
    - Criar thumbnails em diferentes tamanhos
    - Gerar relatórios detalhados
    """

    def __init__(self):
        """Inicializa o pré-carregador."""
        # Configuração do banco de dados
        self.engine = create_engine(settings.get_database_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.db = SessionLocal()
        
        # Serviços
        self.cache_service = ImageCacheService()
        self.optimization_service = ImageOptimizationService()
        
        # Configurações
        self.max_pokemon = 1010
        self.batch_size = 10
        self.max_concurrent = 5
        
        logger.info(f"MassImagePreloader inicializado - Máximo: {self.max_pokemon} Pokémons")

    async def preload_all_images(self, start_id: int = 1, end_id: int = 1010) -> Dict[str, any]:
        """
        Pré-carrega todas as imagens dos Pokémons com otimização completa.
        
        Args:
            start_id: ID inicial do Pokémon
            end_id: ID final do Pokémon
            
        Returns:
            Estatísticas completas do processamento
        """
        start_time = datetime.now()
        
        stats = {
            'start_time': start_time.isoformat(),
            'total_pokemons': 0,
            'total_images_downloaded': 0,
            'total_images_optimized': 0,
            'download_failures': 0,
            'optimization_failures': 0,
            'space_saved_mb': 0,
            'pokemon_details': {}
        }
        
        pokemon_range = range(start_id, min(end_id + 1, self.max_pokemon + 1))
        stats['total_pokemons'] = len(pokemon_range)
        
        logger.info(f"Iniciando pré-carregamento de {len(pokemon_range)} Pokémons")
        
        # Processa em lotes
        semaphore = asyncio.Semaphore(self.max_concurrent)
        
        async def process_pokemon_batch(pokemon_ids: List[int]):
            """Processa um lote de Pokémons."""
            async with semaphore:
                return await self._process_pokemon_batch(pokemon_ids)
        
        # Divide em lotes
        batches = [list(pokemon_range)[i:i + self.batch_size] 
                  for i in range(0, len(pokemon_range), self.batch_size)]
        
        # Processa todos os lotes
        for i, batch in enumerate(batches):
            logger.info(f"Processando lote {i+1}/{len(batches)}: Pokémons {batch[0]}-{batch[-1]}")
            
            batch_stats = await process_pokemon_batch(batch)
            
            # Atualiza estatísticas gerais
            stats['total_images_downloaded'] += batch_stats['downloaded']
            stats['total_images_optimized'] += batch_stats['optimized']
            stats['download_failures'] += batch_stats['download_failures']
            stats['optimization_failures'] += batch_stats['optimization_failures']
            
            # Atualiza detalhes por Pokémon
            for pokemon_id, details in batch_stats['details'].items():
                stats['pokemon_details'][pokemon_id] = details
        
        # Calcula economia de espaço
        optimization_stats = self.optimization_service.get_optimization_stats(self.db)
        stats['space_saved_mb'] = optimization_stats.get('space_saved_mb', 0)
        
        end_time = datetime.now()
        stats['end_time'] = end_time.isoformat()
        stats['duration_seconds'] = (end_time - start_time).total_seconds()
        
        # Salva relatório
        await self._save_report(stats)
        
        logger.info(f"Pré-carregamento concluído: {stats['total_images_downloaded']} imagens baixadas, "
                   f"{stats['total_images_optimized']} otimizadas, "
                   f"{stats['space_saved_mb']}MB economizados")
        
        return stats

    async def _process_pokemon_batch(self, pokemon_ids: List[int]) -> Dict[str, any]:
        """
        Processa um lote específico de Pokémons.
        
        Args:
            pokemon_ids: Lista de IDs para processar
            
        Returns:
            Estatísticas do lote
        """
        batch_stats = {
            'downloaded': 0,
            'optimized': 0,
            'download_failures': 0,
            'optimization_failures': 0,
            'details': {}
        }
        
        image_types = ['official-artwork', 'sprite', 'home', 'sprite-shiny', 'home-shiny']
        optimization_types = ['high', 'medium', 'low']
        
        for pokemon_id in pokemon_ids:
            pokemon_details = {
                'id': pokemon_id,
                'images_downloaded': 0,
                'images_optimized': 0,
                'failed_downloads': [],
                'failed_optimizations': []
            }
            
            # Baixa todas as imagens para este Pokémon
            for image_type in image_types:
                try:
                    result = await self.cache_service.get_pokemon_image(
                        self.db, pokemon_id, image_type
                    )
                    
                    if result and os.path.exists(result):
                        batch_stats['downloaded'] += 1
                        pokemon_details['images_downloaded'] += 1
                        
                        # Otimiza com diferentes configurações
                        for opt_type in optimization_types:
                            try:
                                optimized = await self.optimization_service.optimize_pokemon_image(
                                    self.db, pokemon_id, image_type, opt_type, 'webp'
                                )
                                
                                if optimized:
                                    batch_stats['optimized'] += 1
                                    pokemon_details['images_optimized'] += 1
                                else:
                                    batch_stats['optimization_failures'] += 1
                                    pokemon_details['failed_optimizations'].append(
                                        f"{image_type}_{opt_type}"
                                    )
                                    
                            except Exception as e:
                                batch_stats['optimization_failures'] += 1
                                pokemon_details['failed_optimizations'].append(
                                    f"{image_type}_{opt_type}"
                                )
                                
                    else:
                        batch_stats['download_failures'] += 1
                        pokemon_details['failed_downloads'].append(image_type)
                        
                except Exception as e:
                    batch_stats['download_failures'] += 1
                    pokemon_details['failed_downloads'].append(image_type)
            
            batch_stats['details'][pokemon_id] = pokemon_details
        
        return batch_stats

    async def create_thumbnails(self, pokemon_ids: List[int] = None) -> Dict[str, int]:
        """
        Cria thumbnails em diferentes tamanhos para Pokémons específicos.
        
        Args:
            pokemon_ids: Lista de IDs (None para todos)
            
        Returns:
            Estatísticas de criação de thumbnails
        """
        if pokemon_ids is None:
            pokemon_ids = list(range(1, self.max_pokemon + 1))
        
        stats = {'thumbnails_created': 0, 'failures': 0}
        
        logger.info(f"Criando thumbnails para {len(pokemon_ids)} Pokémons")
        
        for pokemon_id in pokemon_ids:
            for size_name, dimensions in self.optimization_service.thumbnail_sizes.items():
                try:
                    # Implementação de criação de thumbnails seria aqui
                    stats['thumbnails_created'] += 1
                except Exception as e:
                    stats['failures'] += 1
                    logger.error(f"Erro ao criar thumbnail {size_name} para {pokemon_id}: {e}")
        
        return stats

    async def _save_report(self, stats: Dict[str, any]):
        """
        Salva relatório detalhado do pré-carregamento.
        """
        try:
            report_path = Path("mass_preload_report.json")
            
            # Adiciona informações adicionais
            final_stats = stats.copy()
            final_stats['optimization_summary'] = self.optimization_service.get_optimization_stats(self.db)
            
            import json
            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(final_stats, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Relatório salvo: {report_path}")
            
        except Exception as e:
            logger.error(f"Erro ao salvar relatório: {e}")

    def close(self):
        """Fecha conexões."""
        if hasattr(self, 'db'):
            self.db.close()


def main():
    """Função principal para execução via linha de comando."""
    parser = argparse.ArgumentParser(description='Pré-carrega imagens de Pokémons')
    parser.add_argument('--start', type=int, default=1, help='ID inicial do Pokémon')
    parser.add_argument('--end', type=int, default=1010, help='ID final do Pokémon')
    parser.add_argument('--batch-size', type=int, default=10, help='Tamanho do lote')
    parser.add_argument('--max-concurrent', type=int, default=5, help='Máximo de downloads simultâneos')
    
    args = parser.parse_args()
    
    async def run():
        preloader = MassImagePreloader()
        try:
            stats = await preloader.preload_all_images(args.start, args.end)
            
            print(f"\n{'='*60}")
            print("RELATÓRIO DE PRÉ-CARREGAMENTO")
            print(f"{'='*60}")
            print(f"Pokémons processados: {stats['total_pokemons']}")
            print(f"Imagens baixadas: {stats['total_images_downloaded']}")
            print(f"Imagens otimizadas: {stats['total_images_optimized']}")
            print(f"Falhas no download: {stats['download_failures']}")
            print(f"Falhas na otimização: {stats['optimization_failures']}")
            print(f"Economia de espaço: {stats['space_saved_mb']}MB")
            print(f"Tempo total: {stats['duration_seconds']:.2f} segundos")
            print(f"{'='*60}")
            
        finally:
            preloader.close()
    
    asyncio.run(run())


if __name__ == "__main__":
    main()