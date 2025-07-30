#!/usr/bin/env python3
"""
Script de verificação do armazenamento local de imagens.
Verifica o status do cache e gera relatórios sobre as imagens armazenadas.
"""

import os
import sys
from pathlib import Path
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
import json
from datetime import datetime

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.services.image_cache_service import ImageCacheService
from app.services.image_optimization_service import ImageOptimizationService


class ImageStorageChecker:
    def __init__(self):
        self.db = SessionLocal()
        self.image_cache = ImageCacheService()
        self.optimization_service = ImageOptimizationService()
        
    def get_storage_stats(self) -> Dict:
        """Retorna estatísticas do armazenamento local"""
        stats = {
            "cache_stats": {},
            "optimization_stats": {},
            "disk_usage": {},
            "missing_images": []
        }
        
        # Estatísticas do cache
        cache_dir = Path("app/data/images")
        if cache_dir.exists():
            total_files = len(list(cache_dir.rglob("*.png"))) + len(list(cache_dir.rglob("*.jpg"))) + len(list(cache_dir.rglob("*.webp")))
            total_size = sum(f.stat().st_size for f in cache_dir.rglob("*") if f.is_file())
            
            stats["cache_stats"] = {
                "total_images": total_files,
                "total_size_bytes": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "cache_path": str(cache_dir.absolute())
            }
        
        # Estatísticas de otimização
        optimized_dir = Path("app/data/optimized")
        if optimized_dir.exists():
            total_optimized = len(list(optimized_dir.rglob("*.webp"))) + len(list(optimized_dir.rglob("*.jpg"))) + len(list(optimized_dir.rglob("*.png")))
            optimized_size = sum(f.stat().st_size for f in optimized_dir.rglob("*") if f.is_file())
            
            stats["optimization_stats"] = {
                "total_optimized": total_optimized,
                "total_size_bytes": optimized_size,
                "total_size_mb": round(optimized_size / (1024 * 1024), 2),
                "optimized_path": str(optimized_dir.absolute())
            }
        
        # Uso de disco
        root_dir = Path(".")
        total_disk = sum(f.stat().st_size for f in root_dir.rglob("*") if f.is_file() and f.suffix in ['.png', '.jpg', '.jpeg', '.webp'])
        stats["disk_usage"] = {
            "total_images_size_mb": round(total_disk / (1024 * 1024), 2)
        }
        
        return stats
    
    def check_missing_images(self, start_id: int = 1, end_id: int = 1010) -> List[Dict]:
        """Verifica quais imagens estão faltando no armazenamento local"""
        missing = []
        image_types = ["official-artwork", "dream-world", "home", "showdown"]
        
        # Diretórios de cache e otimização
        cache_dir = Path("app/data/images")
        optimized_dir = Path("app/data/optimized")
        
        for pokemon_id in range(start_id, end_id + 1):
            for image_type in image_types:
                # Verificar cache local
                cache_filename = f"{pokemon_id}_{image_type}.png"
                cache_path = cache_dir / cache_filename
                cache_exists = cache_path.exists()
                
                # Verificar imagem otimizada
                optimized_filename = f"{pokemon_id}_{image_type}_original_85.webp"
                optimized_path = optimized_dir / optimized_filename
                optimized_exists = optimized_path.exists()
                
                if not cache_exists and not optimized_exists:
                    missing.append({
                        "pokemon_id": pokemon_id,
                        "image_type": image_type,
                        "missing_in": ["cache", "optimized"]
                    })
        
        return missing
    
    def generate_report(self) -> str:
        """Gera um relatório completo do armazenamento"""
        stats = self.get_storage_stats()
        missing = self.check_missing_images()
        
        report = f"""
=== RELATÓRIO DE ARMAZENAMENTO LOCAL DE IMAGENS ===
Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

📊 ESTATÍSTICAS GERAIS:
- Total de imagens no cache: {stats['cache_stats'].get('total_images', 0)}
- Tamanho do cache: {stats['cache_stats'].get('total_size_mb', 0)} MB
- Total de imagens otimizadas: {stats['optimization_stats'].get('total_optimized', 0)}
- Tamanho das imagens otimizadas: {stats['optimization_stats'].get('total_size_mb', 0)} MB
- Uso total de disco: {stats['disk_usage'].get('total_images_size_mb', 0)} MB

❌ IMAGENS FALTANDO:
- Total de imagens ausentes: {len(missing)}
- Primeiras 10 ausências:
"""
        
        for i, item in enumerate(missing[:10]):
            report += f"  {i+1}. Pokémon #{item['pokemon_id']} - {item['image_type']}\n"
        
        if len(missing) > 10:
            report += f"  ... e mais {len(missing) - 10} imagens\n"
        
        if len(missing) == 0:
            report += "  ✅ Todas as imagens estão armazenadas localmente!\n"
        
        report += """
🚀 PRÓXIMOS PASSOS:
1. Execute o script mass_image_preloader.py para baixar imagens faltantes
2. Use a API /api/images/optimized/{id} para servir imagens otimizadas
3. Monitore o uso de disco regularmente

"""
        
        return report
    
    def save_report(self, filename: str = "image_storage_report.json"):
        """Salva o relatório em JSON"""
        data = {
            "timestamp": datetime.now().isoformat(),
            "stats": self.get_storage_stats(),
            "missing_images": self.check_missing_images()
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"Relatório salvo em: {filename}")


if __name__ == "__main__":
    checker = ImageStorageChecker()
    
    print("🔍 Verificando armazenamento local de imagens...")
    print(checker.generate_report())
    
    # Salvar relatório detalhado
    checker.save_report()
    
    print("\n✅ Verificação concluída!")