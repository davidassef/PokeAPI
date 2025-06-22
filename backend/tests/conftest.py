"""
Fixtures e configurações compartilhadas para testes.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.core.database import get_db, Base
from app.models.models import User, FavoritePokemon, PokemonRanking
from main import app


# Banco de dados de teste em memória
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_pokemon.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Fixture para sessão de banco de dados de teste."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Fixture para cliente de teste FastAPI."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_user(db_session):
    """Fixture para usuário de teste."""
    user = User(
        username="testuser",
        email="test@example.com",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sample_users(db_session):
    """Fixture para múltiplos usuários de teste."""
    users = []
    for i in range(3):
        user = User(
            username=f"testuser{i}",
            email=f"test{i}@example.com",
            is_active=True
        )
        db_session.add(user)
        users.append(user)

    db_session.commit()
    for user in users:
        db_session.refresh(user)
    return users


@pytest.fixture
def sample_favorite(db_session, sample_user):
    """Fixture para favorito de teste."""
    favorite = FavoritePokemon(
        user_id=sample_user.id,
        pokemon_id=1,
        pokemon_name="bulbasaur"
    )
    db_session.add(favorite)
    db_session.commit()
    db_session.refresh(favorite)
    return favorite


@pytest.fixture
def sample_ranking(db_session):
    """Fixture para ranking de teste."""
    ranking = PokemonRanking(
        pokemon_id=1,
        pokemon_name="bulbasaur",
        favorite_count=5
    )
    db_session.add(ranking)
    db_session.commit()
    db_session.refresh(ranking)
    return ranking


@pytest.fixture
def mock_pokeapi_response():
    """Fixture para resposta mock da PokeAPI."""
    return {
        "id": 1,
        "name": "bulbasaur",
        "height": 7,
        "weight": 69,
        "types": [
            {
                "slot": 1,
                "type": {
                    "name": "grass",
                    "url": "https://pokeapi.co/api/v2/type/12/"
                }
            },
            {
                "slot": 2,
                "type": {
                    "name": "poison",
                    "url": "https://pokeapi.co/api/v2/type/4/"
                }
            }
        ],
        "sprites": {
            "front_default": "https://pokeapi.co/media/sprites/pokemon/1.png"
        },
        "stats": [
            {
                "base_stat": 45,
                "stat": {"name": "hp"}
            }
        ]
    }


@pytest.fixture
def mock_pokemon_list_response():
    """Fixture para resposta mock da lista de Pokémons."""
    return {
        "count": 1302,
        "next": "https://pokeapi.co/api/v2/pokemon/?offset=20&limit=20",
        "previous": None,
        "results": [
            {
                "name": "bulbasaur",
                "url": "https://pokeapi.co/api/v2/pokemon/1/"
            }, {
                "name": "ivysaur",
                "url": "https://pokeapi.co/api/v2/pokemon/2/"
            }
        ]
    }
