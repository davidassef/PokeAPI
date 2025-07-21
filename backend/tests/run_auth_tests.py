#!/usr/bin/env python3
"""
Script para executar todos os testes de autenticação e gerar relatórios.
"""
import os
import sys
import subprocess
import time
from datetime import datetime
from pathlib import Path

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def run_command(command, description):
    """Executa um comando e retorna o resultado."""
    print(f"\n🔄 {description}")
    print("=" * 60)
    
    try:
        start_time = time.time()
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            cwd=os.path.join(os.path.dirname(__file__), '..')
        )
        end_time = time.time()
        
        duration = end_time - start_time
        
        if result.returncode == 0:
            print(f"✅ {description} - Concluído em {duration:.2f}s")
            if result.stdout:
                print(result.stdout)
        else:
            print(f"❌ {description} - Falhou em {duration:.2f}s")
            if result.stderr:
                print("STDERR:", result.stderr)
            if result.stdout:
                print("STDOUT:", result.stdout)
        
        return result.returncode == 0, result.stdout, result.stderr, duration
    
    except Exception as e:
        print(f"❌ Erro ao executar {description}: {e}")
        return False, "", str(e), 0

def check_dependencies():
    """Verifica se as dependências necessárias estão instaladas."""
    print("🔍 Verificando dependências...")
    
    required_packages = [
        "pytest",
        "pytest-cov",
        "pytest-html",
        "fastapi",
        "sqlalchemy",
        "passlib",
        "python-jose"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} - FALTANDO")
    
    if missing_packages:
        print(f"\n⚠️ Pacotes faltando: {', '.join(missing_packages)}")
        print("Execute: pip install " + " ".join(missing_packages))
        return False
    
    print("✅ Todas as dependências estão instaladas")
    return True

def create_test_report_dir():
    """Cria diretório para relatórios de teste."""
    report_dir = Path("test_reports")
    report_dir.mkdir(exist_ok=True)
    return report_dir

def main():
    """Função principal para executar todos os testes."""
    print("🚀 EXECUTANDO TESTES DE AUTENTICAÇÃO")
    print("=" * 60)
    print(f"Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Verificar dependências
    if not check_dependencies():
        print("\n❌ Dependências faltando. Instale-as antes de continuar.")
        return False
    
    # Criar diretório de relatórios
    report_dir = create_test_report_dir()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Lista de testes para executar
    test_suites = [
        {
            "name": "Testes Unitários - AuthService",
            "command": "python -m pytest tests/unit/test_auth_service.py -v --tb=short",
            "file": "test_auth_service.py"
        },
        {
            "name": "Testes Unitários - AuthRoutes", 
            "command": "python -m pytest tests/unit/test_auth_routes.py -v --tb=short",
            "file": "test_auth_routes.py"
        },
        {
            "name": "Testes Unitários - AuthMiddleware",
            "command": "python -m pytest tests/unit/test_auth_middleware.py -v --tb=short", 
            "file": "test_auth_middleware.py"
        },
        {
            "name": "Testes de Integração - Auth",
            "command": "python -m pytest tests/integration/test_auth_integration.py -v --tb=short -s",
            "file": "test_auth_integration.py"
        }
    ]
    
    # Executar testes individuais
    results = []
    total_duration = 0
    
    for suite in test_suites:
        success, stdout, stderr, duration = run_command(suite["command"], suite["name"])
        results.append({
            "name": suite["name"],
            "file": suite["file"],
            "success": success,
            "stdout": stdout,
            "stderr": stderr,
            "duration": duration
        })
        total_duration += duration
    
    # Executar todos os testes com cobertura
    print("\n🔄 Executando todos os testes com cobertura...")
    coverage_command = (
        "python -m pytest tests/unit/ tests/integration/ "
        "--cov=app.services.auth_service "
        "--cov=app.routes.auth "
        "--cov=app.core.auth_middleware "
        f"--cov-report=html:{report_dir}/coverage_html_{timestamp} "
        f"--cov-report=term "
        f"--html={report_dir}/report_{timestamp}.html "
        "--self-contained-html "
        "-v"
    )
    
    coverage_success, coverage_stdout, coverage_stderr, coverage_duration = run_command(
        coverage_command, 
        "Cobertura de Testes"
    )
    
    total_duration += coverage_duration
    
    # Gerar relatório final
    print("\n" + "=" * 60)
    print("📊 RELATÓRIO FINAL DOS TESTES")
    print("=" * 60)
    
    passed_tests = sum(1 for r in results if r["success"])
    total_tests = len(results)
    
    print(f"📈 Resumo Geral:")
    print(f"   ✅ Testes Passaram: {passed_tests}/{total_tests}")
    print(f"   ⏱️ Tempo Total: {total_duration:.2f}s")
    print(f"   📁 Relatórios em: {report_dir.absolute()}")
    
    print(f"\n📋 Detalhes por Suíte:")
    for result in results:
        status = "✅ PASSOU" if result["success"] else "❌ FALHOU"
        print(f"   {status} - {result['name']} ({result['duration']:.2f}s)")
    
    # Cobertura
    coverage_status = "✅ PASSOU" if coverage_success else "❌ FALHOU"
    print(f"   {coverage_status} - Relatório de Cobertura ({coverage_duration:.2f}s)")
    
    # Identificar falhas
    failed_tests = [r for r in results if not r["success"]]
    if failed_tests:
        print(f"\n⚠️ TESTES QUE FALHARAM:")
        for failed in failed_tests:
            print(f"   ❌ {failed['name']}")
            if failed['stderr']:
                print(f"      Erro: {failed['stderr'][:200]}...")
    
    # Recomendações
    print(f"\n💡 PRÓXIMOS PASSOS:")
    if passed_tests == total_tests and coverage_success:
        print("   🎉 Todos os testes passaram! Sistema de autenticação está funcionando.")
        print("   ✅ Verifique o relatório de cobertura para áreas não testadas.")
        print("   🚀 Sistema pronto para produção.")
    else:
        print("   🔧 Corrija os testes que falharam antes de continuar.")
        print("   📖 Verifique os logs detalhados nos relatórios HTML.")
        print("   🧪 Execute testes individuais para debug: pytest tests/unit/test_auth_service.py -v")
    
    print(f"\n📁 Arquivos de Relatório:")
    print(f"   📊 HTML: {report_dir}/report_{timestamp}.html")
    print(f"   📈 Cobertura: {report_dir}/coverage_html_{timestamp}/index.html")
    
    # Salvar resumo em arquivo
    summary_file = report_dir / f"summary_{timestamp}.txt"
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write(f"RELATÓRIO DE TESTES DE AUTENTICAÇÃO\n")
        f.write(f"Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Testes Passaram: {passed_tests}/{total_tests}\n")
        f.write(f"Tempo Total: {total_duration:.2f}s\n\n")
        
        for result in results:
            status = "PASSOU" if result["success"] else "FALHOU"
            f.write(f"{status} - {result['name']} ({result['duration']:.2f}s)\n")
        
        if failed_tests:
            f.write(f"\nTESTS QUE FALHARAM:\n")
            for failed in failed_tests:
                f.write(f"- {failed['name']}\n")
                f.write(f"  Erro: {failed['stderr']}\n\n")
    
    print(f"   📄 Resumo: {summary_file}")
    
    return passed_tests == total_tests and coverage_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
