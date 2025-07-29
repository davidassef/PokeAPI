#!/usr/bin/env python3
"""
Sistema de Automação para Recuperação Contínua de Cache

Este script gerencia a recuperação automática de imagens de Pokémons,
respeitando rate limits e executando de forma incremental.
"""

import os
import sys
import json
import time
import signal
import logging
import sqlite3
import requests
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
import schedule

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('cache_recovery.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class CacheRecoveryScheduler:
    """Gerencia a recuperação automática do cache de imagens."""
    
    def __init__(self):
        self.db_path = Path("./pokemon_app.db")
        self.image_dir = Path("./pokemon_images")
        self.config_file = Path("./automation/cache_config.json")
        self.running = True
        
        # Configurações padrão
        self.config = {
            "daily_limit": 50,
            "min_delay": 120,
            "max_retries": 3,
            "priority_pokemon": list(range(1, 152)),  # Gen 1
            "auto_start": True,
            "recovery_hours": [2, 8, 14, 20],  # Horários de execução
            "batch_size": 10,
            "emergency_mode": False
        }
        
        self.load_config()
        self.setup_signal_handlers()
        
    def load_config(self):
        """Carrega configurações do arquivo JSON."""
        try:
            if self.config_file.exists():
                with open(self.config_file, 'r') as f:
                    saved_config = json.load(f)
                    self.config.update(saved_config)
                    logger.info("Configurações carregadas com sucesso")
            else:
                self.save_config()
                logger.info("Configurações padrão criadas")
        except Exception as e:
            logger.error(f"Erro ao carregar configurações: {e}")
    
    def save_config(self):
        """Salva configurações no arquivo JSON."""
        try:
            self.config_file.parent.mkdir(exist_ok=True)
            with open(self.config_file, 'w') as f:
                json.dump(self.config, f, indent=2)
                logger.info("Configurações salvas")
        except Exception as e:
            logger.error(f"Erro ao salvar configurações: {e}")
    
    def setup_signal_handlers(self):
        """Configura handlers para sinais de sistema."""
        def signal_handler(signum, frame):
            logger.info("Recebido sinal para encerrar...")
            self.running = False
            
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    def get_pending_pokemon(self) -> List[int]:
        """Retorna lista de Pokémons pendentes ordenados por prioridade."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Verificar estrutura da tabela
            cursor.execute("PRAGMA table_info(pokemon_image_cache)")
            columns = [col[1] for col in cursor.fetchall()]
            
            if 'is_downloaded' not in columns:
                logger.error("Coluna 'is_downloaded' não encontrada")
                return []
            
            cursor.execute("""
                SELECT pokemon_id FROM pokemon_image_cache 
                WHERE is_downloaded = 0 AND pokemon_id <= 151
                ORDER BY pokemon_id ASC
            """)
            
            pending = [row[0] for row in cursor.fetchall()]
            conn.close()
            
            # Ordenar por prioridade
            priority_set = set(self.config["priority_pokemon"])
            priority_pending = [p for p in pending if p in priority_set]
            other_pending = [p for p in pending if p not in priority_set]
            
            return priority_pending + other_pending
            
        except Exception as e:
            logger.error(f"Erro ao buscar Pokémons pendentes: {e}")
            return []
    
    def download_single_image(self, pokemon_id: int) -> bool:
        """Baixa uma única imagem de Pokémon."""
        try:
            image_url = f"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{pokemon_id}.png"
            
            response = requests.get(
                image_url, 
                timeout=30,
                headers={'User-Agent': 'PokeAPI-Sync/1.0'}
            )
            
            if response.status_code == 200:
                # Criar diretório se necessário
                self.image_dir.mkdir(exist_ok=True)
                
                # Salvar imagem
                image_path = self.image_dir / f"{pokemon_id}_official-artwork.png"
                with open(image_path, 'wb') as f:
                    f.write(response.content)
                
                # Atualizar banco de dados
                self.update_database(pokemon_id, True)
                
                logger.info(f"✅ Download #{pokemon_id} concluído")
                return True
                
            elif response.status_code == 429:
                logger.warning(f"Rate limit para #{pokemon_id}")
                return False
            else:
                logger.error(f"❌ Erro {response.status_code} para #{pokemon_id}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Erro ao baixar #{pokemon_id}: {e}")
            return False
    
    def update_database(self, pokemon_id: int, success: bool):
        """Atualiza o status no banco de dados."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE pokemon_image_cache 
                SET is_downloaded = ?
                WHERE pokemon_id = ?
            """, (success, pokemon_id))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Erro ao atualizar banco de dados: {e}")
    
    def get_recovery_stats(self) -> Dict:
        """Retorna estatísticas de recuperação."""
        try:
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
                "downloaded": downloaded,
                "total": total,
                "coverage": round(coverage, 2),
                "pending": total - downloaded,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas: {e}")
            return {"error": str(e)}
    
    def run_recovery_cycle(self) -> Dict:
        """Executa um ciclo completo de recuperação."""
        logger.info("🔄 Iniciando ciclo de recuperação")
        
        pending = self.get_pending_pokemon()
        if not pending:
            logger.info("✅ Nenhuma imagem pendente")
            return {"status": "completed", "downloaded": 0}
        
        logger.info(f"📊 {len(pending)} imagens pendentes")
        
        # Limitar por configuração
        to_process = pending[:self.config["batch_size"]]
        successful = 0
        
        for pokemon_id in to_process:
            if successful >= self.config["daily_limit"]:
                break
                
            if self.download_single_image(pokemon_id):
                successful += 1
                
            # Pausa entre downloads
            time.sleep(self.config["min_delay"])
        
        # Gerar relatório
        stats = self.get_recovery_stats()
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "processed": len(to_process),
            "successful": successful,
            "failed": len(to_process) - successful,
            "stats": stats
        }
        
        # Salvar relatório
        report_file = Path("./automation/recovery_report.json")
        report_file.parent.mkdir(exist_ok=True)
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"Ciclo concluido: {successful}/{len(to_process)} baixados")
        return report
    
    def should_run_recovery(self) -> bool:
        """Verifica se deve executar recuperação agora."""
        current_hour = datetime.now().hour
        return current_hour in self.config["recovery_hours"]
    
    def run_scheduled_recovery(self):
        """Executa recuperação agendada."""
        if not self.should_run_recovery():
            return
            
        try:
            self.run_recovery_cycle()
        except Exception as e:
            logger.error(f"Erro no ciclo agendado: {e}")
    
    def start_daemon(self):
        """Inicia o daemon de recuperação contínua."""
        logger.info("🚀 Iniciando daemon de recuperação")
        
        # Agendar execuções
        for hour in self.config["recovery_hours"]:
            schedule.every().day.at(f"{hour:02d}:00").do(self.run_scheduled_recovery)
        
        # Executar imediatamente se auto_start estiver ativado
        if self.config["auto_start"]:
            self.run_recovery_cycle()
        
        # Loop principal
        while self.running:
            schedule.run_pending()
            time.sleep(60)  # Verificar a cada minuto
        
        logger.info("👋 Daemon encerrado")
    
    def run_once(self):
        """Executa uma única recuperação."""
        return self.run_recovery_cycle()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Recuperação automática de cache')
    parser.add_argument('--daemon', action='store_true', help='Executar em modo daemon')
    parser.add_argument('--once', action='store_true', help='Executar apenas uma vez')
    parser.add_argument('--config', help='Arquivo de configuração JSON')
    
    args = parser.parse_args()
    
    scheduler = CacheRecoveryScheduler()
    
    if args.config:
        scheduler.config_file = Path(args.config)
        scheduler.load_config()
    
    if args.daemon:
        scheduler.start_daemon()
    elif args.once:
        result = scheduler.run_once()
        print(json.dumps(result, indent=2))
    else:
        result = scheduler.run_once()
        print(json.dumps(result, indent=2))