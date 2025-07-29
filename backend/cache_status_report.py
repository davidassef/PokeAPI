#!/usr/bin/env python3
"""
Relatório executivo do status de persistência de imagens.

Este script gera um relatório completo sobre o estado atual do cache de imagens,
identificando lacunas e fornecendo recomendações para garantir que a aplicação
funcione independentemente da API externa.
"""

import os
import sys
import json
import time
from datetime import datetime, timedelta
from pathlib import Path

# Adicionar o diretório atual ao path para importações
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.services.image_cache_service import ImageCacheService, PokemonImageCache


class CacheStatusReport:
    def __init__(self):
        self.service = ImageCacheService()
        self.critical_pokemon_range = range(1, 152)  # Gen 1 completa
        
    def generate_comprehensive_report(self):
        """Gera relatório completo do status do cache."""
        db = SessionLocal()
        try:
            report = {
                'timestamp': datetime.now().isoformat(),
                'summary': {},
                'critical_analysis': {},
                'gaps': {},
                'recommendations': [],
                'technical_details': {}
            }
            
            # Análise geral do cache
            total_entries = db.query(PokemonImageCache).count()
            downloaded = db.query(PokemonImageCache).filter(
                PokemonImageCache.is_downloaded == True
            ).count()
            failed = db.query(PokemonImageCache).filter(
                PokemonImageCache.is_downloaded == False,
                PokemonImageCache.download_attempts >= 1
            ).count()
            pending = db.query(PokemonImageCache).filter(
                PokemonImageCache.is_downloaded == False,
                PokemonImageCache.download_attempts == 0
            ).count()
            
            report['summary'] = {
                'total_entries': total_entries,
                'downloaded': downloaded,
                'failed': failed,
                'pending': pending,
                'success_rate': round((downloaded / total_entries * 100) if total_entries > 0 else 0, 1)
            }
            
            # Análise dos Pokémons críticos (Gen 1)
            critical_analysis = self._analyze_critical_pokemon(db)
            report['critical_analysis'] = critical_analysis
            
            # Identificar lacunas
            gaps = self._identify_gaps(db)
            report['gaps'] = gaps
            
            # Gerar recomendações
            recommendations = self._generate_recommendations(report)
            report['recommendations'] = recommendations
            
            # Detalhes técnicos
            technical_details = self._get_technical_details(db)
            report['technical_details'] = technical_details
            
            return report
            
        finally:
            db.close()
    
    def _analyze_critical_pokemon(self, db):
        """Analisa a cobertura dos Pokémons críticos (Gen 1)."""
        critical_downloaded = 0
        critical_failed = 0
        critical_missing = 0
        
        missing_pokemon = []
        failed_pokemon = []
        
        for pokemon_id in self.critical_pokemon_range:
            entry = db.query(PokemonImageCache).filter(
                PokemonImageCache.pokemon_id == pokemon_id,
                PokemonImageCache.image_type == 'official-artwork'
            ).first()
            
            if not entry:
                critical_missing += 1
                missing_pokemon.append(pokemon_id)
            elif entry.is_downloaded:
                critical_downloaded += 1
            else:
                critical_failed += 1
                failed_pokemon.append({
                    'id': pokemon_id,
                    'attempts': entry.download_attempts,
                    'last_attempt': entry.last_attempt.isoformat() if entry.last_attempt else None
                })
        
        return {
            'total': len(self.critical_pokemon_range),
            'downloaded': critical_downloaded,
            'failed': critical_failed,
            'missing': critical_missing,
            'coverage_rate': round((critical_downloaded / len(self.critical_pokemon_range) * 100), 1),
            'missing_pokemon': missing_pokemon,
            'failed_pokemon': failed_pokemon
        }
    
    def _identify_gaps(self, db):
        """Identifica lacunas no cache."""
        # Lacunas por tipo de imagem
        gaps_by_type = {}
        for image_type in ['official-artwork', 'sprite', 'sprite-shiny', 'home', 'home-shiny']:
            missing = db.query(PokemonImageCache).filter(
                PokemonImageCache.image_type == image_type,
                PokemonImageCache.is_downloaded == False
            ).count()
            gaps_by_type[image_type] = missing
        
        # Lacunas por faixa de ID
        gaps_by_range = {}
        ranges = [(1, 151), (152, 251), (252, 386), (387, 493), (494, 649)]
        for start, end in ranges:
            missing = db.query(PokemonImageCache).filter(
                PokemonImageCache.pokemon_id.between(start, end),
                PokemonImageCache.image_type == 'official-artwork',
                PokemonImageCache.is_downloaded == False
            ).count()
            gaps_by_range[f"{start}-{end}"] = missing
        
        return {
            'by_type': gaps_by_type,
            'by_range': gaps_by_range
        }
    
    def _generate_recommendations(self, report):
        """Gera recomendações baseadas na análise."""
        recommendations = []
        
        # Análise de cobertura crítica
        critical_coverage = report['critical_analysis']['coverage_rate']
        
        if critical_coverage < 80:
            recommendations.append({
                'priority': 'HIGH',
                'type': 'CRITICAL_COVERAGE',
                'description': f'Cobertura crítica baixa ({critical_coverage}%). Pré-carregar imagens Gen 1.',
                'action': 'Execute preload_critical_images.py com retry programado'
            })
        
        if report['summary']['failed'] > 50:
            recommendations.append({
                'priority': 'HIGH',
                'type': 'FAILED_DOWNLOADS',
                'description': f'Muitos downloads falharam ({report["summary"]["failed"]}). Implementar retry inteligente.',
                'action': 'Configure retry automático com backoff exponencial'
            })
        
        recommendations.append({
            'priority': 'MEDIUM',
            'type': 'FALLBACK_STRATEGY',
            'description': 'Implementar estratégia de fallback para quando API externa falhar',
            'action': 'Garantir que imagens locais sejam servidas mesmo sem internet'
        })
        
        recommendations.append({
            'priority': 'LOW',
            'type': 'MONITORING',
            'description': 'Implementar monitoramento contínuo do cache',
            'action': 'Crie jobs agendados para verificar e preencher lacunas'
        })
        
        return recommendations
    
    def _get_technical_details(self, db):
        """Obtém detalhes técnicos do cache."""
        # Tamanho total do cache
        total_size = 0
        entries = db.query(PokemonImageCache).filter(PokemonImageCache.is_downloaded == True).all()
        
        for entry in entries:
            if os.path.exists(entry.local_path):
                total_size += entry.file_size
        
        # Estatísticas de tentativas
        avg_attempts = db.query(PokemonImageCache).filter(
            PokemonImageCache.download_attempts > 0
        ).count()
        
        return {
            'total_cache_size_mb': round(total_size / (1024 * 1024), 2),
            'cache_directory': str(self.service.cache_dir),
            'supported_image_types': list(self.service.image_urls.keys()),
            'max_download_attempts': self.service.max_download_attempts,
            'retry_delay_hours': self.service.retry_delay_hours
        }
    
    def save_report(self, report, filename='cache_status_report.json'):
        """Salva o relatório em arquivo JSON."""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        return filename
    
    def print_executive_summary(self, report):
        """Imprime resumo executivo do relatório."""
        print("=" * 60)
        print("📊 RELATÓRIO EXECUTIVO - STATUS DE PERSISTÊNCIA")
        print("=" * 60)
        
        summary = report['summary']
        critical = report['critical_analysis']
        
        print(f"📈 Status Geral:")
        print(f"   • Total de imagens no cache: {summary['total_entries']}")
        print(f"   • Downloads bem-sucedidos: {summary['downloaded']} ({summary['success_rate']}%)")
        print(f"   • Downloads falhados: {summary['failed']}")
        print(f"   • Downloads pendentes: {summary['pending']}")
        
        print(f"\n🎯 Análise Pokémons Críticos (Gen 1):")
        print(f"   • Cobertura: {critical['coverage_rate']}% ({critical['downloaded']}/{critical['total']})")
        print(f"   • Falhados: {critical['failed']}")
        print(f"   • Ausentes: {critical['missing']}")
        
        if critical['coverage_rate'] >= 80:
            print("   ✅ STATUS: BOM - Aplicação pode funcionar sem API externa")
        elif critical['coverage_rate'] >= 50:
            print("   ⚠️  STATUS: MODERADO - Algumas imagens podem não carregar")
        else:
            print("   ❌ STATUS: CRÍTICO - Forte dependência da API externa")
        
        print(f"\n📋 Recomendações Prioritárias:")
        for rec in report['recommendations']:
            if rec['priority'] in ['HIGH', 'MEDIUM']:
                print(f"   • [{rec['priority']}] {rec['description']}")
        
        print("=" * 60)


def main():
    """Função principal."""
    print("📊 Gerando relatório executivo do cache...")
    
    reporter = CacheStatusReport()
    
    try:
        report = reporter.generate_comprehensive_report()
        
        # Imprime resumo executivo
        reporter.print_executive_summary(report)
        
        # Salva relatório completo
        filename = reporter.save_report(report)
        print(f"📄 Relatório completo salvo em: {filename}")
        
        # Salva também versão executiva
        executive_summary = {
            'timestamp': report['timestamp'],
            'critical_coverage': report['critical_analysis']['coverage_rate'],
            'total_downloaded': report['summary']['downloaded'],
            'status': 'GOOD' if report['critical_analysis']['coverage_rate'] >= 80 else 
                     'MODERATE' if report['critical_analysis']['coverage_rate'] >= 50 else 'CRITICAL',
            'next_actions': [rec['action'] for rec in report['recommendations'] if rec['priority'] == 'HIGH']
        }
        
        with open('executive_summary.json', 'w') as f:
            json.dump(executive_summary, f, indent=2)
        
    except Exception as e:
        print(f"❌ Erro ao gerar relatório: {e}")


if __name__ == "__main__":
    main()