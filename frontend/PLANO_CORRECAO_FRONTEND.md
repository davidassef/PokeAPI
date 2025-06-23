# Plano de Correção e Padronização do Frontend PokeAPIApp

## Objetivo
Corrigir o build do frontend Angular/Ionic, padronizar para Angular 17 + Ionic 7, restaurar arquitetura tradicional de NgModules, garantir que todos os imports, declarações e dependências estejam corretos, e que o build finalize com sucesso. Corrigir também problemas de template, bindings e propriedades ausentes nos componentes/páginas.

---

## 1. Diagnóstico Atual
- **Build avança, mas falha por erros de template e propriedades ausentes.**
- **SettingsPage:** Diversos métodos e propriedades não implementados (corrigido nesta etapa).
- **HomePage, FavoritesPage, RankingPage, DetailsPage:** Erros de bindings, tipagem, propriedades e sintaxe.
- **Componentes compartilhados:** Inputs/Outputs e eventos não padronizados.

---

## 2. Plano de Correção

### 2.1. SettingsPage
- [x] Implementar todos os métodos e propriedades esperados pelo template.
- [x] Integrar corretamente com AudioService, SettingsService e FavoritesService.
- [x] Garantir que todas as opções e eventos estejam funcionais.

### 2.2. HomePage & FavoritesPage
- [x] Corrigir bindings dos componentes `app-pokemon-card` e `app-search-filter`.
- [x] Garantir que os Inputs/Outputs estejam declarados e tipados corretamente.
- [x] Ajustar métodos de filtro, busca e favoritos para tipagem e integração correta.

### 2.3. RankingPage
- [x] Corrigir erros de sintaxe no template.
- [x] Garantir que métodos e propriedades usados no HTML existam e estejam tipados.
- [ ] Validar integração com dados de ranking (mock ou API).

### 2.4. DetailsPage
- [ ] Corrigir erro de propriedade `move` no template.
- [ ] Garantir que todos os dados exibidos estejam presentes e tipados.

### 2.5. Componentes Compartilhados
- [ ] Revisar e padronizar Inputs/Outputs dos componentes em `shared/components`.
- [ ] Garantir que eventos e propriedades estejam documentados e tipados.
- [ ] Validar integração dos componentes nas páginas.

### 2.6. Testes e Validação
- [ ] Rodar o build e garantir ausência de erros.
- [ ] Testar navegação, filtros, favoritos, player e configurações.
- [ ] Validar responsividade e layout.

---

## 3. Boas Práticas
- Seguir o guia de código limpo do projeto.
- Garantir modularização, nomes descritivos e tipagem forte.
- Evitar duplicação e lógica excessiva em templates.
- Documentar métodos e propriedades públicas.

---

## 4. Próximos Passos
1. Corrigir HomePage e FavoritesPage (bindings e eventos).
2. Corrigir RankingPage (template e integração).
3. Corrigir DetailsPage (dados e tipagem).
4. Revisar componentes compartilhados.
5. Rodar build e validar app.
6. Testar funcionalidades principais.
7. Documentar pontos importantes e próximos diferenciais.

---

## 5. Referências
- [Instruções do Projeto](../.github/instructions/Frontend.instructions.md)
- [Guia de Código Limpo](../.github/instructions/Instruções.instructions.md)
- [Objetivo do Projeto](../.github/instructions/Objetivo.instructions.md)

---

> _Este plano deve ser atualizado conforme o progresso das correções e validações._
