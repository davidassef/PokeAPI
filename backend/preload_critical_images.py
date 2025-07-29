#!/usr/bin/env python3
"""
Script para pré-carregar imagens críticas dos Pokémons (1-151)

Este script garante que todas as imagens dos Pokémons principais
estejam disponíveis localmente, eliminando dependência da API externa.
"""

import asyncio
import sys
import os
from pathlib import Path
import requests
import json
import time

# Adiciona o diretório do projeto ao path
sys.path.append(str(Path(__file__).parent))

from app.core.database import SessionLocal, engine
from app.services.image_cache_service import ImageCacheService, PokemonImageCache
from app.models.models import Base

async def preload_critical_pokemons():
    """Pré-carrega imagens dos Pokémons 1-151"""
    
    print("🚀 PRÉ-CARREGAMENTO DE IMAGENS CRÍTICAS")
    print("="*60)
    
    # Cria tabelas se não existirem
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    cache_service = ImageCacheService("pokemon_images")
    
    try:
        # Pokémons críticos (1-151 - primeira geração)
        critical_pokemon = list(range(1, 152))
        
        print(f"📊 Total de Pokémons para pré-carregar: {len(critical_pokemon)}")
        
        # Verifica quais já estão no cache
        existing = db.query(PokemonImageCache).filter(
            PokemonImageCache.pokemon_id.in_(critical_pokemon),
            PokemonImageCache.image_type == 'official-artwork',
            PokemonImageCache.is_downloaded == True
        ).count()
        
        print(f"📥 Já existem: {existing} imagens no cache")
        
        # Filtra apenas os que faltam
        missing = []
        for pid in critical_pokemon:
            entry = db.query(PokemonImageCache).filter(
                PokemonImageCache.pokemon_id == pid,
                PokemonImageCache.image_type == 'official-artwork',
                PokemonImageCache.is_downloaded == True
            ).first()
            
            if not entry or not os.path.exists(entry.local_path):
                missing.append(pid)
        
        print(f"🔄 Faltando baixar: {len(missing)} imagens")
        
        if not missing:
            print("✅ Todas as imagens críticas já estão disponíveis!")
            return
        
        # Download em lote com retry inteligente
        success_count = 0
        failed_count = 0
        
        print("\n📥 Iniciando download em lote...")
        
        # Processa em lotes de 10 para evitar rate limit
        batch_size = 10
        for i in range(0, len(missing), batch_size):
            batch = missing[i:i+batch_size]
            print(f"\n📦 Processando lote {i//batch_size + 1}/{(len(missing) + batch_size - 1)//batch_size}")
            
            for pokemon_id in batch:
                try:
                    print(f"  🖼️ Baixando Pokémon #{pokemon_id}...")
                    
                    result = await cache_service.get_pokemon_image(
                        db, pokemon_id, 'official-artwork'
                    )
                    
                    if result and os.path.exists(result):
                        size = os.path.getsize(result)
                        print(f"    ✅ Sucesso - {size} bytes")
                        success_count += 1
                    else:
                        print(f"    ❌ Falha no download")
                        failed_count += 1
                        
                except Exception as e:
                    print(f"    ❌ Erro: {e}")
                    failed_count += 1
            
            # Pausa entre lotes para respeitar rate limits
            if i + batch_size < len(missing):
                print("  ⏸️ Pausa de 2 segundos...")
                await asyncio.sleep(2)
        
        # Estatísticas finais
        stats = cache_service.get_cache_stats(db)
        
        print("\n" + "="*60)
        print("📊 RESULTADO DO PRÉ-CARREGAMENTO")
        print("="*60)
        print(f"✅ Downloads bem-sucedidos: {success_count}")
        print(f"❌ Downloads falhados: {failed_count}")
        print(f"📊 Total no cache: {stats['downloaded']}/151")
        print(f"💾 Tamanho total: {stats['total_size_mb']:.2f} MB")
        
        coverage = (stats['downloaded'] / 151) * 100
        print(f"📈 Cobertura de emergência: {coverage:.1f}%")
        
        if coverage >= 90:
            print("🎯 ✅ Sistema altamente resiliente a falhas de API!")
        elif coverage >= 70:
            print("⚠️ Sistema parcialmente preparado")
        else:
            print("❌ Considere executar novamente em outro momento")
            
        # Salva relatório
        report = {
            'timestamp': str(datetime.now()),
            'total_pokemon': 151,
            'downloaded': stats['downloaded'],
            'failed': failed_count,
            'coverage_percent': coverage,
            'total_size_mb': stats['total_size_mb']
        }
        
        with open('preload_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        print("\n📋 Relatório salvo em: preload_report.json")
        
    finally:
        db.close()

def check_preload_status():
    """Verifica status atual do pré-carregamento"""
    
    db = SessionLocal()
    try:
        total = 151
        downloaded = db.query(PokemonImageCache).filter(
            PokemonImageCache.pokemon_id.between(1, 151),
            PokemonImageCache.image_type == 'official-artwork',
            PokemonImageCache.is_downloaded == True
        ).count()
        
        coverage = (downloaded / total) * 100
        
        print(f"📊 Status do pré-carregamento:")
        print(f"   • Pokémons 1-151: {downloaded}/{total}")
        print(f"   • Cobertura: {coverage:.1f}%")
        
        if os.path.exists('preload_report.json'):
            with open('preload_report.json', 'r') as f:
                report = json.load(f)
                print(f"   • Último carregamento: {report['timestamp']}")
        
        return coverage
        
    finally:
        db.close()

async def main():
    """Função principal"""
    
    if len(sys.argv) > 1 and sys.argv[1] == 'status':
        check_preload_status()
        return
    
    print("🎯 Pré-carregamento de imagens críticas")
    print("   Este script garante que todas as imagens dos Pokémons 1-151")
    print("   estejam disponíveis localmente, eliminando dependência da PokeAPI")
    
    # Verifica se backend está rodando
    try:
        response = requests.get("http://localhost:8000/api/v1/images/cache/stats", timeout=5)
        if response.status_code == 200:
            print("✅ Backend detectado e funcionando")
        else:
            print("❌ Backend não está respondendo corretamente")
            return
    except:
        print("❌ Backend não está rodando. Inicie com:")
        print("   uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
        return
    
    await preload_critical_pokemons()

if __name__ == "__main__":
    from datetime import datetime
    asyncio.run(main())