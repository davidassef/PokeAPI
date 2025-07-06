# 🔧 Guia de Configuração de Ambiente

## 🎯 Problema Identificado

- ❌ Conexões falhando para localhost
- ❌ Client-server tentando conectar ao Render
- ❌ Backend local não sendo usado
- ❌ Conflitos entre ambiente local e produção

## ✅ Solução: Script Automático

### Uso Rápido:
```bash
./scripts/config-environment.sh
```

### Opções Disponíveis:

| Opção | Ambiente | Backend | Client-Server | Uso |
|-------|----------|---------|---------------|-----|
| **1** | 🏠 Desenvolvimento | localhost:8000 | ✅ Ativo | Desenvolvimento completo |
| **2** | 🌐 Produção | Render.com | ❌ Inativo | Testar com backend remoto |
| **3** | 📊 Status | - | - | Ver configuração atual |

## 🚀 Fluxos de Trabalho

### 💻 Desenvolvimento Local (Recomendado)
```bash
# 1. Configurar ambiente
./scripts/config-environment.sh
# Escolher opção 1

# 2. Iniciar backend local
cd backend
uvicorn main:app --reload

# 3. Iniciar frontend + client-server
cd frontend
npm start

# 4. Acessar
# Frontend: http://localhost:8100
# Backend: http://localhost:8000
# Client-Server: http://localhost:3001
```

### 🌐 Teste com Backend Remoto
```bash
# 1. Configurar ambiente
./scripts/config-environment.sh
# Escolher opção 2

# 2. Iniciar apenas frontend
cd frontend
npm run start:frontend-only

# 3. Acessar
# Frontend: http://localhost:8100
# Backend: https://pokeapi-la6k.onrender.com (remoto)
```

## 🔍 Verificação Rápida

```bash
# Ver status atual
./scripts/config-environment.sh
# Escolher opção 3
```

## 📋 Arquivos Afetados

| Arquivo | Desenvolvimento | Produção |
|---------|-----------------|----------|
| `environment.ts` | `localhost:8000` | `onrender.com` |
| `environment.prod.ts` | *Sempre produção* | `onrender.com` |
| Client-Server | ✅ Ativo | ❌ Inativo |

## ⚡ Comandos Rápidos

```bash
# Desenvolvimento rápido
./scripts/config-environment.sh # opção 1
cd backend && uvicorn main:app --reload &
cd frontend && npm start

# Teste rápido com produção
./scripts/config-environment.sh # opção 2
cd frontend && npm run start:frontend-only
```

## 🛠️ Troubleshooting

### "Porta em uso"
```bash
# Limpar todas as portas
./scripts/config-environment.sh # opção 3
# Ver quais estão em uso e finalizar processos
```

### "Backend não conecta"
```bash
# Verificar configuração
./scripts/config-environment.sh # opção 3
# Se estiver em modo local, iniciar backend
cd backend && uvicorn main:app --reload
```

### "Client-server falha"
```bash
# Se estiver em modo produção, é normal
# Client-server só funciona em desenvolvimento
```

---

**Agora você pode alternar facilmente entre desenvolvimento e produção! 🎯**
