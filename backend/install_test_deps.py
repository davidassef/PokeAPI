#!/usr/bin/env python3
"""
Script para instalar dependências de teste para o sistema de autenticação.
"""
import subprocess
import sys
import os

def run_command(command, description):
    """Executa um comando e mostra o resultado."""
    print(f"🔄 {description}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} - Concluído")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Falhou")
        print(f"Erro: {e.stderr}")
        return False

def main():
    """Instala todas as dependências necessárias para testes."""
    print("🚀 INSTALANDO DEPENDÊNCIAS DE TESTE")
    print("=" * 50)
    
    # Verificar se estamos no diretório correto
    if not os.path.exists("requirements.txt"):
        print("❌ Arquivo requirements.txt não encontrado!")
        print("Execute este script no diretório backend/")
        return False
    
    # Lista de dependências de teste
    test_dependencies = [
        "pytest>=7.0.0",
        "pytest-cov>=4.0.0", 
        "pytest-html>=3.1.0",
        "pytest-asyncio>=0.21.0",
        "httpx>=0.24.0",  # Para TestClient
        "requests>=2.28.0",  # Para testes de integração
        "faker>=18.0.0",  # Para dados de teste
    ]
    
    print("📦 Instalando dependências principais...")
    if not run_command("pip install -r requirements.txt", "Dependências principais"):
        return False
    
    print("\n🧪 Instalando dependências de teste...")
    for dep in test_dependencies:
        if not run_command(f"pip install {dep}", f"Instalando {dep}"):
            print(f"⚠️ Falha ao instalar {dep}, continuando...")
    
    print("\n🔍 Verificando instalação...")
    
    # Verificar se os pacotes foram instalados
    required_modules = [
        ("pytest", "pytest"),
        ("pytest_cov", "pytest-cov"),
        ("pytest_html", "pytest-html"),
        ("httpx", "httpx"),
        ("requests", "requests"),
        ("faker", "faker")
    ]
    
    all_installed = True
    for module_name, package_name in required_modules:
        try:
            __import__(module_name)
            print(f"✅ {package_name}")
        except ImportError:
            print(f"❌ {package_name} - FALTANDO")
            all_installed = False
    
    if all_installed:
        print("\n🎉 Todas as dependências foram instaladas com sucesso!")
        print("\n💡 Próximos passos:")
        print("   1. Execute os testes: python tests/run_auth_tests.py")
        print("   2. Ou execute testes individuais: pytest tests/unit/test_auth_service.py -v")
        print("   3. Para cobertura: pytest --cov=app tests/")
        return True
    else:
        print("\n⚠️ Algumas dependências falharam na instalação.")
        print("Tente instalar manualmente:")
        for module_name, package_name in required_modules:
            try:
                __import__(module_name)
            except ImportError:
                print(f"   pip install {package_name}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
