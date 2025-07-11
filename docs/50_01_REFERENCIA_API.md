# 📚 PokeAPIApp - Referência da API

🗓️ **Última atualização**: 11/07/2025
📋 **Status**: Documentação completa da API com sistema RBAC

---

## 🌐 URLs Base

- **Desenvolvimento**: `http://localhost:8000`
- **Produção**: `https://pokeapi-la6k.onrender.com`

---

## 🔐 Autenticação

Todos os endpoints protegidos requerem um token JWT no cabeçalho Authorization:

```http
Authorization: Bearer <seu-jwt-token>
```

### **Credenciais de Administrador**
- **Email**: admin@example.com
- **Senha**: admin

---

## 📋 Formato de Resposta

Todas as respostas da API seguem este formato padrão:

```json
{
  "success": true,
  "data": {},
  "message": "Operação realizada com sucesso",
  "error": null,
  "timestamp": "2025-07-11T20:00:00Z"
}
```

## ❌ Respostas de Erro

```json
{
  "success": false,
  "data": null,
  "message": null,
  "error": "Mensagem detalhada do erro",
  "code": "CODIGO_ERRO",
  "timestamp": "2025-07-11T20:00:00Z"
}
```

---

## 📋 Inventário Completo de Endpoints

### **📊 Resumo por Categoria**
- **🔓 Endpoints Públicos**: 5 endpoints (sem autenticação)
- **🎮 Endpoints de Usuário**: 4 endpoints (role: User)
- **👑 Endpoints Administrativos**: 6 endpoints (role: Administrator)
- **🔐 Endpoints de Autenticação**: 4 endpoints (públicos + protegidos)

### **🛡️ Status de Implementação RBAC**
- ✅ **100% dos endpoints** com controle de acesso implementado
- ✅ **Middleware de autorização** ativo em todos os endpoints protegidos
- ✅ **Auditoria completa** de operações administrativas
- ✅ **Validação de permissões** granular por funcionalidade

### **👑 Credenciais de Administrador**
- **Email**: admin@example.com
- **Senha**: admin

## 🔐 Endpoints de Autenticação

### POST /api/v1/auth/login

Autentica o usuário e retorna um token JWT.

**Corpo da Requisição:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "João Silva",
      "role": "user",
      "is_active": true
    }
  }
}
```

### POST /api/v1/auth/register

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "contact": "+1234567890",
  "security_question": "What is your pet's name?",
  "security_answer": "Fluffy"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "is_active": true
    }
  },
  "message": "User registered successfully"
}
```

### POST /api/v1/auth/password-reset/request

Request password reset using security question.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "security_question": "What is your pet's name?",
    "user_id": 1
  }
}
```

### POST /api/v1/auth/password-reset/verify

Verify security answer and reset password.

**Request Body:**
```json
{
  "user_id": 1,
  "security_answer": "Fluffy",
  "new_password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## Pokemon Endpoints

### GET /api/v1/pokemon/

Get paginated list of Pokemon.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 20, max: 100)
- `search` (string): Search by name
- `type` (string): Filter by type
- `generation` (int): Filter by generation

**Response:**
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
        "sprites": {
          "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png"
        }
      }
    ],
    "total": 1010,
    "page": 1,
    "total_pages": 51
  }
}
```

### GET /api/v1/pokemon/{pokemon_id}

Get detailed information about a specific Pokemon.

**Path Parameters:**
- `pokemon_id` (int): Pokemon ID

**Response:**
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
      {
        "base_stat": 45,
        "stat": {"name": "hp"}
      },
      {
        "base_stat": 49,
        "stat": {"name": "attack"}
      }
    ],
    "abilities": [
      {
        "ability": {"name": "overgrow"}
      }
    ],
    "sprites": {
      "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
      "front_shiny": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/1.png"
    }
  }
}
```

## Pokemon Management Endpoints (Admin Only)

### POST /api/v1/pokemon/

Create a new Pokemon (Admin only).

**Headers:**
```http
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**
```json
{
  "name": "custompokemon",
  "height": 10,
  "weight": 100,
  "base_experience": 50,
  "types": [
    {"type": {"name": "fire"}}
  ],
  "stats": [
    {"base_stat": 50, "stat": {"name": "hp"}},
    {"base_stat": 60, "stat": {"name": "attack"}},
    {"base_stat": 40, "stat": {"name": "defense"}},
    {"base_stat": 70, "stat": {"name": "special-attack"}},
    {"base_stat": 50, "stat": {"name": "special-defense"}},
    {"base_stat": 80, "stat": {"name": "speed"}}
  ],
  "abilities": [
    {"ability": {"name": "blaze"}}
  ],
  "sprites": {
    "front_default": "https://example.com/pokemon.png"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1011,
    "name": "custompokemon",
    "created_by": 1,
    "created_at": "2025-07-10T20:00:00Z"
  },
  "message": "Pokemon created successfully"
}
```

### PUT /api/v1/pokemon/{pokemon_id}

Update an existing Pokemon (Admin only).

**Headers:**
```http
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**
```json
{
  "name": "updatedpokemon",
  "height": 12,
  "weight": 110
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1011,
    "name": "updatedpokemon",
    "height": 12,
    "weight": 110,
    "updated_by": 1,
    "updated_at": "2025-07-10T20:00:00Z"
  },
  "message": "Pokemon updated successfully"
}
```

### DELETE /api/v1/pokemon/{pokemon_id}

Delete a Pokemon (Admin only).

**Headers:**
```http
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Pokemon deleted successfully",
  "deleted_pokemon": {
    "id": 1011,
    "name": "custompokemon"
  }
}
```

## User Favorites Endpoints

### GET /api/v1/favorites/

Get user's captured Pokemon.

**Headers:**
```http
Authorization: Bearer <user-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "favorites": [
      {
        "id": 1,
        "pokemon_id": 25,
        "pokemon_name": "pikachu",
        "captured_at": "2025-07-10T15:30:00Z",
        "is_active": true
      }
    ],
    "total": 1
  }
}
```

### POST /api/v1/favorites/

Capture a Pokemon.

**Headers:**
```http
Authorization: Bearer <user-jwt-token>
```

**Request Body:**
```json
{
  "pokemon_id": 25
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "pokemon_id": 25,
    "captured_at": "2025-07-10T20:00:00Z"
  },
  "message": "Pokemon captured successfully"
}
```

### DELETE /api/v1/favorites/{pokemon_id}

Release a captured Pokemon.

**Headers:**
```http
Authorization: Bearer <user-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Pokemon released successfully"
}
```

## Ranking Endpoints

### GET /api/v1/ranking/

Get Pokemon popularity ranking.

**Query Parameters:**
- `limit` (int): Number of results (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "pokemon_id": 25,
      "pokemon_name": "pikachu",
      "capture_count": 150,
      "rank": 1
    },
    {
      "pokemon_id": 1,
      "pokemon_name": "bulbasaur",
      "capture_count": 120,
      "rank": 2
    }
  ]
}
```

## Admin Endpoints

### GET /api/v1/admin/stats

Get system statistics (Admin only).

**Headers:**
```http
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 1500,
    "total_pokemon": 1010,
    "total_captures": 5000,
    "active_users_today": 50,
    "most_popular_pokemon": {
      "id": 25,
      "name": "pikachu",
      "captures": 150
    },
    "database_size": "15.2 MB",
    "uptime": "5 days, 12 hours"
  }
}
```

### GET /api/v1/admin/users

Get user list (Admin only).

**Headers:**
```http
Authorization: Bearer <admin-jwt-token>
```

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 20)
- `role` (string): Filter by role

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "user@example.com",
        "name": "John Doe",
        "role": "user",
        "is_active": true,
        "created_at": "2025-07-01T10:00:00Z",
        "last_login": "2025-07-10T19:30:00Z"
      }
    ],
    "total": 1500,
    "page": 1,
    "total_pages": 75
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_001` | Invalid credentials |
| `AUTH_002` | Token expired |
| `AUTH_003` | Token invalid |
| `AUTH_004` | Insufficient permissions |
| `USER_001` | User not found |
| `USER_002` | Email already exists |
| `USER_003` | Invalid security answer |
| `POKEMON_001` | Pokemon not found |
| `POKEMON_002` | Pokemon already captured |
| `POKEMON_003` | Invalid Pokemon data |
| `VALIDATION_001` | Required field missing |
| `VALIDATION_002` | Invalid data format |
| `RATE_LIMIT_001` | Too many requests |
| `SERVER_001` | Internal server error |

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **Pokemon endpoints**: 100 requests per minute
- **Admin endpoints**: 50 requests per minute
- **General endpoints**: 200 requests per minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1625097600
```

## Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (1-based)
- `limit`: Items per page (max varies by endpoint)

Pagination metadata is included in responses:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1010,
    "total_pages": 51,
    "has_next": true,
    "has_prev": false
  }
}
```

## WebSocket Events (Future)

Real-time features will be implemented using WebSocket connections:

### Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
```

### Events
- `pokemon_captured`: When any user captures a Pokemon
- `ranking_updated`: When ranking changes
- `new_pokemon_added`: When admin adds new Pokemon

## SDK Examples

### JavaScript/TypeScript
```typescript
import { PokeAPIClient } from '@pokeapi/client';

const client = new PokeAPIClient({
  baseURL: 'http://localhost:8000',
  token: 'your-jwt-token'
});

// Get Pokemon list
const pokemon = await client.pokemon.list({ page: 1, limit: 20 });

// Capture Pokemon
await client.favorites.capture(25);
```

### Python
```python
from pokeapi_client import PokeAPIClient

client = PokeAPIClient(
    base_url='http://localhost:8000',
    token='your-jwt-token'
)

# Get Pokemon list
pokemon = client.pokemon.list(page=1, limit=20)

# Capture Pokemon
client.favorites.capture(25)
```

This API reference provides comprehensive documentation for all available endpoints in the PokeAPIApp backend.
