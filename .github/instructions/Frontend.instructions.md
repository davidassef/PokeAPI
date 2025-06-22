# Projeto Pokédex - Inspiração Portal Oficial ([https://sg.portal-pokemon.com/play/pokedex](https://sg.portal-pokemon.com/play/pokedex))

## 📄 Visão Geral

Este documento detalha os aspectos técnicos e de design inspirados no site oficial da Pokédex para a criação de um aplicativo web/mobile com **Ionic + Angular**, otimizando para dispositivos móveis e navegadores desktop.

---

## 🌐 Plataformas Alvo

* **Web App** (Desktop e Mobile via browser)
* **Aplicativo Mobile** (Android/iOS usando Capacitor)

---

## 🛠️ Tecnologias Utilizadas

* **Framework**: Ionic 7 + Angular 17
* **Linguagem**: TypeScript
* **UI Kit**: Ionic Components, Ionicons
* **Animações**: Angular Animations + CSS custom
* **API**: [PokeAPI](https://pokeapi.co/)
* **Player de áudio**: Web Audio API com serviço persistente Angular
* **i18n (localização)**: @ngx-translate/core
* **Persistência local**: Ionic Storage + localStorage
* **Backend opcional**: FastAPI para WebHooks e Ranking

---

## 🛏️ Layout & Design

### 1. Tela Inicial (Home)

* **Grade de Pokémons**:

  * Cards grandes com imagem, nome e número
  * Badges coloridas com os tipos
  * Scroll infinito ou paginação
* **Filtros visuais**:

  * Por nome (input com debounce)
  * Por tipo (lista de botões com ícones)
  * Por geração
  * Ordem: Numérica ou alfabética
* **Responsividade**:

  * Desktop: 4 colunas
  * Tablet: 2 colunas
  * Mobile: 1 coluna

### 2. Tela de Detalhes

* **Imagem grande do Pokémon**
* **Tipos com cores distintas**
* **Stats com barras animadas**
* **Habilidades, Altura, Peso, etc.**
* **Botão de Favoritar com animação de captura**

### 3. Tela de Favoritos

* Igual à Home, mas filtrando Pokémons favoritados
* Permite desfavoritar

### 4. Tela de Ranking

* Lista de Pokémons mais favoritados (dados de WebHook)
* Exibe contador e medalhas para top 3

### 5. Menu Lateral (Sidebar)

* Pokédex, Favoritos, Ranking, Configurações, Sobre
* Botão de troca de idioma (PT/EN/ES)
* Tema claro/escuro toggle

---

## 🎵 Player Musical (Persistente)

* Mini-player fixo ao rodapé
* Controles:

  * Play / Pause
  * Reiniciar
  * Controle de volume
* Troca de trilha de acordo com idioma (assets/audio/\*.mp3)
* Mantido via serviço singleton Angular entre rotas

---

## 🌍 Sistema de Localização (i18n)

* Arquivos JSON:

  * `pt-BR.json`
  * `en-US.json`
  * `es-ES.json`
* Labels, botões, menus e descrições adaptáveis
* Detecção de idioma automática + botão de troca manual

---

## ⚖️ Temas e Estilos

* **Cores principais**:

  * Vermelho (#EF5350), Branco, Cinza Claro, Azul (#42A5F5)
* **Fontes**:

  * "Press Start 2P" (Pixel) ou sans-serif estilizado
* **Animações CSS**:

  * Hover nos cards (scale, brilho)
  * Captura com Pokébola (keyframes)
* **Backgrounds**:

  * Textura de grama, pedra ou digital (opcional)

---

## 📁 Estrutura de Pastas

```bash
src/
├── app/
│   ├── core/
│   │   └── services/
│   ├── pages/
│   │   ├── home/
│   │   ├── details/
│   │   ├── favorites/
│   │   ├── ranking/
│   │   └── settings/
│   ├── shared/
│   │   ├── components/
│   │   └── pipes/
├── assets/
│   ├── img/
│   ├── sprites/
│   ├── audio/
│   └── i18n/
```

---

## 🎡 Extras

* Splash screen com logo do projeto
* Favicon personalizado com Pokébola
* Preloader com Pokébola girando
* SEO básico com metatags e manifest.json
* Arquivo README completo com instruções e demonstração

---

## 🔹 Integrações Futuras

* Notificações push (capacitor)
* Testes unitários com Karma/Jasmine
* Ranking global com backend Firebase ou FastAPI
* Autenticação com Google Auth

---

**Este documento servirá de base para a construção e organização do frontend responsivo, temático e interativo da Pokédex.**
