"""
Teste simples e direto para verificar se o endpoint de registro está funcionando.
"""
import json
import urllib.request
import urllib.parse

def test_auth_endpoint():
    print("🔧 Testando endpoint de autenticação...")
    
    # Dados de teste
    user_data = {
        "email": "teste.simples@exemplo.com",
        "password": "senha123",
        "name": "Usuario Teste Simples",
        "contact": "(11) 99999-9999",
        "security_question": "Qual é sua cor favorita?",
        "security_answer": "azul"
    }
    
    # Converter para JSON
    data = json.dumps(user_data).encode('utf-8')
    
    # Criar requisição
    url = "http://localhost:8000/api/v1/auth/register"
    req = urllib.request.Request(url, data=data)
    req.add_header('Content-Type', 'application/json')
    
    try:
        print(f"📡 Fazendo requisição para: {url}")
        print(f"📦 Dados: {json.dumps(user_data, indent=2)}")
        
        with urllib.request.urlopen(req, timeout=10) as response:
            status_code = response.getcode()
            response_data = response.read().decode('utf-8')
            
            print(f"✅ Status: {status_code}")
            print(f"📄 Resposta: {response_data}")
            
            if status_code == 201:
                print("🎉 Registro realizado com sucesso!")
                return True
            else:
                print(f"⚠️ Status inesperado: {status_code}")
                return False
                
    except urllib.error.HTTPError as e:
        print(f"❌ Erro HTTP {e.code}: {e.reason}")
        try:
            error_data = e.read().decode('utf-8')
            print(f"📄 Detalhes do erro: {error_data}")
        except:
            pass
        return False
        
    except Exception as e:
        print(f"❌ Erro na requisição: {e}")
        return False

if __name__ == "__main__":
    success = test_auth_endpoint()
    if success:
        print("\n🎯 Teste concluído com sucesso!")
    else:
        print("\n💥 Teste falhou!")
