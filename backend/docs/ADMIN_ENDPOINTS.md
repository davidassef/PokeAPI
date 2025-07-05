# 🛠️ Endpoints Administrativos

Este documento descreve os endpoints administrativos do backend PokeAPI App.

## 📋 Visão Geral

Os endpoints administrativos são projetados para gerenciar o estado do banco de dados durante desenvolvimento e testes. Eles permitem:

- Verificar o status atual do banco
- Limpar dados fictícios/mock
- Fazer reset completo do banco
- Garantir que o banco seja alimentado apenas pelo frontend

## 🔍 Endpoints Disponíveis

### 1. Status do Banco de Dados

```http
GET /api/v1/admin/database-status
```

#### Resposta
```json
{
  "status": "healthy",
  "tables": {
    "users": 0,
    "favorites": 0,
    "rankings": 0
  },
  "total_records": 0,
  "is_empty": true
}
```

#### Campos
- `status`: Estado geral do banco (healthy/error)
- `tables`: Contagem de registros por tabela
- `total_records`: Total de registros no banco
- `is_empty`: Indica se o banco está vazio

---

### 2. Limpar Dados Fictícios

```http
POST /api/v1/admin/clear-fictitious-data
```

#### Funcionalidade
Remove dados de teste/mock criados durante desenvolvimento:

**Usuários Fictícios:**
- Username: admin, test, demo
- Email: admin@pokemon.com, admin@pokeapi.com, test@test.com

**Rankings Pré-populados:**
- Pokémons com dados em sequência (pikachu, charizard, mewtwo, etc.)
- Dados criados pelo script `debug_database.py`

**Favoritos Associados:**
- Favoritos vinculados aos usuários fictícios

#### Resposta
```json
{
  "message": "Dados fictícios removidos com sucesso! Removidos: 1 usuários, 0 favoritos, 10 rankings"
}
```

---

### 3. Reset Completo do Banco

```http
DELETE /api/v1/admin/reset-database
```

#### ⚠️ ATENÇÃO
**Este endpoint é DESTRUTIVO e IRREVERSÍVEL!**

#### Funcionalidade
Remove TODOS os dados do banco:
- Limpa tabela `users`
- Limpa tabela `favorite_pokemons`
- Limpa tabela `pokemon_rankings`

#### Resposta
```json
{
  "message": "Banco de dados limpo com sucesso! Removidos: 1 usuários, 5 favoritos, 10 rankings"
}
```

#### Casos de Uso
- Testes de integração
- Desenvolvimento local
- Preparação para demo
- Verificação de fluxo frontend-backend

---

## 🔄 Fluxo de Trabalho Recomendado

### 1. Desenvolvimento e Testes

```bash
# 1. Verificar estado atual
curl -X GET "http://localhost:8000/api/v1/admin/database-status"

# 2. Limpar dados fictícios (se necessário)
curl -X POST "http://localhost:8000/api/v1/admin/clear-fictitious-data"

# 3. Reset completo (se necessário)
curl -X DELETE "http://localhost:8000/api/v1/admin/reset-database"

# 4. Verificar banco vazio
curl -X GET "http://localhost:8000/api/v1/admin/database-status"
```

### 2. Teste de Integração Frontend-Backend

```bash
# 1. Reset para estado limpo
curl -X DELETE "http://localhost:8000/api/v1/admin/reset-database"

# 2. Testar sincronização via frontend
# (usando app Ionic/Angular)

# 3. Verificar dados criados
curl -X GET "http://localhost:8000/api/v1/ranking/"
curl -X GET "http://localhost:8000/api/v1/admin/database-status"
```

### 3. Preparação para Demo

```bash
# 1. Limpar apenas dados fictícios
curl -X POST "http://localhost:8000/api/v1/admin/clear-fictitious-data"

# 2. Manter dados reais do frontend
curl -X GET "http://localhost:8000/api/v1/admin/database-status"
```

---

## 🛡️ Segurança

### Considerações Importantes

1. **Não usar em produção**: Estes endpoints são para desenvolvimento/testes
2. **Sem autenticação**: Atualmente não há proteção por autenticação
3. **Dados irreversíveis**: Reset completo não pode ser desfeito
4. **Logs completos**: Todas as operações são registradas nos logs

### Recomendações

- Usar apenas em ambiente de desenvolvimento
- Implementar autenticação antes de usar em produção
- Sempre verificar status antes de fazer reset
- Manter backups antes de operações destrutivas

---

## 📚 Exemplos de Uso

### Verificação Rápida

```bash
# Verificar se há dados fictícios
curl -X GET "http://localhost:8000/api/v1/admin/database-status" | jq .

# Resultado esperado para banco limpo:
# {
#   "status": "healthy",
#   "tables": {
#     "users": 0,
#     "favorites": 0,
#     "rankings": 0
#   },
#   "total_records": 0,
#   "is_empty": true
# }
```

### Limpeza Seletiva

```bash
# Limpar apenas dados fictícios, mantendo dados reais
curl -X POST "http://localhost:8000/api/v1/admin/clear-fictitious-data" | jq .

# Verificar resultado
curl -X GET "http://localhost:8000/api/v1/admin/database-status" | jq .
```

### Reset Completo

```bash
# CUIDADO: Remove TODOS os dados!
curl -X DELETE "http://localhost:8000/api/v1/admin/reset-database" | jq .

# Verificar banco vazio
curl -X GET "http://localhost:8000/api/v1/admin/database-status" | jq .
```

---

## 🔧 Integração com Frontend

Após usar os endpoints administrativos, o banco deve ser alimentado EXCLUSIVAMENTE pelo frontend através de:

1. **Sincronização**: `/api/v1/sync-capture/`
2. **Ações do usuário**: Favoritar/desfavoritar Pokémons
3. **Ranking automático**: Atualizado baseado nos favoritos

### Exemplo de Sincronização

```bash
# Simular ação do frontend
curl -X POST "http://localhost:8000/api/v1/sync-capture/" \
  -H "Content-Type: application/json" \
  -d '{
    "pokemonId": 25,
    "action": "capture",
    "timestamp": 1625097600000,
    "payload": {
      "pokemonName": "pikachu",
      "removed": false
    }
  }'

# Verificar ranking atualizado
curl -X GET "http://localhost:8000/api/v1/ranking/" | jq .
```

---

## 🚀 Próximos Passos

- [ ] Implementar autenticação JWT para endpoints admin
- [ ] Adicionar endpoint para backup/restore do banco
- [ ] Implementar rate limiting para operações destrutivas
- [ ] Adicionar confirmação via token para reset completo
- [ ] Logs estruturados para auditoria das operações
