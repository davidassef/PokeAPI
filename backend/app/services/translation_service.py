import os
import json
from sqlalchemy.orm import Session
from app.models.models import PokemonFlavorTranslation

# Carregar traduções manuais para PT-BR
FLAVORS_PTBR_PATH = os.path.join(os.path.dirname(__file__), '../data/flavors_ptbr.json')
FLAVORS_EN_PATH = os.path.join(os.path.dirname(__file__), '../data/flavors_en.json')

try:
    with open(FLAVORS_PTBR_PATH, encoding='utf-8') as f:
        FLAVORS_PTBR = json.load(f)
except Exception:
    FLAVORS_PTBR = {}

try:
    with open(FLAVORS_EN_PATH, encoding='utf-8') as f:
        FLAVORS_EN = json.load(f)
except Exception:
    FLAVORS_EN = {}

def get_manual_flavor_ptbr(pokemon_id: int) -> list[str]:
    return FLAVORS_PTBR.get(str(pokemon_id), [])

def get_or_translate_flavor(db: Session, pokemon_id: int, flavor_en: str, lang: str) -> str:
    """Busca tradução de flavor text ou retorna o original se não encontrar."""
    # Busca no cache (mantém para compatibilidade, pode ser removido se não usar mais cache)
    cache = db.query(PokemonFlavorTranslation).filter_by(
        pokemon_id=pokemon_id, flavor_en=flavor_en, lang=lang
    ).first()
    if cache:
        return cache.flavor_translated

    # Se for pt-BR, tenta buscar tradução manual
    if lang == 'pt-BR':
        try:
            ptbr_flavors = FLAVORS_PTBR.get(str(pokemon_id), [])
            en_flavors = FLAVORS_EN.get(str(pokemon_id), [])

            if ptbr_flavors and en_flavors and flavor_en in en_flavors:
                idx = en_flavors.index(flavor_en)
                if idx < len(ptbr_flavors):
                    return ptbr_flavors[idx]
        except Exception as e:
            print(f"Erro na tradução: {e}")

    # Se não houver tradução manual, retorna o texto original
    return flavor_en