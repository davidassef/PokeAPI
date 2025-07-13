#!/usr/bin/env python3
"""
Script para diagnosticar problemas de timeout no sistema de autenticação.
"""
import requests
import json
import time
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

def test_backend_health():
    """Testa se o backend está respondendo."""
    try:
        print("🔍 Testando conectividade com o backend...")
        start_time = time.time()
        response = requests.get("http://localhost:8000/health", timeout=5)
        end_time = time.time()
        
        print(f"✅ Backend respondeu em {end_time - start_time:.2f}s")
        print(f"📋 Status: {response.status_code}")
        print(f"📋 Resposta: {response.json()}")
        return True
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT: Backend não respondeu em 5 segundos")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ ERRO DE CONEXÃO: Backend não está rodando na porta 8000")
        return False
    except Exception as e:
        print(f"❌ ERRO INESPERADO: {e}")
        return False

def test_register_endpoint_timeout():
    """Testa o endpoint de registro com diferentes timeouts."""
    user_data = {
        "email": "timeout_test@example.com",
        "password": "123456",
        "name": "Timeout Test User",
        "security_question": "pet",
        "security_answer": "dog"
    }
    
    timeouts = [1, 3, 5, 10, 15, 30]  # Diferentes valores de timeout
    
    for timeout_val in timeouts:
        try:
            print(f"\n🔍 Testando registro com timeout de {timeout_val}s...")
            start_time = time.time()
            
            response = requests.post(
                "http://localhost:8000/api/v1/auth/register",
                json=user_data,
                headers={"Content-Type": "application/json"},
                timeout=timeout_val
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            print(f"✅ Sucesso em {response_time:.2f}s (timeout: {timeout_val}s)")
            print(f"📋 Status: {response.status_code}")
            
            if response.status_code == 201:
                print("✅ Usuário registrado com sucesso!")
                return timeout_val, response_time
            else:
                print(f"⚠️ Status inesperado: {response.status_code}")
                print(f"📋 Resposta: {response.text}")
                
        except requests.exceptions.Timeout:
            print(f"❌ TIMEOUT: Requisição não completou em {timeout_val}s")
        except requests.exceptions.ConnectionError:
            print(f"❌ ERRO DE CONEXÃO: Não foi possível conectar ao backend")
            break
        except Exception as e:
            print(f"❌ ERRO: {e}")
    
    return None, None

def test_concurrent_requests():
    """Testa múltiplas requisições simultâneas para identificar gargalos."""
    print("\n🔍 Testando requisições concorrentes...")
    
    def make_request(request_id):
        user_data = {
            "email": f"concurrent_test_{request_id}@example.com",
            "password": "123456",
            "name": f"Concurrent Test User {request_id}",
            "security_question": "pet",
            "security_answer": "dog"
        }
        
        try:
            start_time = time.time()
            response = requests.post(
                "http://localhost:8000/api/v1/auth/register",
                json=user_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            end_time = time.time()
            
            return {
                'id': request_id,
                'status': response.status_code,
                'time': end_time - start_time,
                'success': response.status_code == 201
            }
        except Exception as e:
            return {
                'id': request_id,
                'error': str(e),
                'success': False
            }
    
    # Testa com 3 requisições simultâneas
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = [executor.submit(make_request, i) for i in range(1, 4)]
        results = [future.result() for future in as_completed(futures)]
    
    successful = sum(1 for r in results if r.get('success', False))
    print(f"📊 Resultados: {successful}/3 requisições bem-sucedidas")
    
    for result in results:
        if result.get('success'):
            print(f"✅ Requisição {result['id']}: {result['time']:.2f}s")
        else:
            print(f"❌ Requisição {result['id']}: {result.get('error', 'Falha')}")

def analyze_timeout_configuration():
    """Analisa a configuração atual de timeout."""
    print("\n🔍 Analisando configuração de timeout...")
    
    # Verifica configurações do frontend
    try:
        with open('../frontend/src/app/core/services/auth.service.ts', 'r', encoding='utf-8') as f:
            content = f.read()
            if 'timeout(' in content:
                import re
                timeout_matches = re.findall(r'timeout\((\d+)\)', content)
                if timeout_matches:
                    print(f"📋 Timeout configurado no AuthService: {timeout_matches[0]}ms")
                else:
                    print("⚠️ Timeout encontrado mas valor não identificado")
            else:
                print("❌ Nenhum timeout configurado no AuthService")
    except Exception as e:
        print(f"❌ Erro ao analisar AuthService: {e}")
    
    # Verifica configuração de proxy
    try:
        with open('../frontend/proxy.conf.json', 'r', encoding='utf-8') as f:
            proxy_config = json.load(f)
            print(f"📋 Configuração de proxy: {json.dumps(proxy_config, indent=2)}")
    except Exception as e:
        print(f"❌ Erro ao analisar proxy.conf.json: {e}")

def main():
    """Função principal de diagnóstico."""
    print("🚀 Iniciando diagnóstico de timeout no sistema de autenticação...")
    print("=" * 60)
    
    # Teste 1: Conectividade básica
    if not test_backend_health():
        print("\n❌ Backend não está acessível. Verifique se está rodando na porta 8000.")
        sys.exit(1)
    
    # Teste 2: Análise de configuração
    analyze_timeout_configuration()
    
    # Teste 3: Teste de timeout no registro
    optimal_timeout, response_time = test_register_endpoint_timeout()
    
    if optimal_timeout:
        print(f"\n✅ DIAGNÓSTICO CONCLUÍDO:")
        print(f"📊 Timeout ótimo identificado: {optimal_timeout}s")
        print(f"📊 Tempo de resposta médio: {response_time:.2f}s")
        print(f"💡 RECOMENDAÇÃO: Configure timeout para {optimal_timeout + 5}s no frontend")
    else:
        print(f"\n❌ PROBLEMA IDENTIFICADO:")
        print(f"📊 Nenhum timeout funcionou - possível problema no backend")
        print(f"💡 RECOMENDAÇÃO: Verifique logs do backend e configuração de banco de dados")
    
    # Teste 4: Requisições concorrentes
    test_concurrent_requests()
    
    print("\n" + "=" * 60)
    print("🎯 Diagnóstico completo!")

if __name__ == "__main__":
    main()
