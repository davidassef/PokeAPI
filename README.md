# 🚀 PokeAPIApp - Aplicativo Pokémon Full-Stack

<div align="center">

[![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=for-the-badge)](https://github.com/davidassef/PokeAPI)
[![Frontend](https://img.shields.io/badge/Frontend-Ionic%20+%20Angular-blue?style=for-the-badge&logo=ionic)](https://ionicframework.com/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-green?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Database](https://img.shields.io/badge/Database-SQLite-orange?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)

**🎯 Um aplicativo moderno e completo para explorar o mundo Pokémon!**

*Integração com PokéAPI • Interface Responsiva • Sistema de Favoritos • Multiplataforma*

</div>

---

## 📱 Sobre o Projeto

O **PokeAPIApp** é uma aplicação full-stack moderna que permite aos usuários explorar, favoritar e conhecer detalhes sobre Pokémon através de uma interface intuitiva e responsiva. O projeto combina as melhores tecnologias web e mobile para oferecer uma experiência excepcional.

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

### Frontend (Ionic + Angular)
```
frontend/
├── src/app/
│   ├── core/           # Serviços principais
│   ├── shared/         # Componentes e pipes reutilizáveis
│   ├── pages/          # Páginas da aplicação
│   ├── models/         # Modelos TypeScript
│   └── assets/         # Recursos estáticos
```

### Backend (FastAPI + SQLAlchemy)
```
backend/
├── app/
│   ├── core/           # Configurações e database
│   ├── models/         # Modelos SQLAlchemy
│   ├── routes/         # Endpoints da API
│   ├── schemas/        # Esquemas Pydantic
│   └── services/       # Lógica de negócio
```

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
- [x] 🔍 **Página de Detalhes** - Informações completas com stats animados
- [x] ⭐ **Sistema de Capturas (Favoritos)** - Adicionar/remover favoritos
- [x] ⚙️ **Configurações** - Troca de idioma e tema
- [x] 🎵 **Player Musical** - Música ambiente persistente
- [x] 📱 **Design Responsivo** - Adaptável a todos os dispositivos
- [x] 🌐 **Internacionalização** - Português, Inglês e Espanhol
- [x] 🎨 **Componentes Reutilizáveis** - Pokemon Card, Loading Spinner, etc.
- [x] 🔧 **Backend API** - Endpoints para usuários, favoritos e ranking
- [x] 🏆 **Página de Ranking** - Pokémon mais populares (carregamento otimizado, aguardando detalhes finais dos pokémons)

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

### Pré-requisitos
- Node.js 18+ e npm
- Python 3.11+
- Git

### 1️⃣ Clone o Repositório
```bash
git clone https://github.com/davidassef/PokeAPI.git
cd PokeAPI
```

### 2️⃣ Configure o Backend
```bash
cd backend

# Instale as dependências
pip install -r requirements.txt

# Execute as migrações
alembic upgrade head

# Inicie o servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3️⃣ Configure o Frontend
```bash
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
ionic serve
```

### 4️⃣ Acesse a Aplicação
- **Frontend**: http://localhost:8100
- **Backend API**: http://localhost:8000
- **Documentação API**: http://localhost:8000/docs

---

## 📱 Build para Mobile

### Android
```bash
cd frontend
ionic capacitor add android
ionic capacitor build android
ionic capacitor open android
```

### iOS
```bash
cd frontend
ionic capacitor add ios
ionic capacitor build ios
ionic capacitor open ios
```

---

## 🧪 Testes

### Backend
```bash
cd backend
pytest tests/ -v --cov=app --cov-report=html
```

### Frontend
```bash
cd frontend
ng test
ng e2e
```

---

## 📊 Status de Desenvolvimento

### Progresso Geral: 80% ✅

| Módulo | Status | Progresso |
|--------|--------|-----------|
| 🎨 UI/UX Design | ✅ Completo | 100% |
| 🏗️ Arquitetura | ✅ Completo | 100% |
| 📱 Frontend Core | ✅ Completo | 95% |
| 🔧 Backend API | ✅ Completo | 90% |
| 🧪 Testes | 🚧 Em andamento | 60% |
| 📱 Mobile Build | 🚧 Em andamento | 40% |
| 🌐 Deploy | ⏳ Pendente | 0% |

### Últimas Atualizações

<details>
<summary><strong>📋 Clique para expandir o histórico completo de atualizações</strong></summary>

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

- 🏆 **[27/06/2025] Novidades visuais no Ranking:**
  - Pódio real animado para o Top 3 (coroa, medalhas, destaque visual)
  - Badges de posição e contagem de capturas integrados aos cards
  - Grid responsivo e centralizado para os demais Pokémons
  - Título criativo com ícone, gradiente e espaçamento aprimorado
  - Alinhamento refinado e visual moderno, sem afetar outras páginas
  - Para customizar o visual do ranking, edite apenas os arquivos:
    - `frontend/src/app/pages/ranking/ranking.page.html`
    - `frontend/src/app/pages/ranking/ranking.page.scss`

- ⚠️ **[26/06/2025]** Pendente: ajuste do backend do ranking global para integração completa

- ✅ **[26/06/2025]** Build do frontend validado e funcionando sem erros após remoção da página de favoritos

- 🧹 **[26/06/2025]** Garantido que não há mais referências a FavoritesPage em rotas, menu ou outros pontos do projeto

- 🛠️ **[26/06/2025]** Refatoração do frontend: padronização visual, responsividade, integração real com backend FastAPI para ranking global/local e sincronização de capturas/favoritos

- 🛡️ **[26/06/2025]** Página de favoritos desativada e removida dos módulos do frontend para build limpo

- 🛠️ **[23/06/2025]** Correção de labels e menus para uso de chaves minúsculas e com ponto

- 📝 **[23/06/2025]** Atualização do plano de melhorias e README

- 🖼️ **[23/06/2025]** Substituição do logo do menu lateral por Pokédex em alta definição

- 🏷️ **[23/06/2025]** Adição de todas as chaves de tradução faltantes nas páginas principais e configurações

- 🌍 **[23/06/2025]** Padronização e cobertura total de i18n (títulos, menus, labels, botões)

</details>

## Novidades no Ranking (2025)

- Pódio real animado para o Top 3 (coroa, medalhas, destaque visual)
- Badges de posição e contagem de capturas integrados aos cards
- Grid responsivo e centralizado para os demais Pokémons
- Título criativo com ícone, gradiente e espaçamento aprimorado
- Alinhamento refinado e visual moderno, sem afetar outras páginas

### Customização do Ranking
- Para customizar o visual do ranking, edite apenas os arquivos:
  - `frontend/src/app/pages/ranking/ranking.page.html`
  - `frontend/src/app/pages/ranking/ranking.page.scss`

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
- Comunidade open source ❤️

---

<div align="center">

**⭐ Se este projeto te ajudou, considere dar uma estrela!**

[![GitHub stars](https://img.shields.io/github/stars/davidassef/PokeAPI?style=social)](https://github.com/davidassef/PokeAPI/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/davidassef/PokeAPI?style=social)](https://github.com/davidassef/PokeAPI/network/members)

*Feito com ❤️ e muito ☕*

</div>
