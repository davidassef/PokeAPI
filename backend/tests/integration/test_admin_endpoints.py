"""
Testes de integração para endpoints administrativos.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.models import User, FavoritePokemon, PokemonRanking


@pytest.mark.integration
class TestAdminEndpoints:
    """Testes para endpoints administrativos."""

    def test_database_status_endpoint(self, client: TestClient, db_session: Session):
        """Testa endpoint de status do banco de dados."""
        response = client.get("/api/v1/admin/database-status")

        assert response.status_code == 200
        data = response.json()

        assert "status" in data
        assert "tables" in data
        assert "total_records" in data
        assert "is_empty" in data

        assert data["status"] == "healthy"
        assert "users" in data["tables"]
        assert "favorites" in data["tables"]
        assert "rankings" in data["tables"]

    def test_database_status_with_data(self, client: TestClient, db_session: Session, sample_user):
        """Testa endpoint de status com dados no banco."""
        # Adicionar alguns dados
        favorite = FavoritePokemon(
            user_id=sample_user.id,
            pokemon_id=1,
            pokemon_name="bulbasaur"
        )
        ranking = PokemonRanking(
            pokemon_id=1,
            pokemon_name="bulbasaur",
            favorite_count=1
        )

        db_session.add(favorite)
        db_session.add(ranking)
        db_session.commit()

        response = client.get("/api/v1/admin/database-status")

        assert response.status_code == 200
        data = response.json()

        assert data["tables"]["users"] >= 1
        assert data["tables"]["favorites"] >= 1
        assert data["tables"]["rankings"] >= 1
        assert data["total_records"] >= 3
        assert data["is_empty"] is False

    def test_admin_endpoints_require_authentication(self, client: TestClient):
        """Testa que endpoints admin requerem autenticação (quando implementado)."""
        # TODO: Implementar quando autenticação for adicionada aos endpoints admin

        # Por enquanto, os endpoints estão abertos
        response = client.get("/api/v1/admin/database-status")
        assert response.status_code == 200

        # Quando autenticação for implementada:
        # response = client.get("/api/v1/admin/database-status")
        # assert response.status_code == 401

    def test_admin_endpoints_require_admin_role(self, client: TestClient):
        """Testa que endpoints admin requerem role de administrador (quando implementado)."""
        # TODO: Implementar quando RBAC for adicionado aos endpoints admin

        # Quando RBAC for implementado:
        # # Usuário comum
        # user_token = create_user_token(role="user")
        # headers = {"Authorization": f"Bearer {user_token}"}
        # response = client.get("/api/v1/admin/database-status", headers=headers)
        # assert response.status_code == 403

        # # Usuário admin
        # admin_token = create_admin_token(role="administrator")
        # headers = {"Authorization": f"Bearer {admin_token}"}
        # response = client.get("/api/v1/admin/database-status", headers=headers)
        # assert response.status_code == 200
        pass


@pytest.mark.integration
class TestAdminSecurity:
    """Testes de segurança para endpoints administrativos."""

    def test_dangerous_endpoints_removed(self, client: TestClient):
        """Testa que endpoints perigosos foram removidos."""
        # Endpoints que devem retornar 404 (removidos)
        dangerous_endpoints = [
            "/api/v1/admin/reset-database",
            "/api/v1/admin/clear-fictitious-data",
            "/api/v1/admin/all-favorites",
            "/api/v1/admin/all-favorites-raw"
        ]

        for endpoint in dangerous_endpoints:
            response = client.delete(endpoint) if "reset" in endpoint else client.get(endpoint)
            # Deve retornar 404 (não encontrado) ou 405 (método não permitido)
            assert response.status_code in [404, 405], f"Endpoint perigoso ainda ativo: {endpoint}"

    def test_debug_endpoints_removed(self, client: TestClient):
        """Testa que endpoints de debug foram removidos."""
        debug_endpoints = [
            "/api/v1/auth/debug/token",
            "/api/v1/ranking/debug/favorites",
            "/api/test-frontend",
            "/api/database-status"  # Duplicado, deve usar o do admin
        ]

        for endpoint in debug_endpoints:
            response = client.get(endpoint)
            assert response.status_code in [404, 405], f"Endpoint de debug ainda ativo: {endpoint}"

    def test_legacy_endpoints_removed(self, client: TestClient):
        """Testa que endpoints legacy foram removidos."""
        legacy_endpoints = [
            "/api/v1/users/",
            "/api/v1/users/1",
            "/api/v1/favorites/user/1",
            "/api/v1/favorites/check/1/1",
            "/api/v1/ranking/local"
        ]

        for endpoint in legacy_endpoints:
            for method in ["GET", "POST", "PUT", "DELETE"]:
                if method == "GET":
                    response = client.get(endpoint)
                elif method == "POST":
                    response = client.post(endpoint, json={})
                elif method == "PUT":
                    response = client.put(endpoint, json={})
                else:  # DELETE
                    response = client.delete(endpoint)

                assert response.status_code in [404, 405], f"Endpoint legacy ainda ativo: {method} {endpoint}"

    def test_mock_endpoints_removed(self, client: TestClient):
        """Testa que endpoints mock foram removidos."""
        mock_endpoints = [
            "/api/v1/auth/google",
            "/api/v1/auth/profile"  # Duplicado
        ]

        for endpoint in mock_endpoints:
            response = client.get(endpoint)
            assert response.status_code in [404, 405], f"Endpoint mock ainda ativo: {endpoint}"


@pytest.mark.integration
class TestAdminEndpointsFunctionality:
    """Testes de funcionalidade para endpoints administrativos."""

    def test_database_status_accuracy(self, client: TestClient, db_session: Session):
        """Testa precisão do endpoint de status do banco."""
        # Estado inicial
        response = client.get("/api/v1/admin/database-status")
        initial_data = response.json()

        # Adicionar dados conhecidos
        user = User(
            name="Test User",
            email="test@example.com",
            password_hash="hashed_password",
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        favorite = FavoritePokemon(
            user_id=user.id,
            pokemon_id=25,
            pokemon_name="pikachu"
        )
        db_session.add(favorite)

        ranking = PokemonRanking(
            pokemon_id=25,
            pokemon_name="pikachu",
            favorite_count=1
        )
        db_session.add(ranking)
        db_session.commit()

        # Verificar novo status
        response = client.get("/api/v1/admin/database-status")
        new_data = response.json()

        assert new_data["tables"]["users"] == initial_data["tables"]["users"] + 1
        assert new_data["tables"]["favorites"] == initial_data["tables"]["favorites"] + 1
        assert new_data["tables"]["rankings"] == initial_data["tables"]["rankings"] + 1
        assert new_data["total_records"] == initial_data["total_records"] + 3

    def test_database_status_error_handling(self, client: TestClient):
        """Testa tratamento de erros no endpoint de status."""
        # O endpoint deve ser robusto e não falhar mesmo com problemas no banco
        response = client.get("/api/v1/admin/database-status")

        # Deve sempre retornar uma resposta válida
        assert response.status_code in [200, 500]

        if response.status_code == 200:
            data = response.json()
            assert "status" in data
            assert "tables" in data
        else:
            # Se houver erro, deve retornar mensagem de erro apropriada
            data = response.json()
            assert "detail" in data


@pytest.mark.integration
class TestAdminEndpointsPerformance:
    """Testes de performance para endpoints administrativos."""

    def test_database_status_performance(self, client: TestClient, db_session: Session):
        """Testa performance do endpoint de status com muitos dados."""
        import time

        # Adicionar muitos dados para testar performance
        users = []
        for i in range(100):
            user = User(
                name=f"User {i}",
                email=f"user{i}@example.com",
                password_hash="hashed_password",
                is_active=True
            )
            users.append(user)

        db_session.add_all(users)
        db_session.commit()

        # Adicionar favoritos
        favorites = []
        for i, user in enumerate(users[:50]):  # Apenas metade dos usuários
            favorite = FavoritePokemon(
                user_id=user.id,
                pokemon_id=i + 1,
                pokemon_name=f"pokemon{i + 1}"
            )
            favorites.append(favorite)

        db_session.add_all(favorites)
        db_session.commit()

        # Testar performance
        start_time = time.time()
        response = client.get("/api/v1/admin/database-status")
        end_time = time.time()

        assert response.status_code == 200
        assert (end_time - start_time) < 2.0  # Deve responder em menos de 2 segundos

        data = response.json()
        assert data["tables"]["users"] >= 100
        assert data["tables"]["favorites"] >= 50

    def test_admin_endpoints_concurrent_access(self, client: TestClient):
        """Testa acesso concorrente aos endpoints administrativos."""
        import threading
        import time

        results = []

        def make_request():
            try:
                response = client.get("/api/v1/admin/database-status")
                results.append(response.status_code)
            except Exception as e:
                results.append(str(e))

        # Criar múltiplas threads para acesso concorrente
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)

        # Iniciar todas as threads
        start_time = time.time()
        for thread in threads:
            thread.start()

        # Aguardar conclusão
        for thread in threads:
            thread.join()
        end_time = time.time()

        # Verificar resultados
        assert len(results) == 10
        assert all(result == 200 for result in results)
        assert (end_time - start_time) < 5.0  # Todas as requisições em menos de 5 segundos


@pytest.mark.slow
class TestAdminEndpointsStress:
    """Testes de stress para endpoints administrativos."""

    def test_database_status_stress(self, client: TestClient):
        """Testa endpoint de status sob stress."""
        import time

        # Fazer muitas requisições rapidamente
        start_time = time.time()
        responses = []

        for _ in range(50):
            response = client.get("/api/v1/admin/database-status")
            responses.append(response.status_code)

        end_time = time.time()

        # Verificar que todas as requisições foram bem-sucedidas
        assert all(status == 200 for status in responses)
        assert len(responses) == 50

        # Verificar que o tempo total foi razoável
        total_time = end_time - start_time
        avg_time = total_time / 50
        assert avg_time < 0.5  # Média de menos de 500ms por requisição


@pytest.mark.integration
class TestFutureRBACEndpoints:
    """Testes preparatórios para futuros endpoints RBAC."""

    def test_pokemon_management_endpoints_not_implemented(self, client: TestClient):
        """Testa que endpoints de gerenciamento de Pokemon ainda não existem."""
        # Estes endpoints serão implementados na próxima fase
        rbac_endpoints = [
            ("POST", "/api/v1/pokemon"),
            ("PUT", "/api/v1/pokemon/1"),
            ("DELETE", "/api/v1/pokemon/1"),
            ("GET", "/api/v1/admin/users"),
            ("POST", "/api/v1/admin/users"),
            ("PUT", "/api/v1/admin/users/1"),
            ("DELETE", "/api/v1/admin/users/1")
        ]

        for method, endpoint in rbac_endpoints:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "POST":
                response = client.post(endpoint, json={})
            elif method == "PUT":
                response = client.put(endpoint, json={})
            else:  # DELETE
                response = client.delete(endpoint)

            # Deve retornar 404 (não implementado ainda)
            assert response.status_code == 404, f"Endpoint RBAC já implementado: {method} {endpoint}"

    def test_rbac_middleware_not_implemented(self, client: TestClient):
        """Testa que middleware RBAC ainda não está implementado."""
        # Endpoints que deveriam requerer autenticação admin
        admin_endpoints = [
            "/api/v1/admin/database-status"
        ]

        for endpoint in admin_endpoints:
            # Por enquanto, devem estar acessíveis sem autenticação
            response = client.get(endpoint)
            assert response.status_code == 200

            # TODO: Quando RBAC for implementado, estes testes devem ser atualizados:
            # response = client.get(endpoint)
            # assert response.status_code == 401  # Unauthorized

    def test_user_role_field_not_implemented(self, client: TestClient, db_session: Session):
        """Testa que campo de role do usuário ainda não está implementado."""
        # Criar usuário via endpoint de registro
        user_data = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "password123",
            "security_question": "Test question?",
            "security_answer": "Test answer"
        }

        response = client.post("/api/v1/auth/register", json=user_data)

        if response.status_code == 201:
            user_response = response.json()
            # Campo role ainda não deve existir
            assert "role" not in user_response

            # TODO: Quando role for implementado:
            # assert "role" in user_response
            # assert user_response["role"] == "user"  # Role padrão
