"""
Rotas para servir imagens dos Pokémons.

Este módulo implementa endpoints para servir imagens cacheadas dos Pokémons,
eliminando a dependência de APIs externas e melhorando a performance.
"""

import os
import mimetypes
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import logging

from app.core.database import get_db
from app.services.image_cache_service import ImageCacheService
from app.core.config import settings

logger = logging.getLogger(__name__)

# Inicializa o serviço de cache de imagens
image_cache_service = ImageCacheService()

router = APIRouter(prefix="/images", tags=["images"])


@router.get("/pokemon/{pokemon_id}")
async def get_pokemon_image(
    pokemon_id: int,
    image_type: str = "official-artwork",
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """
    Serve uma imagem de Pokémon do cache local.
    
    Se a imagem não estiver em cache, tenta baixá-la em background
    e retorna uma imagem placeholder temporariamente.
    
    Args:
        pokemon_id: ID do Pokémon (1-1010+)
        image_type: Tipo de imagem ('official-artwork', 'sprite', 'sprite-shiny', etc.)
        background_tasks: Para downloads em background
        db: Sessão do banco de dados
        
    Returns:
        FileResponse com a imagem ou placeholder
        
    Raises:
        HTTPException: Se o pokemon_id for inválido
    """
    try:
        # Validação básica
        if pokemon_id < 1 or pokemon_id > 1010:
            raise HTTPException(status_code=400, detail="ID do Pokémon inválido")
        
        # Tipos de imagem suportados
        supported_types = ['official-artwork', 'sprite', 'sprite-shiny', 'home', 'home-shiny']
        if image_type not in supported_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Tipo de imagem não suportado. Use: {', '.join(supported_types)}"
            )
        
        logger.debug(f"Solicitação de imagem: Pokémon {pokemon_id}, tipo {image_type}")
        
        # Tenta obter a imagem do cache
        image_path = await image_cache_service.get_pokemon_image(db, pokemon_id, image_type)
        
        if image_path and os.path.exists(image_path):
            # Imagem encontrada no cache
            logger.debug(f"Servindo imagem do cache: {image_path}")
            
            # Determina o tipo MIME
            mime_type, _ = mimetypes.guess_type(image_path)
            if not mime_type:
                mime_type = "image/png"
            
            # Headers para cache no browser
            headers = {
                "Cache-Control": "public, max-age=86400",  # 24 horas
                "ETag": f'"{pokemon_id}-{image_type}"'
            }
            
            return FileResponse(
                path=image_path,
                media_type=mime_type,
                headers=headers
            )
        else:
            # Imagem não encontrada - agenda download em background
            logger.info(f"Imagem não encontrada, agendando download: {pokemon_id}/{image_type}")
            background_tasks.add_task(
                _background_download_image, 
                db, pokemon_id, image_type
            )
            
            # Retorna placeholder temporário
            return await _get_placeholder_image(pokemon_id, image_type)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao servir imagem {pokemon_id}/{image_type}: {e}")
        return await _get_placeholder_image(pokemon_id, image_type)


@router.get("/pokemon/{pokemon_id}/info")
async def get_pokemon_image_info(
    pokemon_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtém informações sobre as imagens disponíveis de um Pokémon.
    
    Args:
        pokemon_id: ID do Pokémon
        db: Sessão do banco de dados
        
    Returns:
        Dicionário com informações das imagens disponíveis
    """
    try:
        from app.services.image_cache_service import PokemonImageCache
        
        # Busca todas as imagens do Pokémon no cache
        cache_entries = db.query(PokemonImageCache).filter(
            PokemonImageCache.pokemon_id == pokemon_id
        ).all()
        
        images_info = {}
        for entry in cache_entries:
            images_info[entry.image_type] = {
                "available": entry.is_downloaded and os.path.exists(entry.local_path),
                "file_size": entry.file_size if entry.is_downloaded else 0,
                "download_attempts": entry.download_attempts,
                "last_attempt": entry.last_attempt.isoformat() if entry.last_attempt else None,
                "created_at": entry.created_at.isoformat(),
                "url": f"/images/pokemon/{pokemon_id}?image_type={entry.image_type}"
            }
        
        return {
            "pokemon_id": pokemon_id,
            "images": images_info,
            "total_images": len(images_info)
        }
        
    except Exception as e:
        logger.error(f"Erro ao obter info das imagens do Pokémon {pokemon_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")


@router.post("/preload")
async def preload_pokemon_images(
    pokemon_ids: list[int],
    image_types: list[str] = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """
    Pré-carrega imagens de múltiplos Pokémons em background.
    
    Args:
        pokemon_ids: Lista de IDs dos Pokémons
        image_types: Tipos de imagem a baixar (padrão: ['official-artwork'])
        background_tasks: Para processamento em background
        db: Sessão do banco de dados
        
    Returns:
        Confirmação do agendamento do preload
    """
    try:
        # Validação
        if not pokemon_ids:
            raise HTTPException(status_code=400, detail="Lista de IDs não pode estar vazia")
        
        if len(pokemon_ids) > 100:
            raise HTTPException(status_code=400, detail="Máximo de 100 Pokémons por vez")
        
        # Filtra IDs válidos
        valid_ids = [pid for pid in pokemon_ids if 1 <= pid <= 1010]
        if not valid_ids:
            raise HTTPException(status_code=400, detail="Nenhum ID válido fornecido")
        
        if image_types is None:
            image_types = ['official-artwork']
        
        # Agenda preload em background
        background_tasks.add_task(
            _background_preload_images,
            db, valid_ids, image_types
        )
        
        logger.info(f"Preload agendado: {len(valid_ids)} Pokémons, tipos: {image_types}")
        
        return {
            "message": "Preload agendado com sucesso",
            "pokemon_count": len(valid_ids),
            "image_types": image_types,
            "estimated_images": len(valid_ids) * len(image_types)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao agendar preload: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")


@router.get("/cache/stats")
async def get_cache_stats(db: Session = Depends(get_db)):
    """
    Obtém estatísticas do cache de imagens.
    
    Args:
        db: Sessão do banco de dados
        
    Returns:
        Estatísticas detalhadas do cache
    """
    try:
        stats = image_cache_service.get_cache_stats(db)
        return {
            "cache_stats": stats,
            "service_info": {
                "max_download_attempts": image_cache_service.max_download_attempts,
                "retry_delay_hours": image_cache_service.retry_delay_hours,
                "timeout_seconds": image_cache_service.timeout_seconds,
                "supported_types": list(image_cache_service.image_urls.keys())
            }
        }
        
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas do cache: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")


# ===== FUNÇÕES AUXILIARES =====

async def _background_download_image(db: Session, pokemon_id: int, image_type: str):
    """
    Baixa uma imagem em background.
    
    Args:
        db: Sessão do banco de dados
        pokemon_id: ID do Pokémon
        image_type: Tipo de imagem
    """
    try:
        logger.info(f"Iniciando download em background: {pokemon_id}/{image_type}")
        result = await image_cache_service.get_pokemon_image(db, pokemon_id, image_type)
        
        if result:
            logger.info(f"Download em background concluído: {pokemon_id}/{image_type}")
        else:
            logger.warning(f"Falha no download em background: {pokemon_id}/{image_type}")
            
    except Exception as e:
        logger.error(f"Erro no download em background {pokemon_id}/{image_type}: {e}")


async def _background_preload_images(db: Session, pokemon_ids: list[int], image_types: list[str]):
    """
    Executa preload de imagens em background.
    
    Args:
        db: Sessão do banco de dados
        pokemon_ids: Lista de IDs dos Pokémons
        image_types: Tipos de imagem
    """
    try:
        logger.info(f"Iniciando preload em background: {len(pokemon_ids)} Pokémons")
        stats = await image_cache_service.preload_pokemon_images(db, pokemon_ids, image_types)
        logger.info(f"Preload em background concluído: {stats}")
        
    except Exception as e:
        logger.error(f"Erro no preload em background: {e}")


async def _get_placeholder_image(pokemon_id: int, image_type: str) -> FileResponse:
    """
    Retorna uma imagem placeholder.
    
    Args:
        pokemon_id: ID do Pokémon
        image_type: Tipo de imagem
        
    Returns:
        FileResponse com imagem placeholder
    """
    try:
        # Caminho para imagem placeholder
        placeholder_path = Path("app/static/pokemon-placeholder.png")
        
        if placeholder_path.exists():
            headers = {
                "Cache-Control": "public, max-age=3600",  # 1 hora
                "X-Placeholder": "true"
            }
            return FileResponse(
                path=str(placeholder_path),
                media_type="image/png",
                headers=headers
            )
        else:
            # Cria placeholder SVG simples se não existir arquivo
            svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
  <text x="100" y="90" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">
    Pokémon #{pokemon_id}
  </text>
  <text x="100" y="110" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">
    {image_type}
  </text>
  <text x="100" y="130" text-anchor="middle" font-family="Arial" font-size="10" fill="#999">
    Carregando...
  </text>
</svg>'''
            
            return Response(
                content=svg_content,
                media_type="image/svg+xml",
                headers={
                    "Cache-Control": "public, max-age=3600",
                    "X-Placeholder": "true"
                }
            )
            
    except Exception as e:
        logger.error(f"Erro ao gerar placeholder: {e}")
        # Fallback absoluto
        return Response(
            content="Image not available",
            media_type="text/plain",
            status_code=404
        )
