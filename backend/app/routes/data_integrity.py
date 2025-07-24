"""
Rotas para monitoramento de integridade de dados.
Detecta problemas de persistência e perda de dados.
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.auth_middleware import get_current_active_user
from app.models.models import User, FavoritePokemon
from app.services.favorite_service import FavoriteService

router = APIRouter(tags=["data-integrity"])
logger = logging.getLogger(__name__)


@router.get("/health-check")
async def data_health_check(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    ✅ NOVO: Verifica a integridade dos dados do usuário atual.
    Detecta possíveis problemas de persistência.
    """
    try:
        user_id = current_user.id
        
        # Estatísticas básicas
        total_favorites = db.query(FavoritePokemon).filter(
            FavoritePokemon.user_id == user_id
        ).count()
        
        # Favoritos recentes (últimas 24h)
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_favorites = db.query(FavoritePokemon).filter(
            FavoritePokemon.user_id == user_id,
            FavoritePokemon.added_at >= yesterday
        ).count()
        
        # Favoritos por período
        last_week = datetime.utcnow() - timedelta(days=7)
        last_month = datetime.utcnow() - timedelta(days=30)
        
        week_favorites = db.query(FavoritePokemon).filter(
            FavoritePokemon.user_id == user_id,
            FavoritePokemon.added_at >= last_week
        ).count()
        
        month_favorites = db.query(FavoritePokemon).filter(
            FavoritePokemon.user_id == user_id,
            FavoritePokemon.added_at >= last_month
        ).count()
        
        # Verificar se há gaps suspeitos nos dados
        gaps_detected = []
        
        # Gap 1: Muitos favoritos antigos mas poucos recentes (possível perda)
        if total_favorites > 10 and recent_favorites == 0 and week_favorites < 2:
            gaps_detected.append({
                "type": "recent_data_gap",
                "description": "Muitos favoritos antigos mas poucos recentes - possível perda de dados",
                "severity": "warning"
            })
        
        # Gap 2: Nenhum favorito mas usuário ativo
        if total_favorites == 0 and current_user.last_login:
            last_login_days = (datetime.utcnow() - current_user.last_login).days
            if last_login_days < 7:
                gaps_detected.append({
                    "type": "no_data_active_user",
                    "description": "Usuário ativo sem favoritos - possível perda total de dados",
                    "severity": "critical"
                })
        
        # Status geral
        if gaps_detected:
            if any(gap["severity"] == "critical" for gap in gaps_detected):
                status_level = "critical"
            else:
                status_level = "warning"
        else:
            status_level = "healthy"
        
        return {
            "user_id": user_id,
            "user_email": current_user.email,
            "timestamp": datetime.utcnow().isoformat(),
            "status": status_level,
            "statistics": {
                "total_favorites": total_favorites,
                "recent_favorites_24h": recent_favorites,
                "favorites_last_week": week_favorites,
                "favorites_last_month": month_favorites
            },
            "gaps_detected": gaps_detected,
            "recommendations": generate_recommendations(status_level, gaps_detected, total_favorites)
        }
        
    except Exception as e:
        logger.error(f"❌ Erro no health check para usuário {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao verificar integridade dos dados: {str(e)}"
        )


@router.get("/system-overview")
async def system_data_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    ✅ NOVO: Visão geral do sistema de dados (apenas para admins).
    """
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores"
        )
    
    try:
        # Estatísticas gerais
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        total_favorites = db.query(FavoritePokemon).count()
        
        # Usuários com dados
        users_with_data = db.query(FavoritePokemon.user_id).distinct().count()
        
        # Favoritos por período
        yesterday = datetime.utcnow() - timedelta(days=1)
        last_week = datetime.utcnow() - timedelta(days=7)
        
        recent_favorites = db.query(FavoritePokemon).filter(
            FavoritePokemon.added_at >= yesterday
        ).count()
        
        week_favorites = db.query(FavoritePokemon).filter(
            FavoritePokemon.added_at >= last_week
        ).count()
        
        # Top pokémons mais capturados
        top_pokemon = db.query(
            FavoritePokemon.pokemon_name,
            func.count(FavoritePokemon.id).label('count')
        ).group_by(
            FavoritePokemon.pokemon_name
        ).order_by(
            func.count(FavoritePokemon.id).desc()
        ).limit(10).all()
        
        # Detectar problemas sistêmicos
        system_issues = []
        
        if users_with_data < active_users * 0.5:
            system_issues.append({
                "type": "low_data_coverage",
                "description": f"Apenas {users_with_data} de {active_users} usuários ativos têm dados",
                "severity": "warning"
            })
        
        if recent_favorites == 0 and active_users > 0:
            system_issues.append({
                "type": "no_recent_activity",
                "description": "Nenhuma atividade recente detectada",
                "severity": "critical"
            })
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "system_health": "critical" if any(issue["severity"] == "critical" for issue in system_issues) else "healthy",
            "statistics": {
                "total_users": total_users,
                "active_users": active_users,
                "users_with_data": users_with_data,
                "total_favorites": total_favorites,
                "recent_favorites_24h": recent_favorites,
                "favorites_last_week": week_favorites
            },
            "top_pokemon": [{"name": name, "captures": count} for name, count in top_pokemon],
            "system_issues": system_issues
        }
        
    except Exception as e:
        logger.error(f"❌ Erro no system overview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar visão geral do sistema: {str(e)}"
        )


def generate_recommendations(status: str, gaps: List[Dict], total_favorites: int) -> List[str]:
    """Gera recomendações baseadas no status dos dados."""
    recommendations = []
    
    if status == "critical":
        recommendations.append("🚨 AÇÃO URGENTE: Possível perda total de dados detectada")
        recommendations.append("📞 Entre em contato com o suporte imediatamente")
        recommendations.append("💾 Evite fazer logout até que o problema seja resolvido")
    
    elif status == "warning":
        recommendations.append("⚠️ Possível problema de sincronização detectado")
        recommendations.append("🔄 Tente fazer logout e login novamente")
        recommendations.append("📱 Verifique sua conexão com a internet")
    
    else:
        recommendations.append("✅ Seus dados estão seguros e sincronizados")
        if total_favorites > 0:
            recommendations.append(f"📊 Você tem {total_favorites} pokémons capturados")
    
    return recommendations


@router.post("/force-sync-check")
async def force_sync_check(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    ✅ NOVO: Força uma verificação de sincronização para o usuário atual.
    """
    try:
        user_id = current_user.id
        
        # Buscar dados atuais
        current_favorites = FavoriteService.get_user_favorites(db, user_id)
        
        logger.info(f"🔍 Verificação forçada para usuário {current_user.email}: {len(current_favorites)} favoritos encontrados")
        
        # Log detalhado dos dados encontrados
        for fav in current_favorites[:10]:  # Primeiros 10 para não sobrecarregar logs
            logger.info(f"📊 Favorito encontrado: {fav.pokemon_name} (ID: {fav.pokemon_id}) - Adicionado: {fav.added_at}")
        
        if len(current_favorites) > 10:
            logger.info(f"📊 ... e mais {len(current_favorites) - 10} favoritos")
        
        return {
            "user_id": user_id,
            "user_email": current_user.email,
            "timestamp": datetime.utcnow().isoformat(),
            "favorites_found": len(current_favorites),
            "status": "sync_check_completed",
            "message": f"Verificação concluída: {len(current_favorites)} favoritos confirmados no banco de dados"
        }
        
    except Exception as e:
        logger.error(f"❌ Erro na verificação forçada para usuário {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro na verificação de sincronização: {str(e)}"
        )
