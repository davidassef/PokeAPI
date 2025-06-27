from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    print('--- favorite_pokemons ---')
    result = conn.execute(text('SELECT * FROM favorite_pokemons'))
    for row in result:
        print(dict(row))
    print('--- pokemon_rankings ---')
    result = conn.execute(text('SELECT * FROM pokemon_rankings'))
    for row in result:
        print(dict(row))
