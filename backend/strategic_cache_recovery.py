#!/usr/bin/env python3
"""
Estratégia de Recuperação Inteligente do Cache de Imagens

Este script implementa uma abordagem estratégica para recuperar imagens críticas
que falharam no download, utilizando retry inteligente com backoff exponencial
e respeitando os limites da PokeAPI.
"""

import asyncio
import time
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import requests
from sqlalchemy import create_engine, and_
from sqlalchemy.orm import sessionmaker
import sys
import os

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.image_cache_service import ImageCacheService
from app.services.image_cache_service import PokemonImageCache

class StrategicCacheRecovery:
    def __init__(self):
        self.db_path = "sqlite:///./pokemon_app.db"
        self.engine = create_engine(self.db_path)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
        
        # Configurações de retry inteligente
        self.max_retries = 5
        self.initial_delay = 60  # 1 minuto
        self.max_delay = 3600  # 1 hora
        self.batch_size = 5  # Processar em lotes pequenos
        self.daily_limit = 100  # Limite diário de requests
        
        # Estatísticas
        self.stats = {
            'start_time': datetime.now(),
            'total_attempted': 0,
            'successful_downloads': 0,
            'failed_downloads': 0,
            'retry_distribution': {i: 0 for i in range(self.max_retries + 1)},
            'total_wait_time': 0
        }

    def get_failed_pokemon(self) -> List[PokemonImageCache]:
        """Recupera Pokémons que falharam no download."""
        return self.session.query(PokemonImageCache).filter(
            and_(
                PokemonImageCache.is_downloaded == False,
                PokemonImageCache.pokemon_id <= 151  # Focar em Gen 1
            )
        ).order_by(PokemonImageCache.pokemon_id).all()

    def calculate_backoff_delay(self, attempt: int) -> int:
        """Calcula delay exponencial com jitter."""
        delay = min(
            self.initial_delay * (2 ** attempt) + random.uniform(0, 30),
            self.max_delay
        )
        return int(delay)

    def should_continue_daily(self) -> bool:
        """Verifica se ainda está dentro do limite diário."""
        today_attempts = self.stats['total_attempted']
        return today_attempts < self.daily_limit

    async def retry_with_strategy(self, pokemon: PokemonImageCache) -> bool:
        """Realiza retry inteligente com backoff exponencial usando requests direto."""
        
        for attempt in range(self.max_retries):
            if not self.should_continue_daily():
                print(f"⏸️ Limite diário atingido. Aguardando próximo ciclo.")
                return False

            delay = self.calculate_backoff_delay(attempt)
            self.stats['total_wait_time'] += delay
            
            print(f"🔄 Tentativa {attempt + 1}/5 para Pokémon #{pokemon.pokemon_id} (delay: {delay}s)")
            
            await asyncio.sleep(delay)
            
            try:
                # Baixar imagem diretamente da PokeAPI
                image_url = f"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{pokemon.pokemon_id}.png"
                response = requests.get(image_url, timeout=30)
                
                if response.status_code == 200:
                    # Salvar imagem localmente
                    image_dir = "pokemon_images"
                    if not os.path.exists(image_dir):
                        os.makedirs(image_dir)
                    
                    image_path = os.path.join(image_dir, f"{pokemon.pokemon_id}_official-artwork.png")
                    with open(image_path, 'wb') as f:
                        f.write(response.content)
                    
                    pokemon.is_downloaded = True
                    pokemon.last_updated = datetime.now()
                    self.session.commit()
                    
                    self.stats['successful_downloads'] += 1
                    self.stats['retry_distribution'][attempt + 1] += 1
                    
                    print(f"✅ Sucesso: Pokémon #{pokemon.pokemon_id} (tentativa {attempt + 1})")
                    return True
                elif response.status_code == 429:
                    print(f"⚠️ Rate limit atingido para Pokémon #{pokemon.pokemon_id}")
                    return False
                    
            except Exception as e:
                print(f"❌ Falha: Pokémon #{pokemon.pokemon_id} - {str(e)}")
                
                if attempt < self.max_retries - 1:
                    print(f"⏳ Aguardando {delay}s antes de próxima tentativa...")
                
                continue

        self.stats['failed_downloads'] += 1
        return False

    async def process_batch(self, pokemon_list: List[PokemonImageCache]) -> Dict:
        """Processa um lote de Pokémons com retry inteligente."""
        batch_results = {
            'processed': 0,
            'successful': 0,
            'failed': 0,
            'batch_id': f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        }
        
        print(f"🎯 Iniciando lote com {len(pokemon_list)} Pokémons")
        
        for i, pokemon in enumerate(pokemon_list):
            if not self.should_continue_daily():
                break
                
            self.stats['total_attempted'] += 1
            batch_results['processed'] += 1
            
            success = await self.retry_with_strategy(pokemon)
            if success:
                batch_results['successful'] += 1
            else:
                batch_results['failed'] += 1
            
            # Pausa entre Pokémons
            if i < len(pokemon_list) - 1:
                await asyncio.sleep(random.uniform(5, 15))
        
        return batch_results

    def generate_recovery_report(self, batch_results: List[Dict]) -> Dict:
        """Gera relatório detalhado da recuperação."""
        total_processed = sum(b['processed'] for b in batch_results)
        total_successful = sum(b['successful'] for b in batch_results)
        total_failed = sum(b['failed'] for b in batch_results)
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'recovery_strategy': 'intelligent_backoff',
            'statistics': {
                **self.stats,
                'total_processed': total_processed,
                'total_successful': total_successful,
                'total_failed': total_failed,
                'final_coverage': self.calculate_current_coverage(),
                'efficiency_rate': (total_successful / total_processed * 100) if total_processed > 0 else 0
            },
            'retry_analysis': {
                'distribution': self.stats['retry_distribution'],
                'average_wait_time': self.stats['total_wait_time'] / max(total_processed, 1),
                'strategy_used': 'exponential_backoff_with_jitter'
            },
            'recommendations': self.generate_recommendations()
        }
        
        return report

    def calculate_current_coverage(self) -> float:
        """Calcula cobertura atual de Pokémons críticos."""
        downloaded = self.session.query(PokemonImageCache).filter(
            and_(
                PokemonImageCache.is_downloaded == True,
                PokemonImageCache.pokemon_id <= 151
            )
        ).count()
        
        return round((downloaded / 151) * 100, 2)

    def generate_recommendations(self) -> List[str]:
        """Gera recomendações baseadas nos resultados."""
        recommendations = []
        
        if self.stats['successful_downloads'] > 0:
            recommendations.append("✅ Estratégia de retry inteligente está funcionando")
        
        if self.stats['failed_downloads'] > 50:
            recommendations.append("⚠️ Considere aumentar o intervalo entre tentativas")
            recommendations.append("📅 Execute em horários de menor demanda (ex: madrugada)")
        
        current_coverage = self.calculate_current_coverage()
        if current_coverage < 80:
            recommendations.append(f"🎯 Foco em alcançar 80% de cobertura (atual: {current_coverage}%)")
        
        recommendations.append("🔄 Implementar retry automático diário para imagens pendentes")
        
        return recommendations

    async def run_recovery(self):
        """Executa a estratégia completa de recuperação."""
        print("🚀 Iniciando Estratégia de Recuperação Inteligente")
        print("=" * 60)
        
        failed_pokemon = self.get_failed_pokemon()
        
        if not failed_pokemon:
            print("✅ Nenhum Pokémon pendente para recuperação")
            return
        
        print(f"📊 Encontrados {len(failed_pokemon)} Pokémons para recuperar")
        
        # Processar em lotes
        batches = [failed_pokemon[i:i+self.batch_size] 
                  for i in range(0, len(failed_pokemon), self.batch_size)]
        
        batch_results = []
        for batch in batches:
            if not self.should_continue_daily():
                print("🛑 Limite diário alcançado. Parando processamento.")
                break
                
            result = await self.process_batch(batch)
            batch_results.append(result)
            
            # Pausa entre lotes
            await asyncio.sleep(random.uniform(30, 60))
        
        # Gerar relatório final
        report = self.generate_recovery_report(batch_results)
        
        # Salvar relatório
        report_file = f"recovery_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, default=str)
        
        # Exibir resumo executivo
        self.print_executive_summary(report)
        
        return report

    def print_executive_summary(self, report: Dict):
        """Imprime resumo executivo do processo."""
        print("\n" + "=" * 60)
        print("📊 RESUMO EXECUTIVO - RECUPERAÇÃO INTELIGENTE")
        print("=" * 60)
        
        stats = report['statistics']
        
        print(f"🎯 Pokémons Processados: {stats['total_processed']}")
        print(f"✅ Downloads Bem-sucedidos: {stats['total_successful']}")
        print(f"❌ Falhas: {stats['total_failed']}")
        print(f"📈 Taxa de Sucesso: {stats['efficiency_rate']:.1f}%")
        print(f"📊 Cobertura Final: {stats['final_coverage']}%")
        print(f"⏱️ Tempo Total de Espera: {stats['total_wait_time']:.0f}s")
        
        print("\n📋 Recomendações:")
        for rec in report['recommendations']:
            print(f"   {rec}")
        
        print(f"\n📄 Relatório completo salvo em: {report['timestamp'][:10]}_recovery_report.json")

async def main():
    """Função principal de execução."""
    recovery = StrategicCacheRecovery()
    
    try:
        await recovery.run_recovery()
    except KeyboardInterrupt:
        print("\n⚠️ Processo interrompido pelo usuário")
    except Exception as e:
        print(f"❌ Erro durante recuperação: {str(e)}")
    finally:
        recovery.session.close()

if __name__ == "__main__":
    asyncio.run(main())