#!/usr/bin/env python3
"""
Script de teste para validar o sistema pull-based de sincronização.
"""
import requests
import json
import time
import sys
from datetime import datetime


class PullSyncTester:
    def __init__(self):
        self.backend_url = "http://localhost:8000"
        self.client_url = "http://localhost:3001"
        self.test_results = []

    def log_test(self, test_name, success, details=""):
        """Registra resultado de um teste."""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   {details}")

        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def test_backend_health(self):
        """Testa se o backend está respondendo."""
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=5)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            self.log_test("Backend Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("Backend Health Check", False, str(e))
            return False

    def test_client_health(self):
        """Testa se o cliente está respondendo."""
        try:
            response = requests.get(f"{self.client_url}/api/client/health", timeout=5)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            self.log_test("Client Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("Client Health Check", False, str(e))
            return False

    def test_scheduler_status(self):
        """Testa status do scheduler."""
        try:
            response = requests.get(f"{self.backend_url}/api/v1/pull-sync/scheduler/status", timeout=5)
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"Running: {data.get('running', False)}"
            else:
                details = f"Status: {response.status_code}"
            self.log_test("Scheduler Status", success, details)
            return success
        except Exception as e:
            self.log_test("Scheduler Status", False, str(e))
            return False

    def test_client_registration(self):
        """Testa registro do cliente."""
        try:
            # Verificar se cliente está registrado
            response = requests.get(f"{self.backend_url}/api/v1/pull-sync/registered-clients", timeout=5)
            if response.status_code == 200:
                clients = response.json()
                success = len(clients) > 0
                details = f"Clientes registrados: {len(clients)}"
            else:
                success = False
                details = f"Status: {response.status_code}"

            self.log_test("Client Registration", success, details)
            return success
        except Exception as e:
            self.log_test("Client Registration", False, str(e))
            return False

    def test_add_capture(self):
        """Testa adição de captura."""
        try:
            capture_data = {
                "pokemon_id": 25,
                "pokemon_name": "pikachu",
                "action": "capture",
                "removed": False
            }

            response = requests.post(
                f"{self.client_url}/api/client/add-capture",
                json=capture_data,
                timeout=5
            )

            success = response.status_code == 200
            details = f"Status: {response.status_code}"

            self.log_test("Add Capture", success, details)
            return success
        except Exception as e:
            self.log_test("Add Capture", False, str(e))
            return False

    def test_sync_data(self):
        """Testa obtenção de dados de sincronização."""
        try:
            response = requests.get(f"{self.client_url}/api/client/sync-data", timeout=5)
            success = response.status_code == 200

            if success:
                data = response.json()
                captures = data.get("captures", [])
                details = f"Capturas pendentes: {len(captures)}"
            else:
                details = f"Status: {response.status_code}"

            self.log_test("Sync Data", success, details)
            return success, data if success else None
        except Exception as e:
            self.log_test("Sync Data", False, str(e))
            return False, None

    def test_manual_sync(self):
        """Testa sincronização manual."""
        try:
            response = requests.post(
                f"{self.backend_url}/api/v1/pull-sync/sync-all",
                json={},
                timeout=10
            )

            success = response.status_code == 200

            if success:
                data = response.json()
                details = f"Processados: {data.get('clients_processed', 0)}, Capturas: {data.get('total_captures', 0)}"
            else:
                details = f"Status: {response.status_code}"

            self.log_test("Manual Sync", success, details)
            return success
        except Exception as e:
            self.log_test("Manual Sync", False, str(e))
            return False

    def test_ranking_update(self):
        """Testa se o ranking foi atualizado."""
        try:
            response = requests.get(f"{self.backend_url}/api/v1/ranking", timeout=5)
            success = response.status_code == 200

            if success:
                data = response.json()
                if isinstance(data, list):
                    rankings = data
                else:
                    rankings = data.get("rankings", [])
                details = f"Rankings encontrados: {len(rankings)}"
            else:
                details = f"Status: {response.status_code}"

            self.log_test("Ranking Update", success, details)
            return success
        except Exception as e:
            self.log_test("Ranking Update", False, str(e))
            return False

    def run_all_tests(self):
        """Executa todos os testes."""
        print("🧪 Iniciando testes do sistema pull-based...")
        print("=" * 50)

        # Testes básicos
        if not self.test_backend_health():
            print("❌ Backend não está respondendo. Encerrando testes.")
            return False

        if not self.test_client_health():
            print("❌ Cliente não está respondendo. Encerrando testes.")
            return False

        # Testes de funcionalidade
        self.test_scheduler_status()
        self.test_client_registration()

        # Testes de sincronização
        self.test_add_capture()
        time.sleep(1)  # Aguardar um pouco

        success, sync_data = self.test_sync_data()
        if success and sync_data:
            captures = sync_data.get("captures", [])
            if len(captures) > 0:
                print(f"   📊 Captura encontrada: {captures[0].get('pokemon_name', 'Unknown')}")

        # Teste de sincronização manual
        self.test_manual_sync()
        time.sleep(2)  # Aguardar processamento

        # Verificar se ranking foi atualizado
        self.test_ranking_update()

        # Resumo
        print("\n" + "=" * 50)
        passed = sum(1 for r in self.test_results if r["success"])
        total = len(self.test_results)

        print(f"📊 Resultados: {passed}/{total} testes passaram")

        if passed == total:
            print("🎉 Todos os testes passaram! Sistema pull-based funcionando.")
            return True
        else:
            print("⚠️  Alguns testes falharam. Verificar logs.")
            return False

    def save_results(self, filename="pull_sync_test_results.json"):
        """Salva resultados em arquivo."""
        try:
            with open(filename, 'w') as f:
                json.dump({
                    "test_run": datetime.now().isoformat(),
                    "results": self.test_results
                }, f, indent=2)
            print(f"📁 Resultados salvos em: {filename}")
        except Exception as e:
            print(f"❌ Erro ao salvar resultados: {e}")


def main():
    """Função principal."""
    tester = PullSyncTester()

    # Executar testes
    success = tester.run_all_tests()

    # Salvar resultados
    tester.save_results()

    # Sair com código apropriado
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
