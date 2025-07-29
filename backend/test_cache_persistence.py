#!/usr/bin/env python3
"""
Teste específico para GARANTIR que as imagens são armazenadas localmente
e servidas do cache sem depender da API externa.

Este teste simula a instabilidade da API externa e verifica se o sistema
continua funcionando com as imagens já cacheadas.
"""

import asyncio
import sys
import os
import time
import requests
from pathlib import Path
from unittest.mock import patch, AsyncMock

# Adiciona o diretório do projeto ao path
sys.path.append(str(Path(__file__).parent))

from app.core.database import SessionLocal, engine
from app.services.image_cache_service import ImageCacheService, PokemonImageCache
from app.models.models import Base

async def test_cache_persistence():
    """
    Testa se as imagens são realmente armazenadas e servidas do cache local.
    """
    print("🧪 TESTE DE PERSISTÊNCIA DO CACHE")
    print("=" * 50)
    
    # Cria tabelas se não existirem
    Base.metadata.create_all(bind=engine)
    
    # Inicializa serviço com diretório específico
    cache_service = ImageCacheService("test_persistence_cache")
    db = SessionLocal()
    
    try:
        # FASE 1: Download inicial (com API funcionando)
        print("\n📥 FASE 1: Download inicial com API funcionando")
        test_pokemon_id = 25  # Pikachu
        
        # Limpa cache anterior se existir
        existing_entry = db.query(PokemonImageCache).filter(
            PokemonImageCache.pokemon_id == test_pokemon_id,
            PokemonImageCache.image_type == 'official-artwork'
        ).first()
        
        if existing_entry:
            if os.path.exists(existing_entry.local_path):
                os.remove(existing_entry.local_path)
            db.delete(existing_entry)
            db.commit()
            print(f"🗑️ Cache anterior limpo para Pokémon {test_pokemon_id}")
        
        # Faz download inicial
        print(f"🔄 Baixando imagem do Pokémon {test_pokemon_id}...")
        image_path = await cache_service.get_pokemon_image(db, test_pokemon_id, 'official-artwork')
        
        if image_path and os.path.exists(image_path):
            file_size = os.path.getsize(image_path)
            print(f"✅ Download bem-sucedido: {image_path}")
            print(f"📏 Tamanho do arquivo: {file_size} bytes")
            
            # Verifica entrada no banco
            cache_entry = db.query(PokemonImageCache).filter(
                PokemonImageCache.pokemon_id == test_pokemon_id,
                PokemonImageCache.image_type == 'official-artwork'
            ).first()
            
            if cache_entry and cache_entry.is_downloaded:
                print(f"✅ Entrada no banco criada corretamente")
                print(f"📁 Caminho no banco: {cache_entry.local_path}")
                print(f"📊 Tamanho no banco: {cache_entry.file_size} bytes")
            else:
                print(f"❌ ERRO: Entrada no banco não foi criada corretamente")
                return False
        else:
            print(f"❌ ERRO: Falha no download inicial")
            return False
        
        # FASE 2: Teste com API "offline" (simulando instabilidade)
        print(f"\n🚫 FASE 2: Simulando API externa offline")
        
        # Mock das requisições HTTP para simular API offline
        with patch('aiohttp.ClientSession.get') as mock_get:
            # Configura mock para simular falha de rede
            mock_response = AsyncMock()
            mock_response.status = 500
            mock_response.read = AsyncMock(side_effect=Exception("API offline"))
            mock_get.return_value.__aenter__.return_value = mock_response
            
            print(f"🔄 Tentando obter imagem com API 'offline'...")
            
            # Deve retornar do cache local, não tentar baixar novamente
            cached_image_path = await cache_service.get_pokemon_image(db, test_pokemon_id, 'official-artwork')
            
            if cached_image_path and os.path.exists(cached_image_path):
                print(f"✅ SUCESSO: Imagem servida do cache local!")
                print(f"📁 Caminho: {cached_image_path}")
                print(f"📏 Tamanho: {os.path.getsize(cached_image_path)} bytes")
                
                # Verifica se é o mesmo arquivo
                if cached_image_path == image_path:
                    print(f"✅ CONFIRMADO: Mesmo arquivo do cache inicial")
                else:
                    print(f"⚠️ AVISO: Caminho diferente, mas arquivo existe")
                    
            else:
                print(f"❌ FALHA CRÍTICA: Sistema não serviu do cache local!")
                return False
        
        # FASE 3: Teste via endpoint HTTP
        print(f"\n🌐 FASE 3: Teste via endpoint HTTP")
        
        try:
            # Testa endpoint direto
            response = requests.get(f"http://localhost:8000/api/v1/images/pokemon/{test_pokemon_id}", timeout=10)
            
            if response.status_code == 200:
                content_length = len(response.content)
                print(f"✅ Endpoint HTTP funcionando: {content_length} bytes")
                
                # Verifica se não é placeholder
                is_placeholder = response.headers.get('X-Placeholder') == 'true'
                if not is_placeholder and content_length > 1000:
                    print(f"✅ CONFIRMADO: Endpoint serve imagem real do cache")
                else:
                    print(f"⚠️ AVISO: Endpoint retornou placeholder")
                    
            else:
                print(f"❌ Endpoint HTTP falhou: Status {response.status_code}")
                
        except Exception as e:
            print(f"⚠️ Não foi possível testar endpoint HTTP: {e}")
            print(f"ℹ️ (Isso é normal se o servidor não estiver rodando)")
        
        # FASE 4: Teste de múltiplas requisições
        print(f"\n🔄 FASE 4: Teste de múltiplas requisições")
        
        start_time = time.time()
        for i in range(5):
            cached_path = await cache_service.get_pokemon_image(db, test_pokemon_id, 'official-artwork')
            if not cached_path:
                print(f"❌ Falha na requisição {i+1}")
                return False
        
        end_time = time.time()
        avg_time = (end_time - start_time) / 5
        
        print(f"✅ 5 requisições bem-sucedidas")
        print(f"⚡ Tempo médio por requisição: {avg_time:.3f}s")
        
        if avg_time < 0.1:  # Deve ser muito rápido se vem do cache
            print(f"✅ CONFIRMADO: Velocidade indica cache local")
        else:
            print(f"⚠️ AVISO: Tempo pode indicar acesso à rede")
        
        # FASE 5: Verificação final de arquivos
        print(f"\n📁 FASE 5: Verificação final de arquivos")
        
        cache_dir = cache_service.cache_dir
        png_files = list(cache_dir.glob("*.png"))
        
        print(f"📂 Diretório de cache: {cache_dir.absolute()}")
        print(f"📄 Arquivos PNG encontrados: {len(png_files)}")
        
        for file in png_files:
            size_kb = file.stat().st_size / 1024
            print(f"  📄 {file.name} ({size_kb:.1f} KB)")
        
        # Verifica se o arquivo específico existe
        expected_file = cache_dir / f"{test_pokemon_id}_official-artwork.png"
        if expected_file.exists():
            print(f"✅ CONFIRMADO: Arquivo específico existe: {expected_file}")
        else:
            print(f"❌ ERRO: Arquivo específico não encontrado: {expected_file}")
            return False
        
        print(f"\n🎉 TESTE DE PERSISTÊNCIA CONCLUÍDO COM SUCESSO!")
        print(f"✅ Sistema GARANTE armazenamento local das imagens")
        print(f"✅ Sistema SERVE do cache mesmo com API offline")
        print(f"✅ Sistema é INDEPENDENTE da API externa após download inicial")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO CRÍTICO no teste: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        db.close()

async def test_cache_stats():
    """
    Testa as estatísticas do cache para verificar persistência.
    """
    print(f"\n📊 TESTE DE ESTATÍSTICAS DO CACHE")
    
    cache_service = ImageCacheService("test_persistence_cache")
    db = SessionLocal()
    
    try:
        stats = cache_service.get_cache_stats(db)
        
        print(f"📈 Estatísticas atuais:")
        for key, value in stats.items():
            print(f"  {key}: {value}")
        
        # Verifica se há imagens baixadas
        if stats.get('downloaded', 0) > 0:
            print(f"✅ CONFIRMADO: {stats['downloaded']} imagens persistidas no cache")
        else:
            print(f"⚠️ AVISO: Nenhuma imagem no cache")
        
        # Verifica taxa de sucesso
        total = stats.get('total_entries', 0)
        downloaded = stats.get('downloaded', 0)
        
        if total > 0:
            success_rate = (downloaded / total) * 100
            print(f"📊 Taxa de sucesso: {success_rate:.1f}%")
            
            if success_rate >= 80:
                print(f"✅ Taxa de sucesso excelente")
            else:
                print(f"⚠️ Taxa de sucesso baixa")
        
    except Exception as e:
        print(f"❌ Erro ao obter estatísticas: {e}")
        
    finally:
        db.close()

def cleanup_test_cache():
    """
    Limpa o cache de teste.
    """
    print(f"\n🧹 Limpando cache de teste...")
    
    cache_dir = Path("test_persistence_cache")
    if cache_dir.exists():
        import shutil
        shutil.rmtree(cache_dir)
        print(f"✅ Cache de teste removido")
    
    # Limpa entradas do banco
    db = SessionLocal()
    try:
        deleted = db.query(PokemonImageCache).filter(
            PokemonImageCache.local_path.like('%test_persistence_cache%')
        ).delete(synchronize_session=False)
        db.commit()
        print(f"✅ {deleted} entradas removidas do banco")
    except Exception as e:
        print(f"⚠️ Erro ao limpar banco: {e}")
    finally:
        db.close()

async def main():
    """
    Executa todos os testes de persistência.
    """
    print("🚀 TESTE COMPLETO DE PERSISTÊNCIA DO CACHE DE IMAGENS")
    print("🎯 OBJETIVO: Garantir que imagens são armazenadas localmente")
    print("🎯 OBJETIVO: Verificar independência da API externa")
    print("=" * 60)
    
    try:
        # Executa teste principal
        success = await test_cache_persistence()
        
        if success:
            # Executa teste de estatísticas
            await test_cache_stats()
            
            print(f"\n" + "=" * 60)
            print(f"🎉 RESULTADO FINAL: SISTEMA APROVADO!")
            print(f"✅ Imagens SÃO armazenadas localmente")
            print(f"✅ Sistema FUNCIONA sem API externa")
            print(f"✅ Cache é PERSISTENTE e CONFIÁVEL")
        else:
            print(f"\n" + "=" * 60)
            print(f"❌ RESULTADO FINAL: SISTEMA REPROVADO!")
            print(f"❌ Problemas de persistência detectados")
        
        # Pergunta sobre limpeza
        response = input(f"\n🗑️ Deseja limpar o cache de teste? (s/N): ").lower()
        if response in ['s', 'sim', 'y', 'yes']:
            cleanup_test_cache()
        else:
            print(f"ℹ️ Cache de teste mantido para inspeção manual")
            print(f"📁 Localização: test_persistence_cache/")
        
    except KeyboardInterrupt:
        print(f"\n⚠️ Teste interrompido pelo usuário")
    except Exception as e:
        print(f"\n❌ Erro geral: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
