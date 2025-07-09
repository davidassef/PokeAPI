# 🚀 PokeAPIApp - Aplicativo Pokémon Full-Stack

[![Status](https://img.shields.io/badge/Status-Em%20Manuten%C3%A7%C3%A3o-yellow?style=for-the-badge)](https://github.com/davidassef/PokeAPI)
[![Frontend](https://img.shields.io/badge/Frontend-Ionic%20+%20Angular-blue?style=for-the-badge&logo=ionic)](https://ionicframework.com/)
[![Backend](https://img.shields.io/badge/Backend-Em%20Atualiza%C3%A7%C3%A3o-red?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Status](https://img.shields.io/badge/Funcionalidades-Pokédex%20Dispon%C3%ADvel-blueviolet?style=for-the-badge)](https://github.com/davidassef/PokeAPI)

## 🎯 Sobre o Projeto

Um aplicativo moderno e completo para explorar o mundo Pokémon!

### Principais Características

- Integração com PokéAPI
- Interface Web 100% Completa
- Sistema de Favoritos
- Multiplataforma

## ⚠️ Status Atual

O backend está em manutenção para atualizações do sistema de autenticação. Apenas a funcionalidade de Pokédex está disponível no momento.

## 📱 Funcionalidades Disponíveis

- Visualização da Pokédex
- Busca de Pokémon
- Detalhes dos Pokémon

## 🔧 Em Manutenção

- Sistema de autenticação
- Favoritos
- Ranking
- Perfil do usuário

---

## 📱 Sobre o Projeto

## 📋 Visão Geral

O **PokeAPIApp** é uma aplicação full-stack moderna que permite aos usuários explorar, favoritar e conhecer detalhes sobre Pokémon através de uma interface intuitiva e responsiva. O projeto combina as melhores tecnologias web e mobile para oferecer uma experiência excepcional.

## 📊 Status de Desenvolvimento (09/07/2024)

## 🚀 Últimas Atualizações

- **Backend em Manutenção**: Sistema de autenticação em atualização
- **Frontend Otimizado**: Removida a dependência do client-server local
- **Performance**: Melhorias na inicialização da aplicação

## ✅ Funcionalidades Ativas

### Pokédex Completa

- Visualização de todos os Pokémon
- Busca avançada
- Filtros por tipo e região
- Detalhes completos de cada Pokémon

## 🎨 Experiência do Usuário

- Tema claro/escuro
- Interface responsiva
- Navegação intuitiva
- Carregamento otimizado de imagens

## 🛠️ Em Desenvolvimento

### Sistema de Autenticação

- Novo servidor de autenticação em implantação
- Melhorias na segurança

  - Suporte a redes sociais  

- **Recursos Futuros**  
  - Sistema de favoritos aprimorado  
  - Ranking competitivo  
  - Perfil do usuário personalizável  
  - Batalhas online  

#### 📅 Próximos Passos

1. Conclusão da migração do sistema de autenticação  
2. Reativação gradativa das funcionalidades  
3. Testes de carga e segurança  
4. Lançamento da próxima versão estável  

Agradecemos sua paciência enquanto trabalhamos para trazer uma experiência ainda melhor! 🚀

### ✨ Diferenciais

- 🎨 **Design Moderno**: Interface limpa e responsiva com Material Design
- 🌐 **Multiplataforma**: Funciona em Web, iOS e Android (Capacitor)
- 🌍 **Internacionalização**: Suporte a múltiplos idiomas (PT, EN, ES)
- 🎵 **Player Musical**: Música ambiente integrada
- 🌙 **Temas**: Modo claro e escuro
- ⚡ **Performance**: Otimizado com lazy loading e componentes reutilizáveis
- 📊 **Ranking**: Sistema de ranking de Pokémon mais populares
- 🔄 **Sincronização**: Backend próprio para persistência de dados

---

## 🏗️ Arquitetura

### 📁 Estrutura do Projeto
```
PokeAPIApp/
├── 📁 backend/                    # Aplicação FastAPI
├── 📁 frontend/                   # Aplicação Ionic + Angular
├── 📁 config/                     # Configurações de deploy
├── 📁 data/                       # Bancos de dados
├── 📁 docs/                       # Documentação completa
├── 📁 scripts/                    # Scripts de automação
│   ├── 📁 build/                  # Scripts de build
│   ├── 📁 database/               # Scripts de banco de dados
│   ├── 📁 deployment/             # Scripts de deploy
│   └── 📁 sync/                   # Scripts de sincronização
└── 📁 tests/                      # Testes end-to-end
```

### Frontend (Ionic + Angular)
```
frontend/src/app/
├── core/              # Serviços principais
├── shared/            # Componentes e pipes reutilizáveis
├── pages/             # Páginas da aplicação
├── models/            # Modelos TypeScript
└── services/          # Serviços Angular
```

### Backend (FastAPI + SQLAlchemy)
```
backend/app/
├── core/              # Configurações e database
├── models/            # Modelos SQLAlchemy
├── routes/            # Endpoints da API
├── schemas/           # Esquemas Pydantic
├── services/          # Lógica de negócio
└── utils/             # Funções utilitárias
```

## 📖 Documentação Completa

## 📚 Documentação

Consulte [docs/README.md](docs/README.md) para todos os guias essenciais

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Framework**: Ionic 8 + Angular 17
- **Linguagem**: TypeScript
- **Estilização**: SCSS + CSS Variables
- **Estado**: RxJS + Services
- **Internacionalização**: ngx-translate
- **Build**: Angular CLI + Capacitor

### Backend
- **Framework**: FastAPI 0.104.1
- **ORM**: SQLAlchemy 2.0
- **Database**: SQLite
- **Validação**: Pydantic
- **Servidor**: Uvicorn
- **Testes**: Pytest + Coverage

### Integrações
- **API Externa**: [PokéAPI](https://pokeapi.co/) v2
- **Armazenamento**: Ionic Storage
- **HTTP Client**: HttpClient (Angular) + HTTPX (Python)

---

## 📋 Funcionalidades

### ✅ Implementadas
- [x] 🏠 **Página Home** - Lista e busca de Pokémon
- [x] 🔍 **Página de Detalhes** - Modal moderno com abas temáticas e animações
- [x] ⭐ **Sistema de Capturas (Favoritos)** - Adicionar/remover favoritos
- [x] ⚙️ **Configurações** - Troca de idioma e tema
- [x] 🎵 **Player Musical** - Música ambiente persistente
- [x] 📱 **Design Responsivo** - Adaptável a todos os dispositivos
- [x] 🌐 **Internacionalização** - Português, Inglês e Espanhol
- [x] 🎨 **Componentes Reutilizáveis** - Pokemon Card, Loading Spinner, etc.
- [x] 🔧 **Backend API** - Endpoints para usuários, favoritos e ranking
- [x] 🏆 **Página de Ranking** - Pokémon mais populares (carregamento otimizado)
- [x] ⚡ **Botão Surpreenda-me** - Pokémon aleatório com cooldown inteligente
- [x] 📖 **Flavor Texts Otimizados** - Container fixo com scroll e indicadores visuais

### 🚧 Em Desenvolvimento
- [ ] 🔐 **Sistema de Autenticação** - Login e perfis de usuário
- [ ] 📊 **Dashboard Analytics** - Estatísticas de uso
- [ ] 🔄 **Sincronização** - Backup automático de favoritos
- [ ] 📱 **App Mobile** - Build para iOS/Android
- [ ] 🧪 **Testes E2E** - Cobertura completa de testes

### 🎯 Próximas Features
- [ ] 🎮 **Mini-games** - Quizzes e batalhas simuladas
- [ ] 📈 **Comparador** - Comparar stats entre Pokémon
- [ ] 🔔 **Notificações** - Pokémon do dia e novidades
- [ ] 🌟 **Sistema de Conquistas** - Badges e recompensas
- [ ] 🗺️ **Mapa Interativo** - Regiões e localizações

---

## 🚀 Como Executar

> **⚠️ Nota Importante (08/07/2024):** 
> - O backend está em manutenção para atualizações no sistema de autenticação
> - Apenas a funcionalidade de Pokédex está disponível no momento
> - As seções de autenticação, favoritos e ranking estão temporariamente desativadas
> - Consulte a seção [Status Atual](#-sobre-o-projeto) para mais detalhes

### Pré-requisitos
- Node.js 18+ e npm
- Python 3.11+
- Git

### 1️⃣ Clone o Repositório
```bash
git clone https://github.com/davidassef/PokeAPI.git
cd PokeAPI
```

### 1️⃣ Configure o Backend

> **⚠️ Importante (09/07/2024):**
> - O backend está em manutenção para atualizações no sistema de autenticação  
> - Apenas a funcionalidade de Pokédex está disponível no momento  
> - O frontend utiliza dados mockados para a Pokédex  
> - O client-server local foi removido para melhorar a performance

```bash
cd backend

# Instale as dependências
pip install -r requirements.txt

# Execute as migrações (opcional durante a manutenção)
alembic upgrade head

# Inicie o servidor (opcional durante a manutenção)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Nota: O frontend continuará funcionando sem o backend,
# mas com funcionalidades limitadas (apenas Pokédex)
```

### 3️⃣ Configure o Frontend

```bash
# Navegue até a pasta do frontend
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm start

# Alternativamente, você pode usar
# ionic serve
```

### 4️⃣ Acesse a Aplicação

#### 🌐 Frontend (Funcional)
- **URL**: [http://localhost:8100](http://localhost:8100)
- **Funcionalidades disponíveis**:
  - Pokédex completa
  - Busca e filtros de Pokémon
  - Visualização detalhada
- **Observação**: Dados mockados para visualização

#### ⚙️ Backend (Em Manutenção)
- **URL**: [http://localhost:8000](http://localhost:8000)
- **Status**: Sistema de autenticação em atualização
- **Endpoints protegidos**: Temporariamente indisponíveis

#### 📚 Documentação da API
- **URL**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Status**: Parcialmente disponível
- **Observação**: Algumas rotas podem não estar funcionando durante a manutenção

### 🚀 Início Rápido

```bash
# Método rápido - usar o script interativo (se disponível)
if [ -f "./scripts/deployment/quick-start.sh" ]; then
    chmod +x ./scripts/deployment/quick-start.sh
    ./scripts/deployment/quick-start.sh
else
    echo "Script quick-start.sh não encontrado. Prosseguindo com a instalação manual..."
fi

# Ou configurar manualmente
if [ -d "./scripts" ] && [ -f "./scripts/setup-workspace.sh" ]; then
    chmod +x ./scripts/setup-workspace.sh
    ./scripts/setup-workspace.sh
fi
```

### 🎯 Configuração do VS Code

```bash
# Abrir o workspace configurado no VS Code
if [ -f "PokeAPIApp.code-workspace" ]; then
    code PokeAPIApp.code-workspace
else
    echo "Arquivo de workspace não encontrado. Abrindo o diretório atual..."
    code .
fi
```

---

## 📱 Build para Mobile

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ e npm
- [Ionic CLI](https://ionicframework.com/docs/cli) instalado globalmente
- Para Android:
  - [Android Studio](https://developer.android.com/studio) instalado
  - Variáveis de ambiente do Android SDK configuradas
- Para iOS (apenas em macOS):
  - [Xcode](https://developer.apple.com/xcode/) instalado
  - CocoaPods instalado (`sudo gem install cocoapods`)

### Android

```bash
# Navegue até o diretório do frontend
cd frontend

# Instale as dependências do projeto
npm install

# Adicione a plataforma Android ao projeto
ionic capacitor add android

# Construa o aplicativo
ionic capacitor build android

# Abra o projeto no Android Studio
ionic capacitor open android

# Para executar em um dispositivo ou emulador conectado
# ionic capacitor run android
```

### iOS

```bash
# Navegue até o diretório do frontend
cd frontend

# Instale as dependências do projeto
npm install

# Adicione a plataforma iOS ao projeto
ionic capacitor add ios

# Instale as dependências do iOS
cd ios/App
pod install
cd ../..

# Construa o aplicativo
ionic capacitor build ios

# Abra o projeto no Xcode
ionic capacitor open ios

# Para executar em um simulador ou dispositivo iOS conectado
# ionic capacitor run ios
```

### Observações Importantes

- Certifique-se de que seu ambiente de desenvolvimento esteja corretamente configurado antes de tentar construir o aplicativo
- Para iOS, é necessário um Mac com Xcode instalado
- O aplicativo pode ser executado em emuladores/dispositivos físicos para testes
- Consulte a [documentação do Ionic](https://ionicframework.com/docs) para solução de problemas específicos de plataforma

---
## 🧪 Testes

### Pré-requisitos

- Node.js 18+ e npm instalados
- Python 3.9+ e pip instalados
- Dependências do projeto instaladas (frontend e backend)
- Ambiente virtual Python ativado (recomendado)

### Backend

O backend utiliza o framework de testes `pytest` para testes unitários e de integração, juntamente com `pytest-cov` para cobertura de código.

#### Executando todos os testes

```bash
# Navegue até o diretório do backend
cd backend

# Instale as dependências de desenvolvimento (se ainda não instaladas)
pip install -r requirements-dev.txt

# Execute todos os testes com cobertura
pytest tests/ -v --cov=app --cov-report=term --cov-report=html

# Abra o relatório de cobertura no navegador
start htmlcov/index.html  # Windows
# ou
xdg-open htmlcov/index.html  # Linux
# ou
open htmlcov/index.html  # macOS
```

#### Opções úteis

```bash
# Executar testes específicos
pytest tests/test_models.py -v
pytest tests/test_routes/ -v

# Executar testes com cobertura mínima (80%)
pytest --cov=app --cov-fail-under=80 tests/

# Executar testes com relatório detalhado
pytest -v --tb=long --cov=app --cov-report=term-missing
```

#### Testes de API

Para testar os endpoints da API, você pode usar o `TestClient` do FastAPI ou ferramentas como Postman/Insomnia.

### Frontend

O frontend utiliza o framework de testes do Angular (Jasmine + Karma) para testes unitários e o Cypress para testes de integração.

#### Testes Unitários

```bash
# Navegue até o diretório do frontend
cd frontend

# Instale as dependências (se ainda não instaladas)
npm install

# Execute os testes unitários
ng test

# Executar testes em modo watch
ng test --watch=true
```

#### Testes de Integração (Cypress)

```bash
# Instale o Cypress (se ainda não instalado)
npm install -g cypress

# Execute os testes de integração
ng e2e

# Ou execute o Cypress no modo interativo
npx cypress open
```

#### Testes de Acessibilidade

```bash
# Instale o pa11y (ferramenta de acessibilidade)
npm install -g pa11y

# Execute testes de acessibilidade
pa11y http://localhost:8100
```

#### Geração de Relatórios

```bash
# Gerar relatório de cobertura de testes
ng test --code-coverage

# Visualizar relatório de cobertura
start coverage/html/index.html  # Windows
# ou
xdg-open coverage/html/index.html  # Linux
# ou
open coverage/html/index.html  # macOS
```

### Testes de Performance

Para testar a performance da aplicação, você pode usar ferramentas como Lighthouse:

```bash
# Instale o Lighthouse globalmente
npm install -g lighthouse

# Execute o Lighthouse contra a aplicação
lighthouse http://localhost:8100 --view
```

### Testes em Pipeline CI/CD

O projeto inclui configurações para execução automatizada de testes em pipelines de CI/CD. Consulte os arquivos `.github/workflows` para mais detalhes.

```bash
cd frontend
ng test
ng e2e
```

---

## 📊 Status de Desenvolvimento

### Progresso Geral: 95% ✅

| Módulo | Status | Progresso |
|--------|--------|-----------|
|--------|--------|-----------|
| 🎨 UI/UX Design | ✅ Completo | 100% |
| 🏗️ Arquitetura | ✅ Completo | 100% |
| 📱 Frontend Core | ✅ Completo | 100% |
  - Implementado cooldown de 3 segundos entre usos para evitar spam de requisições
  - Reabertura automática: fecha modal atual e abre novo Pokémon aleatório
  - Animações visuais: pulso, rotação do ícone e contador visual durante cooldown
  - Estados visuais distintos (ativo/cooldown) com cores diferentes (warning/medium)
  - Traduções em PT-BR, EN-US e ES-ES para estado de espera ("Aguarde", "Wait", "Espera")
  - Limpeza adequada de intervals no ngOnDestroy para evitar memory leaks

- 📱 **[02/07/2025] Otimização Avançada dos Flavor Texts:**
  - Container de altura fixa (120px) para evitar reposicionamento dos controles de navegação
  - Sistema de scroll interno quando o texto excede a altura do container
  - Indicador visual animado com ícone e texto "Há mais texto" quando necessário
  - Auto-ocultação do indicador após scroll ou automaticamente em 3 segundos
  - Scrollbar customizada com estilo verde temático consistente com a interface
  - Reset automático da posição de scroll ao navegar entre flavors
  - Animações CSS: pulse contínuo e bounce no ícone do indicador

- 🐛 **[02/07/2025] Correções Críticas de Tradução:**
  - Integração com traduções locais (flavors_ptbr.json) via backend
  - Detecção inteligente de textos em inglês mesmo com lang=pt-BR
  - Fallback automático para arquivo local quando backend retorna inglês
  - Endpoint /static/flavors_ptbr.json adicionado no backend para servir traduções
  - Método isTextInPortuguese() para validação precisa de idioma
  - Logs detalhados para debugging de problemas de tradução
  - Correção do BrowserAnimationsModule no app.module.ts

- 🎨 **[01/07/2025] Modal de Detalhes - Refatoração Completa (v3.2.0):**
  - Header refatorado com layout lado a lado: imagem + informações centralizadas
  - Sistema de abas implementado: Visão Geral, Combate, Evolução, Curiosidades
  - Carrossel de imagens com miniaturas em linha (máximo 3 visíveis)
  - Informações básicas organizadas em duas seções centralizadas no header
  - Remoção de redundâncias entre header e abas para layout limpo
  - Sistema de tradução para stats, badges, habilidades e flavor texts
  - Navegação por teclado (setas, Tab, Escape) e acessibilidade completa
  - Animações de entrada/saída do modal e transições entre abas

- 🎨 **[29/06/2025] Sistema de Detalhes Finalizado:**
  - Carrossel de imagens com ordem correta: Artwork Oficial, Sprite Normal, Sprite Shiny, Costas Normal, Costas Shiny, Dream World, Home, Home Shiny
  - Navegação fluida: setas, swipe, thumbnails com loop infinito
  - Carrossel de descrições (flavor text) com filtro por idioma (PT-BR com fallback EN)
  - Contador de descrições (ex: 1/12) e navegação por setas
  - Visual premium: fundo gradiente escuro compatível com habilidades, glass effect, bordas arredondadas
  - Layout compacto e centralizado com espaçamento refinado
  - Responsividade aprimorada para diferentes orientações
  - Código limpo, modular e pronto para melhorias futuras

- 🚀 **[28/06/2025]** Sistema de ranking 100% finalizado e padronizado visualmente
  - Espaçamento dos cards do ranking igual ao das outras páginas
  - Responsividade e grid centralizado revisados
  - Documentação reorganizada: docs/ no backend e frontend
  - Novo: README_RANKING_SYSTEM detalhando funcionamento e arquitetura do ranking

- 🚀 **[27/06/2025]** Commit e push do progresso total do projeto até o momento

- 🚀 **[27/06/2025]** Estrutura pronta para reabilitar carregamento dos detalhes reais dos pokémons

- 🚀 **[27/06/2025]** Ranking agora carrega sem travar, exibindo placeholders enquanto aguarda detalhes dos pokémons

- 🚀 **[27/06/2025]** Template do ranking simplificado para evitar expressões complexas

- 🚀 **[27/06/2025]** Melhoria de performance e uso de cache para favoritos e imagens

- 🚀 **[27/06/2025]** Refatoração completa da página de ranking para evitar loop infinito no Angular

### 🏆 27/06/2025 - Novidades visuais no Ranking

- Pódio real animado para o Top 3 (coroa, medalhas, destaque visual)
- Badges de posição e contagem de capturas integrados aos cards
- Grid responsivo e centralizado para os demais Pokémons
- Título criativo com ícone, gradiente e espaçamento aprimorado
  - Alinhamento refinado e visual moderno, sem afetar outras páginas
  - Para customizar o visual do ranking, edite apenas os arquivos:
    - `frontend/src/app/pages/ranking/ranking.page.html`
    - `frontend/src/app/pages/ranking/ranking.page.scss`

## ⚠️ Pendências (26/06/2025)

- Ajuste do backend do ranking global para integração completa
- Build do frontend validado e funcionando sem erros após remoção da página de favoritos
- Garantido que não há mais referências a FavoritesPage em rotas, menu ou outros pontos do projeto

## 🛠️ 26/06/2025 - Refatoração do Frontend

- Padronização visual
- Melhorias na responsividade
- Integração com backend FastAPI para ranking global/local
- Sincronização de capturas e favoritos

- 🛡️ **[26/06/2025]** Página de favoritos desativada e removida dos módulos do frontend para build limpo

- 🛠️ **[23/06/2025]** Correção de labels e menus para uso de chaves minúsculas e com ponto

- 📝 **[23/06/2025]** Atualização do plano de melhorias e README

- 🖼️ **[23/06/2025]** Substituição do logo do menu lateral por Pokédex em alta definição

- 🏷️ **[23/06/2025]** Adição de todas as chaves de tradução faltantes nas páginas principais e configurações

- 🌍 **[23/06/2025]** Padronização e cobertura total de i18n (títulos, menus, labels, botões)

### 🎯 **30/06/2025 - Sistema de Idiomas para Flavors**
- ✅ **Implementado sistema inteligente de idiomas para descrições**
- ✅ **PT-BR/EN**: Flavors em inglês (fallback otimizado)
- ✅ **ES**: Flavors em espanhol quando disponível, senão inglês
- ✅ **Indicador visual**: Badge mostrando idioma atual (EN/ES)
- ✅ **Integração completa**: TranslateService + SettingsService
- ✅ **Estilos premium**: Language badge com cores diferenciadas
- ✅ **Responsivo**: Adaptado para todos os dispositivos

### 🎯 **30/06/2025 - Sistema de Detalhes Premium Finalizado**
- ✅ **Carrossel de Imagens**: Navegação fluida com suporte a shiny/normal
- ✅ **Carrossel de Descrições**: Filtro por idioma com navegação intuitiva
- ✅ **Layout Premium**: Glass effect, gradientes dinâmicos, visual moderno
- ✅ **Responsividade**: Adaptado para diferentes orientações de dispositivos
- ✅ **Navegação por Gestos**: Suporte a touch e mouse
- ✅ **Animações Suaves**: Transições fluidas e profissionais

### 🎯 **29/06/2025 - Sistema de Ranking Implementado**
- ✅ **Ranking Global**: Sistema completo de pontuação
- ✅ **API de Ranking**: Endpoints funcionais no backend
- ✅ **Interface de Ranking**: Visualização moderna dos dados
- ✅ **Sincronização**: Integração com sistema de captura
- ✅ **Estatísticas**: Métricas detalhadas de performance

### 🎯 **28/06/2025 - Sistema de Captura Finalizado**
- ✅ **Captura de Pokémon**: Funcionalidade completa implementada
- ✅ **Lista de Capturados**: Visualização e gerenciamento
- ✅ **Sincronização**: Sistema de sync com backend
- ✅ **Estatísticas**: Contadores e métricas detalhadas
- ✅ **Export/Import**: Funcionalidades de backup

### 🎯 **27/06/2025 - Internacionalização (i18n)**
- ✅ **Suporte a 3 Idiomas**: PT-BR, EN, ES
- ✅ **Traduções Completas**: Todas as interfaces traduzidas
- ✅ **Música por Idioma**: Tracks diferentes por idioma
- ✅ **Configurações**: Sistema de configurações por usuário

### 🎯 **26/06/2025 - Interface e UX Premium**
- ✅ **Design Responsivo**: Adaptado para mobile
- ✅ **Tema Escuro/Claro**: Implementado com transições
- ✅ **Animações**: Transições suaves e profissionais
- ✅ **Loading States**: Estados de carregamento elegantes
- ✅ **Error Handling**: Tratamento de erros robusto

### 🎯 **25/06/2025 - Backend API**
- ✅ **API REST**: Endpoints funcionais e documentados
- ✅ **Banco de Dados**: SQLite com SQLAlchemy
- ✅ **Autenticação**: Sistema de autenticação seguro
- ✅ **Validação**: Schemas com Pydantic
- ✅ **Testes**: Testes unitários e de integração

### 🎯 **24/06/2025 - Estrutura Base**
- ✅ **Projeto Ionic + Angular**: Estrutura inicial
- ✅ **Integração PokeAPI**: Serviços de dados
- ✅ **Componentes Base**: Cards, loading, modais
- ✅ **Roteamento**: Navegação entre páginas
- ✅ **Configuração**: Ambiente de desenvolvimento

</details>

## Novidades no Ranking (2025)

- Pódio real animado para o Top 3 (coroa, medalhas, destaque visual)
- Badges de posição e contagem de capturas integrados aos cards
- Grid responsivo e centralizado para os demais Pokémons
- Título criativo com ícone, gradiente e espaçamento aprimorado
- Alinhamento refinado e visual moderno, sem afetar outras páginas

### Customização do Ranking

Para customizar o visual do ranking, edite apenas os arquivos:
  - `frontend/src/app/pages/ranking/ranking.page.html`
  - `frontend/src/app/pages/ranking/ranking.page.scss`

---

## 🚀 Deploy e Banco de Dados

### 🏗️ Deploy no Render
O projeto está configurado para deploy automático no Render com as seguintes características:

- **Backend**: https://pokeapi-la6k.onrender.com
## Links Importantes

- **Frontend**: [https://pokeapi-frontend.onrender.com](https://pokeapi-frontend.onrender.com)
- **Banco de Dados**: SQLite criado vazio no deploy


## 🗄️ Estratégia de Banco de Dados

**⚠️ IMPORTANTE**: O banco de dados é criado **vazio** em cada deploy e alimentado apenas pelo frontend:


1. **Deploy**: Banco criado com estruturas de tabelas vazias
2. **Uso**: Dados são adicionados conforme usuários interagem
3. **Redeploy**: Banco é limpo e recriado vazio

### 🔄 Comunicação Frontend-Backend

O frontend utiliza um sistema de sincronização automática:

- **Capturas locais**: Armazenadas no Ionic Storage
- **Sincronização**: Fila automática que envia dados para o backend
- **Endpoint de sync**: `/api/v1/sync-capture/` processa as ações
- **Ranking dinâmico**: Atualizado automaticamente com base nas capturas

**Fluxo de sincronização:**
1. Usuário captura/remove Pokémon
2. Ação é salva localmente
3. Ação é adicionada à fila de sincronização
4. SyncService envia para o backend automaticamente
5. Ranking é atualizado em tempo real

### 🔧 Scripts de Validação

```bash
# Validar se deploy está correto (banco vazio)
python validate_deploy.py

# Limpar banco antes do deploy
python clean_database.py

# Testar comunicação frontend-backend (abrir em navegador)
# Arquivo: test_sync_communication.html
```

### 📋 Verificação de Status

```bash
# Verificar status do banco em produção
curl https://pokeapi-la6k.onrender.com/api/database-status

# Testar endpoint de sincronização
curl -X POST https://pokeapi-la6k.onrender.com/api/v1/sync-capture/ \
  -H "Content-Type: application/json" \
  -d '{"pokemonId":25,"action":"capture","timestamp":1625097600000,"payload":{"pokemonName":"pikachu","removed":false}}'
```

**Resposta esperada no deploy limpo:**
```json
{
  "message": "Status do banco de dados",
  "status": "success",
  "data": {
    "users": 0,
    "rankings": 0,
    "is_empty": true
  }
}
```

📖 **Documentação completa**: Ver [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)

---

## 🤝 Contribuição

Este é um projeto em desenvolvimento ativo! Contribuições são bem-vindas:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/nova-feature`)
3. **Commit** suas mudanças (`git commit -m 'Add: nova feature'`)
4. **Push** para a branch (`git push origin feature/nova-feature`)
5. Abra um **Pull Request**

### Convenções de Commit
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**David Assef**
- GitHub: [@davidassef](https://github.com/davidassef)
- Repositório: [PokeAPI](https://github.com/davidassef/PokeAPI)
- LinkedIn: [David Assef](https://www.linkedin.com/in/david-assef-carneiro-2a2891b9/)

---

## 🙏 Agradecimentos

- [PokéAPI](https://pokeapi.co/) - API de dados Pokémon
- [Ionic Team](https://ionicframework.com/) - Framework incrível
- [FastAPI](https://fastapi.tiangolo.com/) - Framework Python moderno
- [Render](https://render.com/) - Plataforma de deploy
- Comunidade open source ❤️

---

## 🚀 Deploy e Produção

### 🌐 **Aplicação em Produção**
- **Frontend**: [https://pokeapi-frontend.onrender.com](https://pokeapi-frontend.onrender.com)
- **Backend API**: [https://pokeapi-la6k.onrender.com](https://pokeapi-la6k.onrender.com)
- **Health Check**: [https://pokeapi-la6k.onrender.com/health](https://pokeapi-la6k.onrender.com/health)
- **API Docs**: [https://pokeapi-la6k.onrender.com/docs](https://pokeapi-la6k.onrender.com/docs)

### ⚙️ **Configuração**
- **Deploy automático** via GitHub integration
- **CORS** configurado para comunicação segura
- **Database SQLite** persistente
- **Build otimizado** para produção

---

<div align="center">

**⭐ Se este projeto te ajudou, considere dar uma estrela!**

[![GitHub stars](https://img.shields.io/github/stars/davidassef/PokeAPI?style=social)](https://github.com/davidassef/PokeAPI/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/davidassef/PokeAPI?style=social)](https://github.com/davidassef/PokeAPI/network/members)

*Feito com ❤️ e muito ☕*

</div>
