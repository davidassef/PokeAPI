#!/usr/bin/env python3
"""
Script de Instalação e Configuração do Sistema de Automação

Este script configura o sistema de recuperação automática de cache,
incluindo agendamento via Task Scheduler (Windows) ou cron (Linux).
"""

import os
import sys
import json
import platform
import subprocess
from pathlib import Path
from datetime import datetime

class AutomationSetup:
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.automation_dir = self.base_dir / "automation"
        self.python_exe = sys.executable
        self.scheduler_script = self.automation_dir / "cache_recovery_scheduler.py"
        
    def check_dependencies(self):
        """Verifica e instala dependências necessárias."""
        print("🔍 Verificando dependências...")
        
        dependencies = ["schedule", "requests"]
        
        for dep in dependencies:
            try:
                __import__(dep)
                print(f"✅ {dep} está instalado")
            except ImportError:
                print(f"📦 Instalando {dep}...")
                subprocess.run([sys.executable, "-m", "pip", "install", dep])
    
    def create_config_file(self):
        """Cria arquivo de configuração com padrões otimizados."""
        config = {
            "daily_limit": 50,
            "min_delay": 120,
            "max_retries": 3,
            "priority_pokemon": list(range(1, 152)),
            "recovery_hours": [2, 8, 14, 20],
            "batch_size": 10,
            "auto_start": True,
            "emergency_mode": False,
            "notification_enabled": True,
            "webhook_url": "",
            "email_notifications": False,
            "log_level": "INFO"
        }
        
        config_file = self.automation_dir / "cache_config.json"
        
        if not config_file.exists():
            with open(config_file, 'w') as f:
                json.dump(config, f, indent=2)
            print("✅ Arquivo de configuração criado")
        else:
            print("ℹ️  Arquivo de configuração já existe")
    
    def create_service_files(self):
        """Cria arquivos de serviço para diferentes sistemas operacionais."""
        system = platform.system()
        
        if system == "Windows":
            self.create_windows_service()
        elif system in ["Linux", "Darwin"]:
            self.create_unix_service()
        else:
            print(f"⚠️ Sistema {system} não suportado para automação nativa")
    
    def create_windows_service(self):
        """Cria script para Task Scheduler no Windows."""
        task_xml = f"""<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Date>{datetime.now().isoformat()}</Date>
    <Author>PokeAPI-Sync</Author>
    <Description>Recuperação automática de cache de imagens de Pokémons</Description>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>{datetime.now().strftime('%Y-%m-%d')}T02:00:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
      </ScheduleByDay>
    </CalendarTrigger>
    <CalendarTrigger>
      <StartBoundary>{datetime.now().strftime('%Y-%m-%d')}T08:00:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
      </ScheduleByDay>
    </CalendarTrigger>
    <CalendarTrigger>
      <StartBoundary>{datetime.now().strftime('%Y-%m-%d')}T14:00:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
      </ScheduleByDay>
    </CalendarTrigger>
    <CalendarTrigger>
      <StartBoundary>{datetime.now().strftime('%Y-%m-%d')}T20:00:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
      </ScheduleByDay>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>false</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>true</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT2H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>{self.python_exe}</Command>
      <Arguments>{self.scheduler_script} --once</Arguments>
      <WorkingDirectory>{self.base_dir}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>"""
        
        task_file = self.automation_dir / "pokemon_cache_recovery.xml"
        with open(task_file, 'w') as f:
            f.write(task_xml)
        
        # Criar script de instalação
        install_bat = f"""@echo off
echo Instalando tarefa de recuperação de cache...
schtasks /Create /TN "PokeAPI-Cache-Recovery" /XML "{task_file}"
echo Tarefa instalada com sucesso!
echo Para verificar: schtasks /Query /TN "PokeAPI-Cache-Recovery"
echo Para remover: schtasks /Delete /TN "PokeAPI-Cache-Recovery" /F
pause
"""
        
        with open(self.automation_dir / "install_windows.bat", 'w') as f:
            f.write(install_bat)
        
        print("✅ Arquivos do Windows criados")
    
    def create_unix_service(self):
        """Cria script para cron no Linux/macOS."""
        cron_script = f"""#!/bin/bash
# Script de instalação do cron para recuperação de cache

SCRIPT_PATH="{self.scheduler_script}"
PYTHON_PATH="{self.python_exe}"
BASE_DIR="{self.base_dir}"

# Adicionar ao crontab
echo "Instalando cron jobs..."
(crontab -l 2>/dev/null; echo "0 2,8,14,20 * * * cd $BASE_DIR && $PYTHON_PATH $SCRIPT_PATH --once") | crontab -

echo "Cron jobs instalados!"
echo "Para verificar: crontab -l"
echo "Para remover: crontab -r"
"""
        
        with open(self.automation_dir / "install_unix.sh", 'w') as f:
            f.write(cron_script)
        
        os.chmod(self.automation_dir / "install_unix.sh", 0o755)
        
        # Criar systemd service (opcional)
        service_content = f"""[Unit]
Description=PokeAPI Cache Recovery Service
After=network.target

[Service]
Type=simple
User={os.getenv('USER')}
WorkingDirectory={self.base_dir}
ExecStart={self.python_exe} {self.scheduler_script} --daemon
Restart=always
RestartSec=300

[Install]
WantedBy=multi-user.target
"""
        
        with open(self.automation_dir / "pokemon-cache.service", 'w') as f:
            f.write(service_content)
        
        print("✅ Arquivos Unix criados")
    
    def create_monitoring_script(self):
        """Cria script de monitoramento simples."""
        monitor_script = """#!/usr/bin/env python3
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
"""
        
        with open(self.automation_dir / "monitor.py", 'w', encoding='utf-8') as f:
            f.write(monitor_script)
        
        print("Script de monitoramento criado")
    
    def create_startup_script(self):
        """Cria script de inicialização rápida."""
        startup_script = f"""#!/usr/bin/env python3
import subprocess
import sys
from pathlib import Path

base_dir = Path(__file__).parent.parent
python_exe = sys.executable

print("Iniciando sistema de recuperacao de cache...")
print("=" * 50)

# Verificar dependencias
print("Verificando dependencias...")
try:
    import schedule
    import requests
    print("Dependencias OK")
except ImportError as err:
    print(f"Dependencia faltando: {err}")
    print("Instalando...")
    subprocess.run([python_exe, "-m", "pip", "install", "schedule", "requests"])

# Executar recuperacao imediata
print("Executando recuperacao...")
result = subprocess.run([
    python_exe, 
    "automation/cache_recovery_scheduler.py", 
    "--once"
], capture_output=True, text=True)

print(result.stdout)
if result.stderr:
    print("Erros:", result.stderr)

print("Sistema iniciado!")
print("Para monitoramento: python automation/monitor.py")
"""
        
        with open(self.automation_dir / "start_recovery.py", 'w', encoding='utf-8') as f:
            f.write(startup_script)
        
        print("Script de inicializacao criado")
    
    def run_setup(self):
        """Executa o processo completo de instalação."""
        print("🚀 Configurando sistema de automação...")
        print("=" * 50)
        
        # Criar diretório se não existir
        self.automation_dir.mkdir(exist_ok=True)
        
        # Verificar dependências
        self.check_dependencies()
        
        # Criar configurações
        self.create_config_file()
        
        # Criar serviços
        self.create_service_files()
        
        # Criar scripts auxiliares
        self.create_monitoring_script()
        self.create_startup_script()
        
        print("\\n" + "=" * 50)
        print("✅ Sistema de automação configurado!")
        print("\\n📋 Próximos passos:")
        
        system = platform.system()
        if system == "Windows":
            print("1. Execute: automation\\install_windows.bat")
            print("2. Ou use: python automation\\start_recovery.py")
        elif system in ["Linux", "Darwin"]:
            print("1. Execute: ./automation/install_unix.sh")
            print("2. Ou use: python automation/start_recovery.py")
        
        print("\\n📊 Monitoramento:")
        print("   python automation/monitor.py")
        
        print("\\n⚙️ Configuração:")
        print("   Edite: automation/cache_config.json")

if __name__ == "__main__":
    setup = AutomationSetup()
    setup.run_setup()