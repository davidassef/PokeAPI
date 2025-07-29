#!/usr/bin/env python3
"""
Script de teste para o sistema de cache de imagens dos Pokémons.

Este script testa o funcionamento do ImageCacheService, incluindo:
- Download de imagens
- Armazenamento local
- Sistema de retry
- Estatísticas do cache
"""

import asyncio
import sys
import os
from pathlib import Path

# Adiciona o diretório do projeto ao path
sys.path.append(str(Path(__file__).parent))

from app.core.database import SessionLocal, engine
from app.services.image_cache_service import ImageCacheService, PokemonImageCache
from app.models.models import Base

async def test_image_cache():
    """
    Testa o sistema de cache de imagens.
    """
    print("🧪 Iniciando teste do sistema de cache de imagens...")
    
    # Cria tabelas se não existirem
    Base.metadata.create_all(bind=engine)
    
    # Inicializa serviço
    cache_service = ImageCacheService("test_pokemon_images")
    
    # Cria sessão do banco
    db = SessionLocal()
    
    try:
        # Lista de Pokémons para teste (populares)
        test_pokemon_ids = [1, 4, 7, 25, 94, 130, 144, 150]
        
        print(f"📥 Testando download de {len(test_pokemon_ids)} Pokémons...")
        
        # Testa download individual
        for pokemon_id in test_pokemon_ids[:3]:  # Apenas os 3 primeiros
            print(f"\n🔄 Testando Pokémon #{pokemon_id}...")
            
            # Testa official artwork
            image_path = await cache_service.get_pokemon_image(db, pokemon_id, 'official-artwork')
            if image_path:
                print(f"✅ Official artwork baixado: {image_path}")
                print(f"   Tamanho: {os.path.getsize(image_path)} bytes")
            else:
                print(f"❌ Falha no download do official artwork")
            
            # Testa sprite normal
            sprite_path = await cache_service.get_pokemon_image(db, pokemon_id, 'sprite')
            if sprite_path:
                print(f"✅ Sprite baixado: {sprite_path}")
                print(f"   Tamanho: {os.path.getsize(sprite_path)} bytes")
            else:
                print(f"❌ Falha no download do sprite")
        
        # Testa preload em lote
        print(f"\n📦 Testando preload em lote...")
        stats = await cache_service.preload_pokemon_images(
            db, 
            test_pokemon_ids[3:],  # Pokémons restantes
            ['official-artwork', 'sprite']
        )
        print(f"📊 Estatísticas do preload: {stats}")
        
        # Mostra estatísticas finais
        print(f"\n📈 Estatísticas finais do cache:")
        cache_stats = cache_service.get_cache_stats(db)
        for key, value in cache_stats.items():
            print(f"   {key}: {value}")
        
        # Lista arquivos baixados
        cache_dir = cache_service.cache_dir
        if cache_dir.exists():
            files = list(cache_dir.glob("*.png"))
            print(f"\n📁 Arquivos no cache ({len(files)}):")
            for file in files[:10]:  # Mostra apenas os 10 primeiros
                size_kb = file.stat().st_size / 1024
                print(f"   {file.name} ({size_kb:.1f} KB)")
            if len(files) > 10:
                print(f"   ... e mais {len(files) - 10} arquivos")
        
        print(f"\n✅ Teste concluído com sucesso!")
        
    except Exception as e:
        print(f"\n❌ Erro durante o teste: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        db.close()

async def test_error_handling():
    """
    Testa o tratamento de erros do sistema.
    """
    print("\n🧪 Testando tratamento de erros...")
    
    cache_service = ImageCacheService("test_pokemon_images")
    db = SessionLocal()
    
    try:
        # Testa ID inválido (muito alto)
        print("🔄 Testando ID inválido (9999)...")
        result = await cache_service.get_pokemon_image(db, 9999, 'official-artwork')
        if result:
            print(f"⚠️  Inesperado: download bem-sucedido para ID inválido")
        else:
            print(f"✅ Corretamente falhou para ID inválido")
        
        # Testa tipo de imagem inválido
        print("🔄 Testando tipo de imagem inválido...")
        result = await cache_service.get_pokemon_image(db, 1, 'invalid-type')
        if result:
            print(f"⚠️  Inesperado: download bem-sucedido para tipo inválido")
        else:
            print(f"✅ Corretamente falhou para tipo inválido")
        
        print("✅ Teste de tratamento de erros concluído!")
        
    except Exception as e:
        print(f"❌ Erro no teste de erros: {e}")
        
    finally:
        db.close()

def cleanup_test_files():
    """
    Limpa arquivos de teste.
    """
    print("\n🧹 Limpando arquivos de teste...")
    
    test_dir = Path("test_pokemon_images")
    if test_dir.exists():
        import shutil
        shutil.rmtree(test_dir)
        print(f"✅ Diretório de teste removido: {test_dir}")
    else:
        print(f"ℹ️  Diretório de teste não existe: {test_dir}")

async def main():
    """
    Função principal do teste.
    """
    print("🚀 Sistema de Cache de Imagens - Teste Completo")
    print("=" * 50)
    
    try:
        # Executa testes
        await test_image_cache()
        await test_error_handling()
        
        # Pergunta se deve limpar arquivos
        response = input("\n🗑️  Deseja remover os arquivos de teste? (s/N): ").lower()
        if response in ['s', 'sim', 'y', 'yes']:
            cleanup_test_files()
        else:
            print("ℹ️  Arquivos de teste mantidos para inspeção manual")
            
    except KeyboardInterrupt:
        print("\n⚠️  Teste interrompido pelo usuário")
    except Exception as e:
        print(f"\n❌ Erro geral: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Executa o teste
    asyncio.run(main())
