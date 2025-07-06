# 🔐 Sistema de Autenticação Simplificado - PokeAPIApp

## 📋 Resumo das Mudanças

O sistema de autenticação foi modernizado para ser mais simples e intuitivo, removendo a necessidade de username e utilizando apenas **email + nome**.

## 🆕 Nova Estrutura de Usuário

### Campos do Usuário:
- ✅ **Email** (obrigatório, único) - usado para login
- ✅ **Nome** (obrigatório) - nome completo do usuário
- ✅ **Contato** (opcional) - telefone, WhatsApp, etc.
- ✅ **Senha** (obrigatória, mínimo 6 caracteres)

### Campos Removidos:
- ❌ **Username** - não é mais necessário
- ❌ **Full Name** - substituído por "name"

## 🎯 Endpoints de Autenticação

### 📝 Registro de Usuário
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "minhasenha123",
  "name": "João Silva",
  "contact": "(11) 99999-9999"  // opcional
}
```

**Resposta (201):**
```json
{
  "id": 1,
  "email": "usuario@exemplo.com",
  "name": "João Silva",
  "contact": "(11) 99999-9999",
  "is_active": true,
  "created_at": "2025-07-05T15:30:00Z",
  "updated_at": "2025-07-05T15:30:00Z"
}
```

### 🔑 Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "minhasenha123"
}
```

**Resposta (200):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 1,
    "email": "usuario@exemplo.com",
    "name": "João Silva",
    "contact": "(11) 99999-9999",
    "is_active": true,
    "created_at": "2025-07-05T15:30:00Z",
    "updated_at": "2025-07-05T15:30:00Z"
  }
}
```

### 👤 Perfil do Usuário
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

### ✏️ Atualizar Perfil
```http
PUT /api/v1/auth/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "João Silva Santos",
  "contact": "(11) 98888-8888"
}
```

### 🔒 Alterar Senha
```http
PUT /api/v1/auth/me/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "senhaatual123",
  "new_password": "novasenha456"
}
```

## 🛠️ Mudanças Técnicas

### 📦 Modelos (Database)
```python
class User(Base):
    id = Column(Integer, primary_key=True)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    contact = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
```

### 🎨 Schemas (Validação)
```python
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    contact: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    contact: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

### 🔐 JWT Token
O token JWT agora contém:
```json
{
  "sub": 1,           // user_id
  "email": "user@example.com",
  "exp": 1234567890,  // expiration
  "type": "access"
}
```

## 🎉 Benefícios da Mudança

1. **✨ Mais Simples**: Não precisa pensar em username único
2. **📧 Moderno**: Login com email é padrão atual
3. **🎯 Focado**: Apenas campos essenciais
4. **🔧 Flexível**: Contato opcional para diferentes tipos
5. **🛡️ Seguro**: Mantém toda segurança JWT

## 🚀 Como Usar

### Frontend/Mobile:
```typescript
// Login
const loginData = {
  email: "usuario@exemplo.com",
  password: "senha123"
};

// Registro
const registerData = {
  email: "novo@exemplo.com",
  password: "senha123",
  name: "Nome Completo",
  contact: "(11) 99999-9999" // opcional
};
```

### cURL:
```bash
# Registro
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"123456","name":"Test User"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"123456"}'
```

## 📊 Estado do Sistema

- ✅ Servidores Backend (FastAPI) e Client-Server (Node.js) funcionando
- ✅ Sistema de ranking pull-based operacional
- ✅ Nova estrutura de autenticação implementada
- ✅ Banco de dados migrado
- ✅ Documentação atualizada

---

**🎯 Próximos Passos:**
1. Testar integração completa frontend/backend
2. Validar fluxo de autenticação no mobile
3. Implementar reset de senha por email (futuro)
4. Adicionar roles/permissões (futuro)
