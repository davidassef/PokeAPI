#!/usr/bin/env python3
"""
Script para retry inteligente de downloads falhados.

Este script identifica imagens que falharam no download e tenta baixá-las novamente,
respeitando rate limits e implementando backoff exponencial.
"""

import os
import sys
import time
import json
import asyncio
import aiohttp
from datetime import datetime, timedelta
from pathlib import Path

# Adicionar o diretório atual ao path para importações
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.services.image_cache_service import PokemonImageCache
from app.services.image_cache_service import ImageCacheService


class RetryManager:
    def __init__(self):
        self.service = ImageCacheService()
        self.session = None
        self.retry_config = {
            'max_retries': 3,
            'initial_delay': 2,  # segundos
            'max_delay': 60,     # segundos
            'batch_size': 5,     # downloads por batch
            'batch_delay': 10    # segundos entre batches
        }
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            connector=aiohttp.TCPConnector(limit=10, limit_per_host=5)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def get_failed_downloads(self):
        """Identifica imagens que falharam no download."""
        db = SessionLocal()
        try:
            failed_images = db.query(PokemonImageCache).filter(
                PokemonImageCache.download_attempts >= 1,
                PokemonImageCache.is_downloaded == False
            ).all()
            
            return [
                {
                    'pokemon_id': img.pokemon_id,
                    'image_type': img.image_type,
                    'attempts': img.download_attempts,
                    'last_attempt': img.last_attempt
                }
                for img in failed_images
            ]
        finally:
            db.close()
    
    async def download_with_retry(self, pokemon_id: int, image_type: str):
        """Faz download com retry inteligente."""
        delay = self.retry_config['initial_delay']
        
        for attempt in range(self.retry_config['max_retries']):
            try:
                print(f"🔄 Tentando {image_type} do Pokémon {pokemon_id} (tentativa {attempt + 1})")
                
                # Usa o serviço existente para fazer o download
                success = await self.service.download_image_async(pokemon_id, image_type)
                
                if success:
                    print(f"✅ Sucesso: {image_type} do Pokémon {pokemon_id}")
                    return True
                else:
                    print(f"❌ Falha: {image_type} do Pokémon {pokemon_id}")
                    
            except Exception as e:
                print(f"❌ Erro: {e}")
            
            # Aguarda antes de tentar novamente (exceto na última tentativa)
            if attempt < self.retry_config['max_retries'] - 1:
                await asyncio.sleep(delay)
                delay = min(delay * 2, self.retry_config['max_delay'])
        
        return False
    
    async def retry_batch(self, failed_images):
        """Processa um lote de imagens falhadas."""
        results = []
        
        # Processa em batches menores para evitar rate limiting
        for i in range(0, len(failed_images), self.retry_config['batch_size']):
            batch = failed_images[i:i + self.retry_config['batch_size']]
            
            print(f"\n📦 Processando batch {i//self.retry_config['batch_size'] + 1}/{(len(failed_images) + self.retry_config['batch_size'] - 1)//self.retry_config['batch_size']}")
            
            # Processa o batch
            tasks = [
                self.download_with_retry(img['pokemon_id'], img['image_type'])
                for img in batch
            ]
            
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Registra resultados
            for img, result in zip(batch, batch_results):
                if isinstance(result, Exception):
                    results.append({
                        'pokemon_id': img['pokemon_id'],
                        'image_type': img['image_type'],
                        'success': False,
                        'error': str(result)
                    })
                else:
                    results.append({
                        'pokemon_id': img['pokemon_id'],
                        'image_type': img['image_type'],
                        'success': result
                    })
            
            # Pausa entre batches
            if i + self.retry_config['batch_size'] < len(failed_images):
                await asyncio.sleep(self.retry_config['batch_delay'])
        
        return results
    
    async def run_retry_process(self):
        """Executa o processo completo de retry."""
        print("🔍 Buscando imagens que falharam no download...")
        
        failed_images = self.get_failed_downloads()
        
        if not failed_images:
            print("✅ Nenhuma imagem falhada encontrada!")
            return
        
        print(f"📊 Encontradas {len(failed_images)} imagens falhadas")
        
        # Executa o retry
        async with self:
            results = await self.retry_batch(failed_images)
        
        # Gera relatório
        successful = [r for r in results if r['success']]
        failed = [r for r in results if not r['success']]
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_attempted': len(results),
            'successful_downloads': len(successful),
            'failed_downloads': len(failed),
            'success_rate': len(successful) / len(results) * 100 if results else 0,
            'details': results
        }
        
        # Salva relatório
        report_path = Path('retry_report.json')
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n📊 RESUMO DO RETRY")
        print(f"================")
        print(f"✅ Downloads bem-sucedidos: {len(successful)}")
        print(f"❌ Downloads falhados: {len(failed)}")
        print(f"📈 Taxa de sucesso: {report['success_rate']:.1f}%")
        print(f"📋 Relatório salvo em: {report_path}")
        
        return report


async def main():
    """Função principal."""
    print("🚀 Iniciando retry de downloads falhados...")
    
    retry_manager = RetryManager()
    
    try:
        report = await retry_manager.run_retry_process()
        
        if report and report['success_rate'] < 100:
            print("\n💡 Dica: Execute novamente em algumas horas para tentar as imagens restantes")
        
    except KeyboardInterrupt:
        print("\n⏹️  Processo interrompido pelo usuário")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")


if __name__ == "__main__":
    asyncio.run(main())