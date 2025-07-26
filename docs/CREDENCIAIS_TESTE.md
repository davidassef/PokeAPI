# 🔑 **CREDENCIAIS DE TESTE - PokeAPIApp v1.5.2**

## 📋 **VISÃO GERAL**

Este documento contém as credenciais de teste disponíveis para a aplicação PokeAPIApp, permitindo que desenvolvedores e testadores acessem a aplicação sem necessidade de criar novas contas.

## 👥 **USUÁRIOS DE TESTE DISPONÍVEIS**

### **👤 Usuário Principal**
| Campo | Valor |
|-------|-------|
| **📧 Email** | `teste@teste.com` |
| **🔒 Senha** | `Teste123` |
| **👑 Papel** | `user` (usuário padrão) |
| **📊 Status** | Ativo |
| **🎯 Uso** | Testes gerais, funcionalidades básicas |

### **👤 Usuário Secundário**
| Campo | Valor |
|-------|-------|
| **📧 Email** | `teste2@teste.com` |
| **🔒 Senha** | `Teste123` |
| **👑 Papel** | `user` (usuário padrão) |
| **📊 Status** | Ativo |
| **🎯 Uso** | Testes de ranking, interação entre usuários |

## 🎯 **CASOS DE USO RECOMENDADOS**

### **🔄 Testes de Funcionalidade Individual**
**Use qualquer um dos usuários para:**
- ✅ Login e autenticação
- ✅ Navegação entre páginas
- ✅ Captura e liberação de pokémons
- ✅ Visualização de detalhes
- ✅ Troca de temas (claro/escuro)
- ✅ Mudança de idioma
- ✅ Funcionalidades mobile

### **🏆 Testes de Ranking e Competição**
**Use ambos os usuários para:**
- ✅ Testar sistema de ranking global
- ✅ Verificar posicionamento no pódio
- ✅ Validar contadores de captura
- ✅ Testar sincronização entre contas
- ✅ Verificar atualizações em tempo real

### **📊 Cenários de Teste Específicos**

#### **Cenário 1: Competição no Ranking**
1. **Login com `teste@teste.com`**
   - Capture alguns pokémons
   - Verifique posição no ranking
2. **Login com `teste2@teste.com`**
   - Capture mais pokémons que o primeiro usuário
   - Verifique mudança no ranking
3. **Volte para `teste@teste.com`**
   - Verifique atualização automática do ranking

#### **Cenário 2: Sincronização de Estados**
1. **Abra duas abas/janelas**
2. **Login com usuários diferentes em cada aba**
3. **Realize capturas em uma aba**
4. **Verifique atualização automática na outra aba**

#### **Cenário 3: Funcionalidades Mobile vs Web**
1. **Acesse versão web com `teste@teste.com`**
2. **Acesse versão mobile com `teste2@teste.com`**
3. **Compare funcionalidades e sincronização**

## 🔐 **INFORMAÇÕES DE SEGURANÇA**

### **⚠️ Importante**
- **Não altere as senhas** destes usuários de teste
- **Não delete** os pokémons capturados por estes usuários
- **Use apenas para testes** - não armazene dados importantes
- **Respeite outros testadores** que possam estar usando as mesmas contas

### **🛡️ Limitações de Segurança**
- Estes usuários têm **papel básico** (`user`)
- **Não têm acesso** a funcionalidades administrativas
- **Dados podem ser resetados** periodicamente
- **Não use para dados sensíveis** ou pessoais

## 🌐 **ACESSO À APLICAÇÃO**

### **🚀 Produção**
- **URL**: https://pokeapi-frontend.vercel.app
- **Status**: [![Frontend Status](https://img.shields.io/badge/Frontend-Online-brightgreen.svg)](https://pokeapi-frontend.vercel.app)

### **💻 Desenvolvimento Local**
- **Frontend**: http://localhost:8100
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📝 **HISTÓRICO DE DADOS**

### **Estado Atual dos Usuários de Teste**
| Usuário | Pokémons Capturados | Posição Ranking | Última Atividade |
|---------|-------------------|-----------------|------------------|
| `teste@teste.com` | ~8 pokémons | 🥈 2º lugar | Ativa |
| `teste2@teste.com` | ~8 pokémons | 🥇 1º lugar | Ativa |

*📊 Os números podem variar conforme outros testadores usam as contas*

## 🧪 **TESTES AUTOMATIZADOS**

### **Credenciais nos Testes E2E**
Os testes automatizados (Playwright) utilizam estas mesmas credenciais:

```typescript
// Configuração de teste
const TEST_USERS = {
  primary: {
    email: 'teste@teste.com',
    password: 'Teste123'
  },
  secondary: {
    email: 'teste2@teste.com',
    password: 'Teste123'
  }
};
```

### **Cenários de Teste Cobertos**
- ✅ Login/logout com ambos usuários
- ✅ Captura de pokémons
- ✅ Navegação entre páginas
- ✅ Funcionalidades mobile
- ✅ Sistema de ranking
- ✅ Sincronização de dados

## 📞 **SUPORTE**

### **Problemas com Credenciais**
Se encontrar problemas com as credenciais de teste:

1. **Verifique a digitação** - senhas são case-sensitive
2. **Limpe cache do navegador** - dados antigos podem interferir
3. **Tente o outro usuário** - pode haver problema específico
4. **Verifique status do backend** - https://pokeapi-la6k.onrender.com/health

### **Contato**
- 👨‍💻 **Desenvolvedor**: David Assef Carneiro
- 📧 **Email**: davidassef@gmail.com
- 🐙 **GitHub**: [@davidassef](https://github.com/davidassef)

## 📄 **CHANGELOG**

### **v1.5.2** (24/07/2025)
- ✅ Adicionado usuário secundário `teste2@teste.com`
- ✅ Documentação de cenários de teste
- ✅ Guias de uso para ranking

### **v1.5.1** (15/07/2025)
- ✅ Usuário principal `teste@teste.com` estabelecido
- ✅ Testes básicos funcionando

### **v1.5.0** (12/07/2025)
- ✅ Sistema de autenticação implementado
- ✅ Primeiras credenciais de teste criadas

---

**💡 Dica**: Use estas credenciais para explorar todas as funcionalidades da aplicação sem precisar criar uma conta própria!

**🎮 Desenvolvido com ❤️ por [David Assef](https://github.com/davidassef)**
