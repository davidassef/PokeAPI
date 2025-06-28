# 🗺️ Planejamento de Desenvolvimento - PokeAPIApp Frontend

## 📊 Status Atual (60% Completo)

### ✅ **Já Implementado**
- [x] Estrutura base do projeto Ionic + Angular
- [x] Modelos TypeScript completos
- [x] Serviços principais (PokeAPI, Favorites, Settings, Audio)
- [x] Componentes compartilhados (5 componentes)
- [x] Pipes utilitários (5 pipes)
- [x] Internacionalização (PT/EN/ES)
- [x] Sidebar menu com stats
- [x] Music player persistente
- [x] Sistema de temas e responsividade

---

## 🎯 **Próximas Etapas - Planejamento Detalhado**

### **📅 SPRINT 1: Integração Core (2-3 dias)**

#### **Dia 1: Conectar Componentes às Páginas**
**Prioridade: ALTA** 🔴

**Home Page:**
- [x] Atualizar `home.page.html` para usar `<app-pokemon-card>`
- [x] Implementar `<app-search-filter>` com binding de eventos
- [x] Conectar filtros ao `PokeApiService`
- [x] Implementar scroll infinito ou paginação
- [x] Adicionar loading states com `<app-loading-spinner>`

**Details Page:**
- [x] Implementar layout completo com imagens grandes
- [x] Adicionar botão de favoritar com animação
- [x] Exibir stats com barras animadas usando pipes
- [x] Implementar navegação de volta
- [x] Adicionar compartilhamento (opcional)

**Arquivos a editar:**
```
src/app/pages/home/home.page.html
src/app/pages/home/home.page.ts
src/app/pages/home/home.page.scss
src/app/pages/details/details.page.html
src/app/pages/details/details.page.ts
src/app/pages/details/details.page.scss
```

---

#### **Dia 2: Finalizar Páginas Principais**

**Favorites Page:**
- [x] Listar Pokémons favoritos usando `<app-pokemon-card>`
- [x] Implementar remoção de favoritos
- [x] Adicionar estados vazios (empty state)
- [x] Sincronizar com `FavoritesService`

**Settings Page:**
- [x] Implementar troca de idioma
- [x] Toggle tema claro/escuro
- [x] Controles de áudio/música
- [x] Configurações de notificação
- [x] Link para "Sobre" o app

**Arquivos a editar:**
```
src/app/pages/favorites/favorites.page.html
src/app/pages/favorites/favorites.page.ts
src/app/pages/settings/settings.page.html
src/app/pages/settings/settings.page.ts
```

---

#### **Dia 3: Navegação e Routing**

**Routing Completo:**
- [x] Configurar guards de rota (se necessário)
- [x] Implementar navegação por parâmetros
- [x] Adicionar breadcrumbs ou navegação hierárquica
- [x] Testar deep linking

**Menu e Navegação:**
- [x] Conectar sidebar menu às páginas
- [x] Implementar badges dinâmicos (contadores)
- [x] Adicionar indicadores de página ativa
- [x] Testar navegação em dispositivos móveis

---

### **📅 SPRINT 2: UX/UI e Animações (2-3 dias)**

#### **Dia 4-5: Animações e Interações**

**Animações Avançadas:**
- [x] Animação de captura com Pokébola
- [x] Transições entre páginas
- [x] Hover effects nos cards
- [x] Loading animations customizados
- [x] Feedback visual para ações (tap, swipe)

**Player Musical:**
- [x] Integrar completamente entre rotas
- [x] Adicionar controles avançados
- [x] Implementar playlist automática
- [x] Persistir estado entre sessões

---

#### **Dia 6: Responsividade e Temas**

**Layout Responsivo:**
- [x] Testar em diferentes resoluções
- [x] Otimizar para tablets
- [x] Ajustar grid de cards (1/2/4 colunas)
- [x] Melhorar navegação mobile

**Sistema de Temas:**
- [x] Implementar tema escuro completo
- [x] Cores personalizadas por tipo de Pokémon
- [x] Salvamento de preferências
- [x] Transições suaves entre temas

---

### **📅 SPRINT 3: Integração Backend (1-2 dias)**

#### **Dia 7: Conectar com Backend FastAPI**

**Integração API:**
- [x] Configurar URLs do backend em environment
- [x] Implementar autenticação (se necessária)
- [x] Conectar sistema de favoritos ao servidor
- [x] Implementar ranking global

**Ranking Page:**
- [x] Consumir dados do backend
- [x] Exibir top Pokémons mais favoritados
- [x] Implementar medalhas para top 3
- [x] Adicionar atualização em tempo real

---

### **📅 SPRINT 4: Polimento e Deploy (1-2 dias)**

#### **Dia 8-9: Testes e Otimizações**

**Performance:**
- [x] Implementar lazy loading de imagens
- [x] Otimizar bundle size
- [x] Configurar service workers (PWA)
- [x] Testar performance em dispositivos baixo-end

**Testes:**
- [x] Testes unitários dos componentes
- [x] Testes de integração dos serviços
- [x] Testes E2E básicos
- [x] Validação em diferentes browsers

**Deploy:**
- [x] Configurar build de produção
- [x] Deploy web (Netlify/Vercel)
- [x] Build para Android/iOS
- [x] Documentação final

---

## 🔧 **Arquivos Prioritários para Próxima Sessão**

### **Imediato (próxima sessão):**
1. `src/app/pages/home/home.page.html` - Implementar grid de cards
2. `src/app/pages/home/home.page.ts` - Conectar search filter
3. `src/app/pages/home/home.page.scss` - Estilos responsivos
4. `src/app/pages/details/details.page.html` - Layout completo

### **Seguinte:**
5. `src/app/pages/favorites/favorites.page.html`
6. `src/app/pages/settings/settings.page.html`
7. `src/app/tabs/tabs.page.html` - Badges e navegação

---

## 🎨 **Especificações de Design**

### **Grid Layout (Home):**
- **Desktop:** 4 colunas com gaps de 20px
- **Tablet:** 2 colunas com gaps de 16px
- **Mobile:** 1 coluna com gaps de 12px

### **Cores por Tipo:**
```scss
$type-colors: (
  fire: #F08030,
  water: #6890F0,
  grass: #78C850,
  electric: #F8D030,
  // ... etc
);
```

### **Animações:**
- **Duração:** 300ms ease-in-out
- **Hover:** scale(1.05) + shadow
- **Loading:** Pokébola girando

---

## 📋 **Checklist de Qualidade**

### **Antes de cada commit:**
- [x] Código segue guias de estilo (linting)
- [x] Componentes são responsivos
- [x] Navegação funciona em mobile
- [x] Loading states implementados
- [x] Tratamento de erros básico
- [x] Sem console.logs em produção

### **Antes do deploy:**
- [x] Testes passando
- [x] Performance otimizada
- [x] Acessibilidade básica
- [x] SEO configurado
- [x] Manifest.json atualizado

---

## 🚀 **Meta Final**

**Objetivo:** Pokédex completa, moderna e segura, com:
- ✅ Interface responsiva e animada
- ✅ Sistema de capturados (favoritos) sincronizado
- ✅ Player musical persistente
- ✅ Temas claro/escuro
- ✅ Suporte a 3 idiomas
- ✅ Deploy web + mobile
- ✅ Sistema de ranking global/local dos pokémons mais capturados
- 🔒 Sistema de autenticação de usuários (cadastro, login, segurança, captcha)

**Timeline Total:** 8-10 dias de desenvolvimento
**Status Atual:** Dia 3-4 (estrutura completa)
**Próximo Marco:** Integração completa (Dia 6)

---

## 🔐 Checklist: Sistema de Autenticação de Usuário

### Backend (Prioridade Máxima)
- [ ] Criar modelo de usuário (nome, email, senha hash)
- [ ] Implementar endpoint de cadastro (`POST /auth/register`)
- [ ] Implementar endpoint de login (`POST /auth/login`)
- [ ] Gerar e validar JWT para autenticação
- [ ] Armazenar senhas com hash seguro (bcrypt)
- [ ] Validar unicidade de email e nome de usuário
- [ ] Implementar verificação de CAPTCHA no cadastro/login
- [ ] Endpoint para dados do usuário autenticado (`GET /users/me`)
- [ ] Rate limit para tentativas de login

### Frontend
- [ ] Tela de cadastro (nome, email, senha, captcha)
- [ ] Tela de login (email, senha, captcha)
- [ ] Exibir mensagens de erro/sucesso
- [ ] Armazenar JWT de forma segura (Ionic Storage)
- [ ] Proteger rotas autenticadas
- [ ] Logout e limpeza de sessão

### Integração e Segurança
- [ ] Testar fluxo completo de cadastro/login/logout
- [ ] Validar campos e feedback de UX
- [ ] Garantir HTTPS em produção
- [ ] Documentar fluxo de autenticação

---

## 👁️ Checklist: Serviço de Pokémons Vistos (standby)

- [x] Criar serviço seen.service.ts para persistir IDs de pokémons vistos
- [ ] Integrar serviço à página de detalhes (marcar como visto ao clicar no card)
- [ ] Exibir contagem real de vistos no sidebar
- [ ] Testar persistência e atualização em tempo real

## 📄 Checklist: Implementação da Página de Detalhes dos Pokémons
- [ ] Criar rota e componente de detalhes (`/tabs/details/:id`)
- [ ] Buscar dados completos do pokémon selecionado
- [ ] Exibir imagem, nome, tipos, stats, habilidades, etc.
- [ ] Exibir botão de favoritar/capturar
- [ ] Integrar com serviço de pokémons vistos (marcar como visto ao acessar)
- [ ] Navegação de volta e entre pokémons
- [ ] Responsividade e acessibilidade
- [ ] Testes unitários e de navegação

---
