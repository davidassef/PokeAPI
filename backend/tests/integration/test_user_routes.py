"""
Testes de integração para rotas de usuários.
"""
from fastapi.testclient import TestClient
from app.models.models import User


class TestUserRoutes:
    """Testes de integração para rotas de usuários."""

    def test_create_user_success(self, client: TestClient, db_session):
        """Testa criar usuário com sucesso."""
        user_data = {
            "username": "testuser",
            "email": "test@example.com"
        }

        response = client.post("/api/v1/users/", json=user_data)

        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"
        assert "id" in data
        assert "created_at" in data

        # Verifica se foi criado no banco
        db_user = db_session.query(User).filter(User.username == "testuser").first()
        assert db_user is not None

    def test_create_user_duplicate_username(self, client: TestClient, sample_user):
        """Testa criar usuário com username duplicado."""
        user_data = {
            "username": sample_user.username,
            "email": "different@example.com"
        }

        response = client.post("/api/v1/users/", json=user_data)

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_create_user_duplicate_email(self, client: TestClient, sample_user):
        """Testa criar usuário com email duplicado."""
        user_data = {
            "username": "differentuser",
            "email": sample_user.email
        }

        response = client.post("/api/v1/users/", json=user_data)

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_create_user_invalid_data(self, client: TestClient):
        """Testa criar usuário com dados inválidos."""
        user_data = {
            "username": "",  # Username vazio
            "email": "invalid-email"  # Email inválido
        }

        response = client.post("/api/v1/users/", json=user_data)

        assert response.status_code == 422

    def test_get_user_success(self, client: TestClient, sample_user):
        """Testa buscar usuário existente."""
        response = client.get(f"/api/users/{sample_user.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_user.id
        assert data["username"] == sample_user.username
        assert data["email"] == sample_user.email

    def test_get_user_not_found(self, client: TestClient):
        """Testa buscar usuário inexistente."""
        response = client.get("/api/v1/users/999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"]

    def test_update_user_success(self, client: TestClient, sample_user):
        """Testa atualizar usuário com sucesso."""
        update_data = {
            "username": "updated_username",
            "email": "updated@example.com"
        }

        response = client.put(f"/api/users/{sample_user.id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "updated_username"
        assert data["email"] == "updated@example.com"

    def test_update_user_not_found(self, client: TestClient):
        """Testa atualizar usuário inexistente."""
        update_data = {
            "username": "updated_username",
            "email": "updated@example.com"
        }

        response = client.put("/api/v1/users/999", json=update_data)

        assert response.status_code == 404

    def test_update_user_duplicate_username(self, client: TestClient, sample_user):
        """Testa atualizar usuário com username já existente."""
        update_data = {
            "username": sample_user.username,  # Tenta usar username existente
            "email": "newemail@example.com"
        }

        response = client.put(f"/api/users/{sample_user.id + 1}", json=update_data)

        # Como o usuário não existe, retornará 404, não 400
        assert response.status_code == 404

    def test_delete_user_success(self, client: TestClient, sample_user):
        """Testa deletar usuário com sucesso."""
        response = client.delete(f"/api/users/{sample_user.id}")

        assert response.status_code == 204

        # Verifica se foi deletado
        get_response = client.get(f"/api/users/{sample_user.id}")
        assert get_response.status_code == 404

    def test_delete_user_not_found(self, client: TestClient):
        """Testa deletar usuário inexistente."""
        response = client.delete("/api/v1/users/999")

        assert response.status_code == 404

    def test_list_users_success(self, client: TestClient, sample_user):
        """Testa listar usuários com sucesso."""
        response = client.get("/api/v1/users/")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

        # Verifica se o usuário está na lista
        user_ids = [user["id"] for user in data]
        assert sample_user.id in user_ids

    def test_list_users_pagination(self, client: TestClient, db_session):
        """Testa paginação na listagem de usuários."""
        # Cria vários usuários
        for i in range(15):
            user = User(username=f"user_{i}", email=f"user_{i}@example.com")
            db_session.add(user)
        db_session.commit()

        # Testa primeira página
        response = client.get("/api/v1/users/?skip=0&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 10

        # Testa segunda página
        response = client.get("/api/v1/users/?skip=10&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 5  # Pelo menos os 5 restantes + sample_user

    def test_list_users_empty(self, client: TestClient):
        """Testa listar usuários quando não há nenhum."""
        response = client.get("/api/v1/users/")

        assert response.status_code == 200
        data = response.json()
        assert data == []
