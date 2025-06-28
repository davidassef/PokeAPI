#!/usr/bin/env python3
"""
Script para debug do banco de dados e ranking.
"""
from sqlalchemy.orm import Session
from app.core.database import engine, get_db
from app.models.models import FavoritePokemon
from app.services.favorite_service import FavoriteService
from app.schemas.schemas import FavoritePokemonCreate

def debug_database():
    """Debug do banco de dados."""
    print("=== DEBUG DO BANCO DE DADOS ===")
    
    # Cria uma sessão
    db = Session(engine)
    
    try:
        # Verifica total de registros
        total = db.query(FavoritePokemon).count()
        print(f"Total de registros na tabela: {total}")
        
        # Lista todos os registros
        all_records = db.query(FavoritePokemon).all()
        print(f"Todos os registros:")
        for record in all_records:
            print(f"  - ID: {record.id}, User: {record.user_id}, Pokemon: {record.pokemon_id} ({record.pokemon_name})")
        
        # Verifica registros específicos
        test_records = db.query(FavoritePokemon).filter(
            FavoritePokemon.pokemon_id == 999
        ).all()
        print(f"Registros do Pokémon 999: {len(test_records)}")
        for record in test_records:
            print(f"  - {record}")
        
        # Testa o ranking
        print("\n=== TESTE DO RANKING ===")
        ranking = FavoriteService.get_ranking(db, 10)
        print(f"Ranking retornado: {ranking}")
        
    finally:
        db.close()

def test_add_favorite():
    """Testa adicionar um favorito."""
    print("\n=== TESTE DE ADICIONAR FAVORITO ===")
    
    db = Session(engine)
    
    try:
        # Cria um favorito de teste
        test_favorite = FavoritePokemonCreate(
            user_id=1,
            pokemon_id=999,
            pokemon_name="test-pokemon"
        )
        
        print(f"Adicionando favorito: {test_favorite}")
        result = FavoriteService.add_favorite(db, test_favorite)
        print(f"Resultado: {result}")
        
        # Verifica se foi adicionado
        count = db.query(FavoritePokemon).filter(
            FavoritePokemon.pokemon_id == 999
        ).count()
        print(f"Total de registros para Pokémon 999 após adição: {count}")
        
        # Testa o ranking novamente
        ranking = FavoriteService.get_ranking(db, 10)
        print(f"Ranking após adição: {ranking}")
        
    finally:
        db.close()

if __name__ == "__main__":
    debug_database()
    test_add_favorite() 