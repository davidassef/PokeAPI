# Plano de Ação: Modal de Detalhes Premium – Padrão Sci-Fi/Futurista

## Objetivo
Refatorar o modal de detalhes do Pokémon para um visual inspirado em Pokédex sci-fi, com foco em energia, glow, painéis agrupados e experiência imersiva, mantendo a identidade visual do app.

---

## 1. Princípios de Design Sci-Fi Premium
- **Hero central com efeito glow:** Imagem do Pokémon centralizada, com círculo luminoso/gradiente animado ao fundo.
- **Painéis com borda neon/glow:** Cards de informações com bordas luminosas, glassmorphism e outline colorido.
- **Tipografia sci-fi:** Títulos grandes, centralizados, com sombra ou glow.
- **Chips de tipo e fraqueza:** Chips destacados, com cor forte, ícone e microanimação.
- **Painéis de informações agrupados:** Altura, peso, categoria, gênero, habilidade, todos com ícones e agrupados.
- **Barras de status estilizadas:** Barras horizontais com linhas, preenchimento animado e cor por stat.
- **Fundo espacial:** Overlay escuro com textura de estrelas/galáxia e leve gradiente.
- **Navegação entre pokémons:** Setas para próximo/anterior (opcional).
- **Responsividade total:** Layout adaptativo, mantendo experiência premium em todos os dispositivos.

---

## 2. Especificação Técnica do Novo Visual

### A. Estrutura do Modal
- **Overlay:**
  - Fundo escuro translúcido com textura espacial (estrelas/galáxia), blur e fade-in.
- **Container:**
  - Fundo semi-transparente, borda-radius 24px, borda neon/glow, box-shadow forte, animação de entrada (slide + fade).
  - Largura máxima 950px, responsivo.

### B. Hero Central
- **Imagem do Pokémon:**
  - Centralizada, com círculo glow animado (pulsar ou girar devagar).
  - Número e nome do Pokémon centralizados, tipografia grande e com efeito de luz.

### C. Painéis de Informações
- **Cards com borda glow:**
  - Informações básicas (altura, peso, categoria, gênero, habilidade) agrupadas em painel com ícones.
  - Glassmorphism + outline neon.
- **Chips de tipo e fraqueza:**
  - Chips grandes, com cor forte, ícone SVG, microanimação de hover/foco.
  - Exibir fraquezas principais do Pokémon.

### D. Barras de Status
- **Status:**
  - Barras horizontais estilizadas, linhas de fundo, preenchimento animado, cor por stat.
  - Tooltip ao hover.

### E. Navegação e UX
- **Setas para próximo/anterior Pokémon** (opcional, mas recomendado).
- **Botão de fechar com efeito glow.**
- **Scroll suave para conteúdo longo.**
- **Acessibilidade total:** Foco, contraste, navegação por teclado, alt em imagens.

### F. Fundo
- **Overlay com textura espacial:**
  - Gradiente escuro + estrelas/galáxia sutil.

---

## 3. Checklist de Implementação Sci-Fi Premium
- [ ] Overlay com textura espacial, blur e fade
- [ ] Container glassmorphism com borda neon/glow
- [ ] Hero central com círculo glow animado
- [ ] Tipografia sci-fi grande e centralizada
- [ ] Chips de tipo com cor, ícone e microanimação
- [ ] Chips de fraqueza destacados
- [ ] Painel de informações agrupadas com ícones
- [ ] Barras de status estilizadas e animadas
- [ ] Navegação entre pokémons (setas)
- [ ] Botão de fechar com efeito glow
- [ ] Scroll interno suave
- [ ] Responsividade total
- [ ] Acessibilidade e navegação por teclado
- [ ] Testes em todos os breakpoints

---

## 4. Elementos Obrigatórios e Opcionais

### **Obrigatórios:**
- Hero central com efeito glow
- Painéis com borda neon/glow
- Tipografia sci-fi grande
- Chips de tipo destacados
- Barras de status estilizadas
- Painel de informações agrupadas
- Responsividade e acessibilidade

### **Opcionais:**
- Chips de fraqueza
- Navegação entre pokémons (setas)
- Fundo com textura espacial animada

---

## 5. Observações
- O novo modal deve ser referência visual do app, transmitindo modernidade, tecnologia e experiência premium sci-fi.
- Manter performance e acessibilidade como prioridade.
- Todos os efeitos devem ser suaves e não cansativos.

---

**Próximo passo:**
Estruturar o novo HTML/SCSS do modal seguindo este plano, validando visualmente antes de integrar a lógica Angular.

**Status Final:** ✅ **CONCLUÍDO COM SUCESSO** 