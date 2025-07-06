import requests
import json

# Testar endpoint de sincronização completa
def test_sync_complete_endpoint():
    url = "http://localhost:8000/api/v1/pull-sync/sync-complete-state"

    try:
        response = requests.post(url, json={}, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        if response.status_code == 200:
            print("✅ Endpoint funcionando corretamente!")
        else:
            print("❌ Endpoint retornou erro")

    except requests.exceptions.RequestException as e:
        print(f"❌ Erro na requisição: {e}")

if __name__ == "__main__":
    test_sync_complete_endpoint()
