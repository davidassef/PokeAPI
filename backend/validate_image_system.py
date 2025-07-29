#!/usr/bin/env python3
"""
Script de validação e diagnóstico do sistema de cache de imagens.

Este script verifica se o sistema está funcionando corretamente e
identifica problemas específicos que podem estar causando instabilidade.
"""

import asyncio
import sys
import os
import requests
from pathlib import Path
from datetime import datetime

# Adiciona o diretório do projeto ao path
sys.path.append(str(Path(__file__).parent))

from app.core.database import SessionLocal, engine
from app.services.image_cache_service import ImageCacheService, PokemonImageCache
from app.models.models import Base

def test_external_urls():
    """
    Testa se as URLs externas estão acessíveis.
    """
    print("🌐 Testando conectividade com URLs externas...")
    
    test_urls = [
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
    ]
    
    results = {}
    for url in test_urls:
        try:
            print(f"  🔍 Testando: {url}")
            response = requests.get(url, timeout=10)
            results[url] = {
                'status': response.status_code,
                'size': len(response.content),
                'success': response.status_code == 200 and len(response.content) > 1000
            }
            
            if results[url]['success']:
                print(f"    ✅ OK - {results[url]['size']} bytes")
            else:
                print(f"    ❌ FALHA - Status: {results[url]['status']}, Size: {results[url]['size']}")
                
        except Exception as e:
            results[url] = {'error': str(e), 'success': False}
            print(f"    ❌ ERRO - {e}")
    
    success_count = sum(1 for r in results.values() if r.get('success', False))
    print(f"\n📊 Resultado: {success_count}/{len(test_urls)} URLs acessíveis")
    
    return results

async def test_image_cache_service():
    """
    Testa o ImageCacheService diretamente.
    """
    print("\n🧪 Testando ImageCacheService...")
    
    # Cria tabelas se não existirem
    Base.metadata.create_all(bind=engine)
    
    # Inicializa serviço
    cache_service = ImageCacheService("test_validation_images")
    db = SessionLocal()
    
    try:
        # Testa Pokémons populares
        test_pokemon = [1, 25, 150]  # Bulbasaur, Pikachu, Mewtwo
        
        for pokemon_id in test_pokemon:
            print(f"\n  🔍 Testando Pokémon #{pokemon_id}...")
            
            # Testa download
            result = await cache_service.get_pokemon_image(db, pokemon_id, 'official-artwork')
            
            if result and os.path.exists(result):
                size = os.path.getsize(result)
                print(f"    ✅ Sucesso - {result} ({size} bytes)")
                
                # Verifica integridade
                if cache_service._verify_image_integrity(result, size):
                    print(f"    ✅ Integridade OK")
                else:
                    print(f"    ⚠️ Problema de integridade")
            else:
                print(f"    ❌ Falha no download")
                
                # Verifica entrada no banco
                entry = db.query(PokemonImageCache).filter(
                    PokemonImageCache.pokemon_id == pokemon_id,
                    PokemonImageCache.image_type == 'official-artwork'
                ).first()
                
                if entry:
                    print(f"    📝 Tentativas: {entry.download_attempts}")
                    print(f"    📅 Última tentativa: {entry.last_attempt}")
                    print(f"    📁 Caminho: {entry.local_path}")
                else:
                    print(f"    📝 Nenhuma entrada no banco")
        
        # Estatísticas gerais
        print(f"\n📊 Estatísticas do cache:")
        stats = cache_service.get_cache_stats(db)
        for key, value in stats.items():
            print(f"  {key}: {value}")
            
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        db.close()

def test_backend_api():
    """
    Testa os endpoints da API do backend.
    """
    print("\n🌐 Testando endpoints da API...")
    
    base_url = "http://localhost:8000/api/v1/images"
    
    endpoints = [
        f"{base_url}/pokemon/1",
        f"{base_url}/pokemon/25?image_type=official-artwork",
        f"{base_url}/pokemon/1/info",
        f"{base_url}/cache/stats"
    ]
    
    for endpoint in endpoints:
        try:
            print(f"  🔍 Testando: {endpoint}")
            response = requests.get(endpoint, timeout=15)
            
            if response.status_code == 200:
                if 'application/json' in response.headers.get('content-type', ''):
                    data = response.json()
                    print(f"    ✅ OK - JSON: {len(str(data))} chars")
                else:
                    print(f"    ✅ OK - Blob: {len(response.content)} bytes")
            else:
                print(f"    ❌ Status: {response.status_code}")
                
        except Exception as e:
            print(f"    ❌ ERRO - {e}")

def check_file_system():
    """
    Verifica o sistema de arquivos e permissões.
    """
    print("\n📁 Verificando sistema de arquivos...")
    
    # Verifica diretório de cache
    cache_dirs = ["pokemon_images", "test_validation_images"]
    
    for cache_dir in cache_dirs:
        cache_path = Path(cache_dir)
        print(f"  📂 Diretório: {cache_path.absolute()}")
        
        if cache_path.exists():
            print(f"    ✅ Existe")
            
            # Verifica permissões
            if os.access(cache_path, os.W_OK):
                print(f"    ✅ Permissão de escrita OK")
            else:
                print(f"    ❌ Sem permissão de escrita")
                
            # Lista arquivos
            files = list(cache_path.glob("*.png"))
            print(f"    📄 Arquivos PNG: {len(files)}")
            
            if files:
                total_size = sum(f.stat().st_size for f in files[:10])  # Primeiros 10
                print(f"    💾 Tamanho total (10 primeiros): {total_size / 1024:.1f} KB")
        else:
            print(f"    ⚠️ Não existe")
            
            # Tenta criar
            try:
                cache_path.mkdir(parents=True, exist_ok=True)
                print(f"    ✅ Criado com sucesso")
            except Exception as e:
                print(f"    ❌ Erro ao criar: {e}")

def check_database():
    """
    Verifica o banco de dados e tabelas.
    """
    print("\n🗄️ Verificando banco de dados...")
    
    try:
        db = SessionLocal()
        
        # Verifica se a tabela existe
        result = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='pokemon_image_cache'")
        table_exists = result.fetchone() is not None
        
        if table_exists:
            print("  ✅ Tabela pokemon_image_cache existe")
            
            # Conta registros
            count = db.query(PokemonImageCache).count()
            print(f"  📊 Total de registros: {count}")
            
            # Conta downloads bem-sucedidos
            downloaded = db.query(PokemonImageCache).filter(PokemonImageCache.is_downloaded == True).count()
            print(f"  ✅ Downloads bem-sucedidos: {downloaded}")
            
            # Conta falhas
            failed = db.query(PokemonImageCache).filter(
                PokemonImageCache.is_downloaded == False,
                PokemonImageCache.download_attempts >= 3
            ).count()
            print(f"  ❌ Falhas permanentes: {failed}")
            
            # Mostra últimas tentativas
            recent = db.query(PokemonImageCache).order_by(PokemonImageCache.last_attempt.desc()).limit(5).all()
            print(f"  📅 Últimas 5 tentativas:")
            for entry in recent:
                status = "✅" if entry.is_downloaded else "❌"
                print(f"    {status} Pokémon {entry.pokemon_id} ({entry.image_type}) - {entry.download_attempts} tentativas")
                
        else:
            print("  ❌ Tabela pokemon_image_cache não existe")
            
            # Tenta criar
            try:
                Base.metadata.create_all(bind=engine)
                print("  ✅ Tabelas criadas com sucesso")
            except Exception as e:
                print(f"  ❌ Erro ao criar tabelas: {e}")
                
    except Exception as e:
        print(f"❌ Erro ao verificar banco: {e}")
    finally:
        db.close()

async def main():
    """
    Executa todos os testes de validação.
    """
    print("🚀 Sistema de Validação do Cache de Imagens")
    print("=" * 50)
    print(f"📅 Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Executa todos os testes
    test_external_urls()
    check_file_system()
    check_database()
    await test_image_cache_service()
    test_backend_api()
    
    print("\n" + "=" * 50)
    print("✅ Validação concluída!")
    print("\n💡 Dicas para resolver problemas:")
    print("  - Se URLs externas falharem: verificar conectividade")
    print("  - Se permissões falharem: verificar direitos de escrita")
    print("  - Se API falhar: verificar se backend está rodando")
    print("  - Se downloads falharem: verificar logs detalhados")

if __name__ == "__main__":
    asyncio.run(main())
