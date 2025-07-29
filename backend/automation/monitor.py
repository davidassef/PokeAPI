#!/usr/bin/env python3
import json
import time
from pathlib import Path
from datetime import datetime

base_dir = Path(__file__).parent.parent
log_file = base_dir / "cache_recovery.log"
report_file = base_dir / "automation" / "recovery_report.json"

def check_status():
    try:
        with open(report_file, 'r') as f:
            report = json.load(f)
        
        print(f"Status da Recuperacao ({report.get('timestamp', 'N/A')})")
        print(f"   - Processados: {report.get('processed', 0)}")
        print(f"   - Sucesso: {report.get('successful', 0)}")
        print(f"   - Falhas: {report.get('failed', 0)}")
        
        stats = report.get('stats', {})
        print(f"   - Cobertura: {stats.get('coverage', 0)}%")
        print(f"   - Baixados: {stats.get('downloaded', 0)}/{stats.get('total', 0)}")
        
    except FileNotFoundError:
        print("Nenhum relatorio encontrado")
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    check_status()
