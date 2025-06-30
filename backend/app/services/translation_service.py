import os
import json
from sqlalchemy.orm import Session
from app.models.models import PokemonFlavorTranslation

# Carregar traduções manuais para PT-BR
FLAVORS_PTBR_PATH = os.path.join(os.path.dirname(__file__), '../data/flavors_ptbr.json')
try:
    with open(FLAVORS_PTBR_PATH, encoding='utf-8') as f:
        FLAVORS_PTBR = json.load(f)
except Exception:
    FLAVORS_PTBR = {}

def get_manual_flavor_ptbr(pokemon_id: int) -> list[str]:
    return FLAVORS_PTBR.get(str(pokemon_id), [])

def get_or_translate_flavor(db: Session, pokemon_id: int, flavor_en: str, lang: str) -> str:
    # Busca no cache (mantém para compatibilidade, pode ser removido se não usar mais cache)
    cache = db.query(PokemonFlavorTranslation).filter_by(
        pokemon_id=pokemon_id, flavor_en=flavor_en, lang=lang
    ).first()
    if cache:
        return cache.flavor_translated
    # Se for pt-BR, tenta buscar tradução manual
    if lang == 'pt-BR':
        ptbr_flavors = get_manual_flavor_ptbr(pokemon_id)
        # Retorna a tradução correspondente ao flavor_en, se existir
        # (assume que a ordem dos arrays é igual)
        try:
            en_flavors = [flavor_en]
            if len(ptbr_flavors) > 0:
                # Se o flavor_en está entre os flavors exportados, retorna o correspondente
                with open(os.path.join(os.path.dirname(__file__), '../data/flavors_en.json'), encoding='utf-8') as f:
                    flavors_en_dict = json.load(f)
                en_list = flavors_en_dict.get(str(pokemon_id), [])
                if flavor_en in en_list:
                    idx = en_list.index(flavor_en)
                    if idx < len(ptbr_flavors):
                        return ptbr_flavors[idx]
        except Exception:
            pass
    # Se não houver tradução manual, retorna o texto original
    return flavor_en 