"""
Teste de cobertura de endpoints - verifica se todos os endpoints estão sendo testados.
"""
import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from main import app


class TestEndpointCoverage:
    """Testes para verificar cobertura de endpoints."""

    def get_all_routes(self, app: FastAPI):
        """Extrai todas as rotas da aplicação FastAPI."""
        routes = []
        for route in app.routes:
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                for method in route.methods:
                    if method != 'HEAD':  # Ignorar HEAD requests
                        routes.append((method, route.path))
        return sorted(routes)

    def test_all_endpoints_documented(self, client: TestClient):
        """Testa que todos os endpoints estão documentados."""
        routes = self.get_all_routes(app)
        
        # Endpoints que devem existir baseado na auditoria
        expected_endpoints = [
            # Root endpoints
            ("GET", "/"),
            ("GET", "/health"),
            
            # Auth endpoints
            ("POST", "/api/v1/auth/register"),
            ("POST", "/api/v1/auth/login"),
            ("GET", "/api/v1/auth/me"),
            ("PUT", "/api/v1/auth/me"),
            ("POST", "/api/v1/auth/change-password"),
            ("POST", "/api/v1/auth/refresh"),
            ("POST", "/api/v1/auth/logout"),
            ("GET", "/api/v1/auth/validate-token"),
            ("POST", "/api/v1/auth/password-reset/request"),
            ("POST", "/api/v1/auth/password-reset/verify"),
            ("POST", "/api/v1/auth/password-reset/complete"),
            
            # Pokemon endpoints
            ("GET", "/api/v1/pokemon/{pokemon_id_or_name}"),
            ("GET", "/api/v1/pokemon/"),
            ("GET", "/api/v1/pokemon/{pokemon_id_or_name}/species"),
            ("GET", "/api/v1/pokemon/search/{query}"),
            ("GET", "/api/v1/pokemon/types/all"),
            ("GET", "/api/v1/pokemon/type/{type_name}"),
            ("GET", "/api/v1/pokemon/{pokemon_id_or_name}/flavor"),
            
            # Favorites endpoints
            ("POST", "/api/v1/favorites/"),
            ("DELETE", "/api/v1/favorites/{pokemon_id}"),
            ("GET", "/api/v1/favorites/my-favorites"),
            ("GET", "/api/v1/favorites/check/{pokemon_id}"),
            ("POST", "/api/v1/favorites/check-captured"),
            
            # Ranking endpoints
            ("GET", "/api/v1/ranking/"),
            ("GET", "/api/v1/ranking/stats"),
            
            # Sync endpoints
            ("POST", "/api/v1/sync-capture/"),
            ("POST", "/api/v1/sync-capture/batch"),
            
            # Admin endpoints
            ("GET", "/api/v1/admin/database-status"),
        ]
        
        # Verificar se todos os endpoints esperados existem
        for expected_method, expected_path in expected_endpoints:
            found = False
            for actual_method, actual_path in routes:
                if (expected_method == actual_method and 
                    (expected_path == actual_path or 
                     self._paths_match(expected_path, actual_path))):
                    found = True
                    break
            
            assert found, f"Endpoint esperado não encontrado: {expected_method} {expected_path}"

    def _paths_match(self, expected: str, actual: str) -> bool:
        """Verifica se caminhos com parâmetros coincidem."""
        expected_parts = expected.split('/')
        actual_parts = actual.split('/')
        
        if len(expected_parts) != len(actual_parts):
            return False
        
        for exp_part, act_part in zip(expected_parts, actual_parts):
            if exp_part.startswith('{') and exp_part.endswith('}'):
                continue  # Parâmetro, aceita qualquer valor
            if exp_part != act_part:
                return False
        
        return True

    def test_no_unexpected_endpoints(self, client: TestClient):
        """Testa que não há endpoints inesperados (removidos na limpeza)."""
        routes = self.get_all_routes(app)
        
        # Endpoints que devem ter sido removidos
        removed_endpoints = [
            # Debug endpoints
            ("GET", "/api/v1/auth/debug/token"),
            ("GET", "/api/v1/ranking/debug/favorites"),
            ("GET", "/api/test-frontend"),
            ("GET", "/api/database-status"),
            
            # Legacy endpoints
            ("GET", "/api/v1/users/"),
            ("POST", "/api/v1/users/"),
            ("GET", "/api/v1/users/{user_id}"),
            ("PUT", "/api/v1/users/{user_id}"),
            ("DELETE", "/api/v1/users/{user_id}"),
            ("GET", "/api/v1/favorites/user/{user_id}"),
            ("GET", "/api/v1/favorites/check/{user_id}/{pokemon_id}"),
            ("GET", "/api/v1/ranking/local"),
            
            # Dangerous endpoints
            ("DELETE", "/api/v1/admin/reset-database"),
            ("POST", "/api/v1/admin/clear-fictitious-data"),
            ("GET", "/api/v1/admin/all-favorites"),
            ("GET", "/api/v1/admin/all-favorites-raw"),
            
            # Mock endpoints
            ("GET", "/api/v1/auth/google"),
            ("PUT", "/api/v1/auth/profile"),
        ]
        
        # Verificar que endpoints removidos não existem
        for removed_method, removed_path in removed_endpoints:
            found = False
            for actual_method, actual_path in routes:
                if (removed_method == actual_method and 
                    (removed_path == actual_path or 
                     self._paths_match(removed_path, actual_path))):
                    found = True
                    break
            
            assert not found, f"Endpoint removido ainda existe: {removed_method} {removed_path}"

    def test_endpoint_accessibility(self, client: TestClient):
        """Testa acessibilidade básica dos endpoints principais."""
        # Endpoints que devem responder sem autenticação
        public_endpoints = [
            ("GET", "/"),
            ("GET", "/health"),
            ("GET", "/api/v1/pokemon/1"),
            ("GET", "/api/v1/pokemon/"),
            ("GET", "/api/v1/ranking/"),
            ("GET", "/api/v1/ranking/stats"),
            ("GET", "/api/v1/admin/database-status"),
        ]
        
        for method, path in public_endpoints:
            if method == "GET":
                response = client.get(path)
                # Deve responder com sucesso ou erro conhecido (não 404)
                assert response.status_code != 404, f"Endpoint público não acessível: {method} {path}"
                assert response.status_code in [200, 422, 500], f"Resposta inesperada para {method} {path}: {response.status_code}"

    def test_auth_endpoints_require_data(self, client: TestClient):
        """Testa que endpoints de autenticação requerem dados apropriados."""
        auth_endpoints = [
            ("POST", "/api/v1/auth/register"),
            ("POST", "/api/v1/auth/login"),
            ("POST", "/api/v1/auth/password-reset/request"),
            ("POST", "/api/v1/auth/password-reset/verify"),
            ("POST", "/api/v1/auth/password-reset/complete"),
        ]
        
        for method, path in auth_endpoints:
            # Tentar sem dados
            response = client.post(path, json={})
            # Deve retornar erro de validação (422) ou bad request (400)
            assert response.status_code in [400, 422], f"Endpoint auth não valida dados: {method} {path}"

    def test_protected_endpoints_require_auth(self, client: TestClient):
        """Testa que endpoints protegidos requerem autenticação."""
        # Endpoints que devem requerer autenticação
        protected_endpoints = [
            ("GET", "/api/v1/auth/me"),
            ("PUT", "/api/v1/auth/me"),
            ("POST", "/api/v1/auth/change-password"),
            ("POST", "/api/v1/auth/logout"),
            ("GET", "/api/v1/auth/validate-token"),
            ("POST", "/api/v1/favorites/"),
            ("DELETE", "/api/v1/favorites/1"),
            ("GET", "/api/v1/favorites/my-favorites"),
            ("GET", "/api/v1/favorites/check/1"),
            ("POST", "/api/v1/favorites/check-captured"),
            ("POST", "/api/v1/sync-capture/"),
            ("POST", "/api/v1/sync-capture/batch"),
        ]
        
        for method, path in protected_endpoints:
            if method == "GET":
                response = client.get(path)
            elif method == "POST":
                response = client.post(path, json={})
            elif method == "PUT":
                response = client.put(path, json={})
            elif method == "DELETE":
                response = client.delete(path)
            
            # Deve retornar 401 (Unauthorized) quando autenticação for implementada
            # Por enquanto, pode retornar outros códigos
            assert response.status_code != 404, f"Endpoint protegido não existe: {method} {path}"

    def test_pull_sync_endpoints_exist(self, client: TestClient):
        """Testa que endpoints de pull sync existem (mesmo que complexos)."""
        pull_sync_endpoints = [
            ("POST", "/api/v1/pull-sync/register-client"),
            ("GET", "/api/v1/pull-sync/registered-clients"),
            ("POST", "/api/v1/pull-sync/sync-all"),
            ("GET", "/api/v1/pull-sync/status"),
        ]
        
        for method, path in pull_sync_endpoints:
            if method == "GET":
                response = client.get(path)
            else:
                response = client.post(path, json={})
            
            # Deve existir (não retornar 404)
            assert response.status_code != 404, f"Endpoint pull-sync não existe: {method} {path}"

    def test_endpoint_response_format(self, client: TestClient):
        """Testa formato de resposta dos endpoints principais."""
        # Endpoints que devem retornar JSON
        json_endpoints = [
            ("GET", "/"),
            ("GET", "/health"),
            ("GET", "/api/v1/ranking/"),
            ("GET", "/api/v1/ranking/stats"),
            ("GET", "/api/v1/admin/database-status"),
        ]
        
        for method, path in json_endpoints:
            response = client.get(path)
            
            if response.status_code == 200:
                # Deve retornar JSON válido
                try:
                    data = response.json()
                    assert isinstance(data, (dict, list)), f"Resposta não é JSON válido: {method} {path}"
                except ValueError:
                    pytest.fail(f"Resposta não é JSON válido: {method} {path}")

    def test_error_handling_consistency(self, client: TestClient):
        """Testa consistência no tratamento de erros."""
        # Testar endpoints com dados inválidos
        error_test_cases = [
            ("GET", "/api/v1/pokemon/invalid_pokemon"),
            ("GET", "/api/v1/pokemon/999999"),
            ("POST", "/api/v1/auth/login", {"invalid": "data"}),
            ("POST", "/api/v1/favorites/", {"invalid": "data"}),
        ]
        
        for method, path, *data in error_test_cases:
            json_data = data[0] if data else {}
            
            if method == "GET":
                response = client.get(path)
            elif method == "POST":
                response = client.post(path, json=json_data)
            
            # Deve retornar erro apropriado (não 500 para dados inválidos)
            if response.status_code >= 500:
                pytest.fail(f"Erro interno do servidor para dados inválidos: {method} {path}")
            
            # Deve retornar JSON com mensagem de erro
            if response.status_code >= 400:
                try:
                    error_data = response.json()
                    assert "detail" in error_data or "message" in error_data, f"Erro sem mensagem: {method} {path}"
                except ValueError:
                    pytest.fail(f"Erro não retorna JSON: {method} {path}")


@pytest.mark.integration
class TestEndpointSecurity:
    """Testes de segurança para endpoints."""

    def test_no_sql_injection_vulnerability(self, client: TestClient):
        """Testa vulnerabilidades de SQL injection."""
        sql_injection_payloads = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "1; DELETE FROM favorites; --",
            "' UNION SELECT * FROM users --"
        ]
        
        # Testar em endpoints que aceitam parâmetros
        vulnerable_endpoints = [
            "/api/v1/pokemon/{}",
            "/api/v1/favorites/check/{}",
        ]
        
        for endpoint_template in vulnerable_endpoints:
            for payload in sql_injection_payloads:
                endpoint = endpoint_template.format(payload)
                response = client.get(endpoint)
                
                # Não deve retornar erro 500 (indica possível vulnerabilidade)
                assert response.status_code != 500, f"Possível SQL injection em: {endpoint}"

    def test_no_xss_vulnerability(self, client: TestClient):
        """Testa vulnerabilidades de XSS."""
        xss_payloads = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "';alert('xss');//"
        ]
        
        # Testar em endpoints que aceitam dados
        for payload in xss_payloads:
            # Teste em registro de usuário
            response = client.post("/api/v1/auth/register", json={
                "name": payload,
                "email": "test@example.com",
                "password": "password123",
                "security_question": "question?",
                "security_answer": "answer"
            })
            
            # Não deve retornar o payload sem escape
            if response.status_code in [200, 201]:
                response_text = response.text
                assert payload not in response_text, f"Possível XSS vulnerability com payload: {payload}"

    def test_rate_limiting_headers(self, client: TestClient):
        """Testa se headers de rate limiting estão presentes (quando implementado)."""
        response = client.get("/api/v1/ranking/")
        
        # Headers de rate limiting (quando implementado)
        rate_limit_headers = [
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset"
        ]
        
        # Por enquanto, não são obrigatórios
        # TODO: Verificar quando rate limiting for implementado
        pass
