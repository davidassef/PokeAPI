import requests

# Fazer login
login_data = {'email': 'novo@teste.com', 'password': 'minhasenha123'}
login_response = requests.post('http://localhost:8001/api/v1/auth/login', json=login_data)

if login_response.status_code == 200:
    token = login_response.json()['access_token']
    print(f'✅ Token obtido: {token[:50]}...')

    # Testar acesso ao perfil
    headers = {'Authorization': f'Bearer {token}'}
    profile_response = requests.get('http://localhost:8001/api/v1/auth/me', headers=headers)

    print(f'📊 Status da requisição: {profile_response.status_code}')
    print(f'📋 Resposta: {profile_response.text}')

    if profile_response.status_code == 200:
        print('✅ Perfil acessado com sucesso!')
    else:
        print('❌ Erro ao acessar perfil')

else:
    print(f'❌ Erro no login: {login_response.text}')
