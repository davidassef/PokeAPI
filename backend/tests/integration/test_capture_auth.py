import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
import jwt

client = TestClient(app)

# Função utilitária para gerar token JWT

def gerar_token(user_id: int, username: str = "testuser"):
    payload = {"sub": user_id, "username": username}
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token

@pytest.fixture
def user_token():
    return gerar_token(1, "usuario1")

@pytest.fixture
def user2_token():
    return gerar_token(2, "usuario2")

def test_captura_rejeitada_sem_auth():
    response = client.post("/api/v1/sync-capture/", json={
        "pokemonId": 25,
        "action": "capture",
        "timestamp": 1234567890,
        "payload": {"pokemonName": "pikachu", "removed": False}
    })
    assert response.status_code == 401

def test_captura_aceita_com_auth(user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    response = client.post("/api/v1/sync-capture/", json={
        "pokemonId": 25,
        "action": "capture",
        "timestamp": 1234567890,
        "payload": {"pokemonName": "pikachu", "removed": False}
    }, headers=headers)
    assert response.status_code == 200
    # Aqui pode-se adicionar verificação se a captura foi salva no storage do usuário

def test_captura_associada_usuario_correto(user_token, user2_token):
    headers1 = {"Authorization": f"Bearer {user_token}"}
    headers2 = {"Authorization": f"Bearer {user2_token}"}
    # Usuário 1 captura
    client.post("/api/v1/sync-capture/", json={
        "pokemonId": 1,
        "action": "capture",
        "timestamp": 1234567890,
        "payload": {"pokemonName": "bulbasaur", "removed": False}
    }, headers=headers1)
    # Usuário 2 captura
    client.post("/api/v1/sync-capture/", json={
        "pokemonId": 2,
        "action": "capture",
        "timestamp": 1234567890,
        "payload": {"pokemonName": "ivysaur", "removed": False}
    }, headers=headers2)
    # Buscar capturas de cada usuário (ajustar endpoint conforme implementação)
    resp1 = client.get("/api/v1/favorites/my-favorites", headers=headers1)
    resp2 = client.get("/api/v1/favorites/my-favorites", headers=headers2)
    assert resp1.status_code == 200
    assert resp2.status_code == 200
    nomes1 = [p["pokemon_name"] for p in resp1.json()]
    nomes2 = [p["pokemon_name"] for p in resp2.json()]
    assert "bulbasaur" in nomes1
    assert "ivysaur" not in nomes1
    assert "ivysaur" in nomes2
    assert "bulbasaur" not in nomes2

def test_ranking_atualizado(user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    # Captura um novo Pokémon
    client.post("/api/v1/sync-capture/", json={
        "pokemonId": 7,
        "action": "capture",
        "timestamp": 1234567890,
        "payload": {"pokemonName": "squirtle", "removed": False}
    }, headers=headers)
    # Verifica ranking
    resp = client.get("/api/v1/ranking/?min_captures=1&limit=10")
    assert resp.status_code == 200
    ranking = resp.json()
    nomes = [p["pokemon_name"] for p in ranking]
    assert "squirtle" in nomes 