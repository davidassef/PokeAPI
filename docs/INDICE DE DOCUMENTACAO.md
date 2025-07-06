# 📚 Documentação - PokeAPIApp

## 📋 Guias Essenciais

### 🎯 Para Desenvolvedores

1. **[Como Usar Ambientes](01_COMO_USAR_AMBIENTES.md)**
   - Alternar entre desenvolvimento e produção
   - Configurar URLs e client-server
   - Solucionar problemas de conexão

2. **[Deploy em Produção](02_DEPLOY_PRODUCAO.md)**
   - Configurar build para produção
   - Deploy estático vs web service
   - Monitoramento e troubleshooting

3. **[Estrutura do Projeto](03_ESTRUTURA_PROJETO.md)**
   - Organização de pastas
   - Arquitetura do sistema
   - Convenções de código

### 🛠️ Para Administradores

4. **[Endpoints Admin](../backend/docs/04_ENDPOINTS_ADMIN.md)**
   - Gerenciar banco de dados
   - Limpar dados de teste
   - Monitorar sistema

5. **[Sistema de Ranking](04_SISTEMA_RANKING.md)**
   - Como funciona o ranking
   - Sincronização de dados
   - Métricas e estatísticas

## 🚀 Início Rápido

### Desenvolvimento Local
```bash
# 1. Configurar ambiente
cd scripts && bash config-environment.sh  # Opção 1

# 2. Iniciar backend
cd backend && python main.py

# 3. Iniciar frontend
cd frontend && npm start
```

### Deploy Produção
```bash
# 1. Configurar ambiente
cd scripts && bash config-environment.sh  # Opção 2

# 2. Build produção
cd frontend && npm run build:prod

# 3. Deploy pasta www/
```

## 🔧 Comandos Úteis

### Verificar Status
```bash
# Status dos ambientes
cd scripts && bash config-environment.sh  # Opção 3

# Status do banco
curl http://localhost:8000/api/v1/admin/database-status
```

### Troubleshooting
```bash
# Verificar portas
netstat -ano | findstr :4200  # Frontend
netstat -ano | findstr :8000  # Backend
netstat -ano | findstr :3001  # Client-Server

# Limpar cache
cd frontend && npm cache clean --force
```

## 🎯 Fluxo de Trabalho

### 1. Desenvolvimento Diário
- Usar `01_COMO_USAR_AMBIENTES.md`
- Configurar ambiente local
- Desenvolver e testar

### 2. Preparar Deploy
- Usar `02_DEPLOY_PRODUCAO.md`
- Configurar ambiente produção
- Fazer build e deploy

### 3. Gerenciar Sistema
- Usar `04_ENDPOINTS_ADMIN.md`
- Monitorar banco de dados
- Limpar dados de teste

## 📞 Suporte

Para dúvidas específicas:
- **Ambiente/Config**: Ver `01_COMO_USAR_AMBIENTES.md`
- **Deploy**: Ver `02_DEPLOY_PRODUCAO.md`
- **Banco de Dados**: Ver `04_ENDPOINTS_ADMIN.md`
- **Estrutura**: Ver `03_ESTRUTURA_PROJETO.md`

---

**Última atualização:** 06/07/2025
**Versão:** 1.0
