# 🚀 Deploy do Client-Server no Render

## 📋 Pré-requisitos
- ✅ Código commitado no repositório (já feito)
- ✅ Conta no Render (render.com)
- ✅ Repositório conectado ao GitHub

## 🔧 Passos para Deploy

### 1. Acessar o Render
1. Vá para https://render.com
2. Faça login na sua conta
3. Clique em **"New +"** no canto superior direito
4. Selecione **"Web Service"**

### 2. Conectar Repositório
1. Se ainda não conectou, clique em **"Connect account"** para GitHub
2. Selecione seu repositório: **`davidassef/PokeAPI`**
3. Clique em **"Connect"**

### 3. Configurar o Serviço

#### Configurações Básicas:
- **Name**: `pokemonapp-client-server`
- **Root Directory**: `client-server`
- **Environment**: `Node`
- **Region**: `Oregon (US West)` (mais próximo do backend)
- **Branch**: `main`

#### Configurações de Build:
- **Build Command**: `npm install`
- **Start Command**: `npm start`

#### Configurações de Deployment:
- **Auto-Deploy**: `Yes` (✅ marcado)

### 4. Variáveis de Ambiente
Adicione as seguintes variáveis de ambiente:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `BACKEND_URL` | `https://pokeapi-la6k.onrender.com` |

### 5. Configurações Avançadas (Opcional)
- **Health Check Path**: `/api/client/health`
- **Instance Type**: `Free` (para teste)

### 6. Criar o Serviço
1. Revise todas as configurações
2. Clique em **"Create Web Service"**
3. Aguarde o deploy (pode levar alguns minutos)

## 🔍 Verificação do Deploy

### URLs Esperadas:
- **Client-Server**: https://pokemonapp-client-server.onrender.com
- **Backend**: https://pokeapi-la6k.onrender.com
- **Frontend**: https://pokemonapp-frontend.onrender.com

### Testes de Saúde:
```bash
# Testar health check
curl https://pokemonapp-client-server.onrender.com/api/client/health

# Testar sync data
curl https://pokemonapp-client-server.onrender.com/api/client/sync-data

# Testar registro com backend
curl https://pokeapi-la6k.onrender.com/api/admin/clients
```

### Resposta Esperada do Health Check:
```json
{
  "status": "healthy",
  "client_id": "user_1",
  "client_url": "https://pokemonapp-client-server.onrender.com",
  "timestamp": "2024-07-06T21:30:00.000Z",
  "version": "1.0.0"
}
```

## 🐛 Troubleshooting

### Problemas Comuns:

1. **Build falha com erro de Node.js**:
   - Verifique se o `package.json` está correto
   - Certifique-se de que a versão do Node é >= 18.0.0

2. **Serviço não inicia**:
   - Verifique os logs no dashboard do Render
   - Confirme que o `start command` está correto

3. **Erro de CORS**:
   - Verifique as configurações de CORS no `client-server.js`
   - Confirme que o backend está rodando corretamente

4. **Problema de conexão com backend**:
   - Verifique a variável `BACKEND_URL`
   - Teste a conectividade entre os serviços

## 🔄 Próximos Passos Após Deploy

1. **Testar Integração Completa**:
   - Frontend → Client-Server → Backend
   - Verificar sincronização de dados
   - Testar endpoints de ranking

2. **Atualizar Configurações do Frontend**:
   - Confirmar que `environment.prod.ts` aponta para o client-server correto
   - Testar a aplicação completa

3. **Monitoramento**:
   - Configurar alertas no Render
   - Monitorar logs de ambos os serviços

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no dashboard do Render
2. Teste os endpoints individualmente
3. Confirme as variáveis de ambiente
4. Verifique a conectividade entre serviços

---

**Status**: ✅ Pronto para deploy
**Última atualização**: 2024-07-06
