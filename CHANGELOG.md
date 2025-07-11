# 📋 Changelog - PokeAPIApp

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.5] - 2025-07-11

### ✨ Adicionado
- **Sistema de Persistência de Autenticação Aprimorado**
  - Reatividade completa do estado de autenticação em todas as páginas
  - Inscrição automática em observables `authState$` e `currentUser$`
  - Persistência garantida após refresh da página

### 🔧 Corrigido
- **Header/Navbar**: Botões de login agora são substituídos corretamente por dropdown de perfil após autenticação
- **Sidemenu**: Removidas opções de perfil duplicadas (mantidas apenas no header)
- **Página Capturados**: Estado de autenticação reflete corretamente na interface
- **Navegação**: Estado de usuário mantido consistentemente entre páginas
- **Timeout de Registro**: Corrigido problema de travamento no middleware de logging

### 🎯 Melhorado
- **UX de Autenticação**: Interface mais responsiva e consistente
- **Performance**: Eliminação de middlewares duplicados e otimização de requests
- **Código**: Limpeza de componentes desnecessários e melhoria da arquitetura

### 🗂️ Técnico
- Atualização de versão em todos os arquivos de configuração
- Melhoria na documentação do sistema de autenticação
- Padronização de nomenclatura de arquivos e componentes

---

## [1.0.0] - 2025-07-10

### ✨ Lançamento Inicial
- **Frontend**: Aplicativo Ionic + Angular completo
- **Backend**: API FastAPI com autenticação JWT
- **Funcionalidades**:
  - Pokédex completa com dados da PokeAPI
  - Sistema de captura de Pokémons
  - Ranking global de usuários
  - Autenticação com registro e login
  - Sistema de configurações
  - Suporte a múltiplos idiomas
  - Temas claro e escuro
  - Sistema de música ambiente

### 🛠️ Tecnologias
- **Frontend**: Ionic 8, Angular 17, TypeScript, SCSS
- **Backend**: FastAPI, SQLAlchemy, SQLite, Pydantic
- **Mobile**: Capacitor para builds nativas
- **Deploy**: Suporte para Render, Netlify e outras plataformas

---

## Tipos de Mudanças

- `✨ Adicionado` para novas funcionalidades
- `🔧 Corrigido` para correções de bugs
- `🎯 Melhorado` para mudanças em funcionalidades existentes
- `🗑️ Removido` para funcionalidades removidas
- `🔒 Segurança` para correções de vulnerabilidades
- `🗂️ Técnico` para mudanças técnicas internas
