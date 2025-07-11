# 📚 PokeAPIApp - Documentação dos Endpoints da API

🗓️ **Última atualização**: 11/07/2025
📋 **Status**: Documentação completa dos endpoints com sistema RBAC
🔗 **Referência**: Complementa [API_REFERENCE.md](API_REFERENCE.md)

---

## 🎯 Visão Geral

Esta documentação descreve todos os endpoints disponíveis na API do PokeAPIApp, incluindo endpoints públicos e administrativos. Todos os endpoints administrativos requerem autenticação e permissões específicas do sistema RBAC.

### 🌐 **URLs Base**
- **Desenvolvimento**: `http://localhost:8000/api`
- **Produção**: `https://pokeapi-la6k.onrender.com/api`

---

## 🔐 Autenticação

### **Headers Necessários para Endpoints Protegidos**

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **Obter Token de Autenticação**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin"
}
```

### **👑 Credenciais de Administrador**
- **Email**: admin@example.com
- **Senha**: admin

---

## 🛡️ Sistema de Controle de Acesso

### **Classificação de Endpoints por Segurança**

| Nível | Descrição | Autenticação | Role Requerido | Quantidade |
|-------|-----------|--------------|----------------|------------|
| 🔓 **Público** | Acesso livre | ❌ Não | Nenhum | 5 endpoints |
| 🎮 **Usuário** | Requer login | ✅ Sim | User | 4 endpoints |
| 👑 **Admin** | Acesso restrito | ✅ Sim | Administrator | 6 endpoints |

### **🔐 Middleware de Segurança**
- ✅ **Validação JWT**: Verificação automática de tokens
- ✅ **Verificação de Role**: Controle baseado em permissões
- ✅ **Auditoria**: Log de todas as operações administrativas
- ✅ **Rate Limiting**: Proteção contra abuso da API

**Resposta de Sucesso:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "name": "Administrator",
    "email": "admin@example.com",
    "role": "administrator"
  }
}
```

## Endpoints Públicos (Sem Autenticação)

### 1. Listar Pokemon

```http
GET /api/pokemon
GET /api/pokemon?page=1&limit=20
```

**Parâmetros de Query:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20, máximo: 100)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "pokemon": [
      {
        "id": 1,
        "name": "bulbasaur",
        "height": 7,
        "weight": 69,
        "base_experience": 64,
        "types": [
          {"type": {"name": "grass"}},
          {"type": {"name": "poison"}}
        ],
        "stats": [
          {"base_stat": 45, "stat": {"name": "hp"}},
          {"base_stat": 49, "stat": {"name": "attack"}}
        ],
        "abilities": [
          {"ability": {"name": "overgrow"}}
        ],
        "sprites": {
          "front_default": "https://example.com/bulbasaur.png"
        }
      }
    ],
    "total": 1010,
    "page": 1,
    "totalPages": 51
  }
}
```

### 2. Obter Pokemon por ID

```http
GET /api/pokemon/{id}
```

**Exemplo:**
```http
GET /api/pokemon/1
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "bulbasaur",
    "height": 7,
    "weight": 69,
    "base_experience": 64,
    "types": [
      {"type": {"name": "grass"}},
      {"type": {"name": "poison"}}
    ],
    "stats": [
      {"base_stat": 45, "stat": {"name": "hp"}},
      {"base_stat": 49, "stat": {"name": "attack"}},
      {"base_stat": 49, "stat": {"name": "defense"}},
      {"base_stat": 65, "stat": {"name": "special-attack"}},
      {"base_stat": 65, "stat": {"name": "special-defense"}},
      {"base_stat": 45, "stat": {"name": "speed"}}
    ],
    "abilities": [
      {"ability": {"name": "overgrow"}},
      {"ability": {"name": "chlorophyll"}}
    ],
    "sprites": {
      "front_default": "https://example.com/bulbasaur.png",
      "front_shiny": "https://example.com/bulbasaur-shiny.png",
      "other": {
        "official-artwork": {
          "front_default": "https://example.com/bulbasaur-artwork.png"
        }
      }
    }
  }
}
```

### 3. Buscar Pokemon

```http
GET /api/pokemon/search?q={query}
GET /api/pokemon/search?q=bulba&type=grass&generation=1
```

**Parâmetros de Query:**
- `q` (obrigatório): Termo de busca (nome do Pokemon)
- `type` (opcional): Filtrar por tipo
- `generation` (opcional): Filtrar por geração
- `limit` (opcional): Limite de resultados (padrão: 20)

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "bulbasaur",
      "types": [{"type": {"name": "grass"}}],
      "sprites": {"front_default": "https://example.com/bulbasaur.png"}
    }
  ]
}
```

## Endpoints Administrativos (Requer Autenticação + Role Admin)

### 4. Criar Novo Pokemon

```http
POST /api/pokemon
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "mewthree",
  "height": 20,
  "weight": 1220,
  "base_experience": 340,
  "types": [
    {"type": {"name": "psychic"}},
    {"type": {"name": "fighting"}}
  ],
  "stats": [
    {"base_stat": 106, "stat": {"name": "hp"}},
    {"base_stat": 150, "stat": {"name": "attack"}},
    {"base_stat": 70, "stat": {"name": "defense"}},
    {"base_stat": 194, "stat": {"name": "special-attack"}},
    {"base_stat": 120, "stat": {"name": "special-defense"}},
    {"base_stat": 140, "stat": {"name": "speed"}}
  ],
  "abilities": [
    {"ability": {"name": "pressure"}},
    {"ability": {"name": "unnerve"}}
  ],
  "sprites": {
    "front_default": "https://example.com/mewthree.png",
    "front_shiny": "https://example.com/mewthree-shiny.png",
    "other": {
      "official-artwork": {
        "front_default": "https://example.com/mewthree-artwork.png"
      }
    }
  }
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": {
    "id": 1011,
    "name": "mewthree",
    "height": 20,
    "weight": 1220,
    "base_experience": 340,
    "types": [
      {"type": {"name": "psychic"}},
      {"type": {"name": "fighting"}}
    ],
    "stats": [...],
    "abilities": [...],
    "sprites": {...},
    "created_at": "2025-07-10T17:30:00Z",
    "updated_at": "2025-07-10T17:30:00Z"
  },
  "message": "Pokemon criado com sucesso"
}
```

### 5. Atualizar Pokemon Existente

```http
PUT /api/pokemon/{id}
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Exemplo:**
```http
PUT /api/pokemon/1011
```

**Body:** (mesmo formato do POST, mas com campos opcionais)
```json
{
  "name": "mewthree-updated",
  "height": 25,
  "base_experience": 350
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": 1011,
    "name": "mewthree-updated",
    "height": 25,
    "weight": 1220,
    "base_experience": 350,
    "updated_at": "2025-07-10T17:35:00Z"
  },
  "message": "Pokemon atualizado com sucesso"
}
```

### 6. Excluir Pokemon

```http
DELETE /api/pokemon/{id}
Authorization: Bearer <admin_token>
```

**Exemplo:**
```http
DELETE /api/pokemon/1011
```

**Resposta:**
```json
{
  "success": true,
  "message": "Pokemon excluído com sucesso"
}
```

## Endpoints de Autenticação

### 7. Registro de Usuário

```http
POST /api/auth/register
Content-Type: application/json
```

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "security_question": "Qual o nome do seu primeiro pet?",
  "security_answer": "Rex"
}
```

**Resposta:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "2",
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "user"
  }
}
```

### 8. Recuperação de Senha

```http
POST /api/auth/forgot-password
Content-Type: application/json
```

**Body:**
```json
{
  "email": "joao@example.com"
}
```

**Resposta:**
```json
{
  "success": true,
  "question": "Qual o nome do seu primeiro pet?"
}
```

```http
POST /api/auth/reset-password
Content-Type: application/json
```

**Body:**
```json
{
  "email": "joao@example.com",
  "security_answer": "Rex",
  "new_password": "novaSenha123"
}
```

## Códigos de Status HTTP

### Sucesso
- `200 OK` - Operação bem-sucedida
- `201 Created` - Recurso criado com sucesso

### Erro do Cliente
- `400 Bad Request` - Dados inválidos fornecidos
- `401 Unauthorized` - Token de autenticação inválido ou ausente
- `403 Forbidden` - Permissões insuficientes (não é administrador)
- `404 Not Found` - Recurso não encontrado
- `409 Conflict` - Recurso já existe (ex: Pokemon com mesmo nome)
- `422 Unprocessable Entity` - Dados não atendem aos critérios de validação

### Erro do Servidor
- `500 Internal Server Error` - Erro interno do servidor

## Exemplos de Respostas de Erro

### Erro de Autenticação
```json
{
  "success": false,
  "error": "Token de autenticação inválido",
  "code": "INVALID_TOKEN"
}
```

### Erro de Permissão
```json
{
  "success": false,
  "error": "Acesso negado. Permissões de administrador necessárias.",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

### Erro de Validação
```json
{
  "success": false,
  "error": "Dados inválidos fornecidos",
  "details": {
    "name": ["Nome é obrigatório"],
    "height": ["Altura deve ser maior que 0"],
    "types": ["Pelo menos um tipo é obrigatório"]
  }
}
```

## Conta Padrão de Administrador

Para testar as funcionalidades administrativas, use a conta padrão:

```
Email: admin@example.com
Senha: admin
Role: administrator
```

## Limitações e Considerações de Segurança

1. **Rate Limiting**: Endpoints administrativos têm limite de 100 requisições por minuto por usuário
2. **Validação**: Todos os dados são validados no backend antes do processamento
3. **Logs**: Todas as operações administrativas são registradas para auditoria
4. **Backup**: Operações de exclusão criam backup automático dos dados
5. **Rollback**: Possibilidade de reverter operações administrativas em caso de erro

## Testando os Endpoints

### Usando cURL

```bash
# Login como admin
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin"}'

# Criar Pokemon (substitua <TOKEN> pelo token recebido)
curl -X POST http://localhost:8000/api/pokemon \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"testmon","height":10,"weight":100,"base_experience":50,"types":[{"type":{"name":"normal"}}],"stats":[{"base_stat":50,"stat":{"name":"hp"}}],"abilities":[{"ability":{"name":"run-away"}}],"sprites":{"front_default":"https://example.com/test.png"}}'
```

### Usando Postman

1. Importe a collection disponível em `/docs/postman_collection.json`
2. Configure a variável de ambiente `base_url` para `http://localhost:8000/api`
3. Execute o endpoint de login para obter o token
4. O token será automaticamente configurado para os demais endpoints
