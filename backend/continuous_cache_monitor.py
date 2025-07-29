#!/usr/bin/env python3
"""
Monitor Contínuo de Cache de Imagens

Script para monitoramento e recuperação incremental do cache de imagens.
Pode ser agendado via cron ou executado periodicamente.
"""

import os
import json
import time
import requests
import schedule
from datetime import datetime, timedelta
from typing import Dict, List
import sqlite3

class ContinuousCacheMonitor:
    def __init__(self):
        self.db_path = "./pokemon_app.db"
        self.image_dir = "./pokemon_images"
        self.daily_limit = 50  # Limite conservador diário
        self.min_delay = 120   # 2 minutos entre requests
        
        # Configurações de retry
        self.max_retries = 3
        self.retry_delays = [60, 300, 900]  # 1min, 5min, 15min
        
        # Estatísticas
        self.stats = {
            'start_time': datetime.now(),
            'downloaded_today': 0,
            'failed_today': 0,
            'total_downloaded': 0
        }

    def get_pending_pokemon(self) -> List[int]:
        """Recupera Pokémons pendentes (Gen 1)."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT pokemon_id FROM pokemon_image_cache 
            WHERE is_downloaded = 0 AND pokemon_id <= 151
            ORDER BY pokemon_id ASC
        """)
        
        pending = [row[0] for row in cursor.fetchall()]
        conn.close()
        return pending

    def download_image_safe(self, pokemon_id: int) -> bool:
        """Baixa imagem de forma segura com tratamento de erros."""
        try:
            # Verificar limite diário
            if self.stats['downloaded_today'] >= self.daily_limit:
                print(f"⏸️ Limite diário atingido ({self.daily_limit})")
                return False
            
            # URL da imagem
            image_url = f"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{pokemon_id}.png"
            
            # Fazer request com timeout
            response = requests.get(image_url, timeout=30, headers={
                'User-Agent': 'PokeAPI-Sync/1.0 (Educational)'
            })
            
            if response.status_code == 200:
                # Criar diretório se não existir
                if not os.path.exists(self.image_dir):
                    os.makedirs(self.image_dir)
                
                # Salvar imagem
                image_path = os.path.join(self.image_dir, f"{pokemon_id}_official-artwork.png")
                with open(image_path, 'wb') as f:
                    f.write(response.content)
                
                # Atualizar banco de dados
                self.update_database(pokemon_id, True)
                
                self.stats['downloaded_today'] += 1
                self.stats['total_downloaded'] += 1
                
                print(f"✅ Download #{pokemon_id} concluído")
                return True
                
            elif response.status_code == 429:
                print(f"⚠️ Rate limit para #{pokemon_id}")
                return False
            else:
                print(f"❌ Erro {response.status_code} para #{pokemon_id}")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao baixar #{pokemon_id}: {str(e)}")
            return False

    def update_database(self, pokemon_id: int, success: bool):
        """Atualiza o banco de dados com o status do download."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE pokemon_image_cache 
            SET is_downloaded = ?
            WHERE pokemon_id = ?
        """, (success, pokemon_id))
        
        conn.commit()
        conn.close()

    def calculate_coverage(self) -> Dict[str, float]:
        """Calcula cobertura atual do cache."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                COUNT(CASE WHEN is_downloaded = 1 THEN 1 END) as downloaded,
                COUNT(*) as total
            FROM pokemon_image_cache 
            WHERE pokemon_id <= 151
        """)
        
        downloaded, total = cursor.fetchone()
        conn.close()
        
        coverage = (downloaded / total * 100) if total > 0 else 0
        
        return {
            'downloaded': downloaded,
            'total': total,
            'coverage': round(coverage, 2)
        }

    def run_daily_recovery(self):
        """Executa recuperação diária de imagens pendentes."""
        print(f"\n🌅 Iniciando recuperação diária - {datetime.now()}")
        
        pending = self.get_pending_pokemon()
        if not pending:
            print("✅ Nenhuma imagem pendente")
            return
        
        print(f"📊 {len(pending)} imagens pendentes")
        
        # Processar em ordem aleatória para distribuir carga
        import random
        random.shuffle(pending)
        
        successful = 0
        for pokemon_id in pending:
            if self.stats['downloaded_today'] >= self.daily_limit:
                break
                
            if self.download_image_safe(pokemon_id):
                successful += 1
                
            # Pausa entre downloads
            time.sleep(self.min_delay)
        
        # Gerar relatório
        coverage = self.calculate_coverage()
        self.generate_report(successful, coverage)

    def generate_report(self, downloaded: int, coverage: Dict):
        """Gera relatório de progresso."""
        report = {
            'timestamp': datetime.now().isoformat(),
            'downloaded_today': downloaded,
            'coverage': coverage,
            'daily_stats': self.stats,
            'recommendations': [
                f"🎯 Cobertura atual: {coverage['coverage']}%",
                f"📥 Baixadas hoje: {downloaded}",
                "⏰ Agende execução diária via cron/systemd",
                "🔄 Continue até atingir 80%+ de cobertura"
            ]
        }
        
        # Salvar relatório
        report_file = f"daily_report_{datetime.now().strftime('%Y%m%d')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, default=str)
        
        # Imprimir resumo
        print(f"\n📊 RESUMO DIÁRIO:")
        print(f"   • Baixadas hoje: {downloaded}")
        print(f"   • Cobertura: {coverage['coverage']}% ({coverage['downloaded']}/{coverage['total']})")
        print(f"   • Próxima execução: {datetime.now() + timedelta(days=1)}")

    def reset_daily_stats(self):
        """Reseta estatísticas diárias."""
        self.stats['downloaded_today'] = 0
        self.stats['failed_today'] = 0

    def run_continuous_monitor(self):
        """Executa monitoramento contínuo."""
        print("🚀 Monitor de Cache Iniciado")
        print("=" * 40)
        
        # Agendar execução diária
        schedule.every().day.at("02:00").do(self.run_daily_recovery)
        schedule.every().day.at("00:00").do(self.reset_daily_stats)
        
        # Executar imediatamente
        self.run_daily_recovery()
        
        # Loop de monitoramento
        while True:
            schedule.run_pending()
            time.sleep(60)  # Verificar a cada minuto

    def run_single_cycle(self):
        """Executa apenas um ciclo de recuperação."""
        self.run_daily_recovery()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Monitor de Cache de Imagens')
    parser.add_argument('--continuous', action='store_true', help='Executar em modo contínuo')
    parser.add_argument('--single', action='store_true', help='Executar apenas um ciclo')
    
    args = parser.parse_args()
    
    monitor = ContinuousCacheMonitor()
    
    if args.continuous:
        monitor.run_continuous_monitor()
    elif args.single:
        monitor.run_single_cycle()
    else:
        monitor.run_single_cycle()