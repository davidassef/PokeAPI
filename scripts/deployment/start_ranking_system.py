#!/usr/bin/env python3
"""
Script para iniciar todos os serviços necessários para o sistema de ranking.
"""

import subprocess
import time
import sys
import os
from pathlib import Path

def print_section(title):
    """Imprime uma seção do script."""
    print(f"\n{'='*50}")
    print(f"🚀 {title}")
    print(f"{'='*50}")

def start_client_server():
    """Inicia o client-server."""
    print_section("INICIANDO CLIENT-SERVER")
    
    try:
        # Verificar se o client-server já está rodando
        import requests
        response = requests.get("http://localhost:3001/api/client/health", timeout=2)
        if response.status_code == 200:
            print("✅ Client-server já está rodando")
            return True
    except:
        pass
    
    # Iniciar client-server
    client_server_dir = Path("../client-server")
    if not client_server_dir.exists():
        print("❌ Diretório client-server não encontrado")
        return False
    
    try:
        print("📦 Instalando dependências do client-server...")
        subprocess.run(["npm", "install"], cwd=client_server_dir, check=True, capture_output=True)
        
        print("🔄 Iniciando client-server...")
        # Iniciar em background
        process = subprocess.Popen(
            ["npm", "start"], 
            cwd=client_server_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Aguardar um pouco para o servidor iniciar
        time.sleep(3)
        
        # Verificar se está rodando
        try:
            response = requests.get("http://localhost:3001/api/client/health", timeout=5)
            if response.status_code == 200:
                print("✅ Client-server iniciado com sucesso")
                return True
            else:
                print(f"❌ Client-server retornou status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Erro ao verificar client-server: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao iniciar client-server: {e}")
        return False

def start_backend():
    """Inicia o backend."""
    print_section("INICIANDO BACKEND")
    
    try:
        # Verificar se o backend já está rodando
        import requests
        response = requests.get("http://localhost:8000/health", timeout=2)
        if response.status_code == 200:
            print("✅ Backend já está rodando")
            return True
    except:
        pass
    
    try:
        print("📦 Instalando dependências do backend...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True, capture_output=True)
        
        print("🔄 Iniciando backend...")
        # Iniciar em background
        process = subprocess.Popen(
            [sys.executable, "main.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Aguardar um pouco para o servidor iniciar
        time.sleep(5)
        
        # Verificar se está rodando
        try:
            response = requests.get("http://localhost:8000/health", timeout=5)
            if response.status_code == 200:
                print("✅ Backend iniciado com sucesso")
                return True
            else:
                print(f"❌ Backend retornou status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Erro ao verificar backend: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao iniciar backend: {e}")
        return False

def add_sample_data():
    """Adiciona dados de exemplo para testar o sistema."""
    print_section("ADICIONANDO DADOS DE EXEMPLO")
    
    try:
        import requests
        
        # Dados de exemplo
        sample_captures = [
            {"pokemon_id": 25, "pokemon_name": "pikachu", "action": "capture", "removed": False},
            {"pokemon_id": 6, "pokemon_name": "charizard", "action": "capture", "removed": False},
            {"pokemon_id": 150, "pokemon_name": "mewtwo", "action": "capture", "removed": False},
            {"pokemon_id": 1, "pokemon_name": "bulbasaur", "action": "capture", "removed": False},
            {"pokemon_id": 4, "pokemon_name": "charmander", "action": "capture", "removed": False},
            {"pokemon_id": 7, "pokemon_name": "squirtle", "action": "capture", "removed": False},
            {"pokemon_id": 94, "pokemon_name": "gengar", "action": "capture", "removed": False},
            {"pokemon_id": 130, "pokemon_name": "gyarados", "action": "capture", "removed": False},
            {"pokemon_id": 144, "pokemon_name": "articuno", "action": "capture", "removed": False},
            {"pokemon_id": 149, "pokemon_name": "dragonite", "action": "capture", "removed": False}
        ]
        
        print(f"📝 Adicionando {len(sample_captures)} capturas de exemplo...")
        
        for capture in sample_captures:
            response = requests.post(
                "http://localhost:3001/api/client/add-capture",
                json=capture,
                timeout=5
            )
            
            if response.status_code == 200:
                print(f"✅ Adicionado: {capture['pokemon_name']}")
            else:
                print(f"❌ Erro ao adicionar {capture['pokemon_name']}: {response.status_code}")
        
        print("✅ Dados de exemplo adicionados com sucesso")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao adicionar dados de exemplo: {e}")
        return False

def test_ranking_system():
    """Testa o sistema de ranking."""
    print_section("TESTANDO SISTEMA DE RANKING")
    
    try:
        import requests
        
        # Aguardar um pouco para o sistema processar
        print("⏳ Aguardando processamento...")
        time.sleep(10)
        
        # Testar endpoint de ranking
        response = requests.get("http://localhost:8000/api/v1/ranking/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Ranking obtido: {len(data)} entradas")
            
            if data:
                print("🏆 Top 5 do ranking:")
                for i, entry in enumerate(data[:5]):
                    print(f"   {i+1}. {entry.get('pokemon_name')} (ID: {entry.get('pokemon_id')}): {entry.get('favorite_count')} capturas")
            else:
                print("⚠️ Nenhum ranking encontrado")
        else:
            print(f"❌ Erro ao obter ranking: {response.status_code}")
        
        # Testar endpoint de storage ranking
        response = requests.get("http://localhost:8000/api/v1/pull-sync/storage-ranking", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Storage ranking: {data.get('total_entries', 0)} entradas")
        else:
            print(f"❌ Erro ao obter storage ranking: {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar sistema de ranking: {e}")
        return False

def main():
    """Executa o script principal."""
    print("🚀 INICIANDO SISTEMA DE RANKING")
    print(f"📅 {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Iniciar serviços
    client_server_ok = start_client_server()
    backend_ok = start_backend()
    
    if not client_server_ok or not backend_ok:
        print("\n❌ Falha ao iniciar serviços necessários")
        return
    
    # Adicionar dados de exemplo
    data_ok = add_sample_data()
    
    if data_ok:
        # Testar sistema
        test_ok = test_ranking_system()
        
        if test_ok:
            print("\n🎉 SISTEMA DE RANKING FUNCIONANDO!")
            print("\n📋 URLs disponíveis:")
            print("   - Backend: http://localhost:8000")
            print("   - Client-Server: http://localhost:3001")
            print("   - Ranking API: http://localhost:8000/api/v1/ranking/")
            print("   - Storage Ranking: http://localhost:8000/api/v1/pull-sync/storage-ranking")
        else:
            print("\n⚠️ Sistema iniciado mas com problemas no ranking")
    else:
        print("\n⚠️ Sistema iniciado mas sem dados de exemplo")

if __name__ == "__main__":
    main() 