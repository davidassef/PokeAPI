# 🚀 PokeAPIApp

🗓️ Última atualização: 09/07/2025

[![Status](https://img.shields.io/badge/Status-Em%20Manutenção-yellow?style=for-the-badge)](https://github.com/davidassef/PokeAPI)
[![Frontend](https://img.shields.io/badge/Frontend-Ionic%20+%20Angular-blue?style=for-the-badge&logo=ionic)](https://ionicframework.com/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-red?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)

---

## 🎯 Sobre o Projeto

Aplicativo full-stack para explorar o mundo Pokémon, com Pokédex completa, favoritos, ranking, internacionalização e interface responsiva.  
Frontend em Ionic + Angular, backend em FastAPI.

---

## 📸 Demonstração Visual

<div align="center">

| Home (Pokédex) | Detalhes do Pokémon | Ranking |
|:-------------:|:------------------:|:-------:|
| ![Home](frontend/src/assets/img/Home-Web.png) | ![Detalhes](frontend/src/assets/img/Modal-Details-Web.png) | ![Ranking](frontend/src/assets/img/Ranking-Web.png) |

</div>

---

## 🌐 Acesse o App Online

> Teste a versão mais recente do frontend em produção:
>
> [https://pokeapi-frontend.onrender.com](https://pokeapi-frontend.onrender.com)

---

## ✨ Funcionalidades

### ✅ Implementadas
- 🏠 Página Home com busca e filtros
- 🔍 Detalhes completos dos Pokémon
- ⭐ Sistema de favoritos
- 🏆 Ranking dos mais populares
- ⚙️ Configurações de idioma e tema
- 🎵 Player musical integrado
- 🌐 Internacionalização (PT, EN, ES)
- 📱 Design responsivo

### 🚧 Em Desenvolvimento
- 🔐 Sistema de autenticação
- 📊 Dashboard Analytics
- 🔄 Sincronização avançada
- 🧪 Testes E2E

### 🎯 Próximas Features
- 🎮 Mini-games e conquistas
- 📈 Comparador de stats
- 🗺️ Mapa interativo

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+, npm
- Python 3.11+
- Git

### 1️⃣ Clone o repositório
```bash
git clone https://github.com/davidassef/PokeAPI.git
cd PokeAPI
```

### 2️⃣ Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3️⃣ Frontend
```bash
cd frontend
npm install
npm start
```

Acesse: [http://localhost:8100](http://localhost:8100)

> ⚠️ Algumas funcionalidades podem estar em manutenção. Veja detalhes na documentação.

---

## 📁 Estrutura do Projeto

```
PokeAPIApp/
├── backend/      # API, banco, scripts e testes backend
├── frontend/     # App Ionic/Angular, assets e testes frontend
├── scripts/      # Scripts de automação e deploy
├── config/       # Configurações de ambiente/deploy
├── docs/         # Documentação detalhada
└── tests/        # Testes end-to-end integrados
```

---

## 🛠️ Tecnologias

- **Frontend:** Ionic 8, Angular 17, TypeScript, SCSS, RxJS, ngx-translate
- **Backend:** FastAPI, SQLAlchemy, SQLite, Pydantic, Uvicorn
- **Testes:** Pytest, Coverage, Jasmine, Karma, Cypress
- **Mobile:** Capacitor, Android Studio, Xcode

---

## 🤝 Contribuição

Contribuições são bem-vindas!  
Veja as instruções em [docs/README.md](docs/README.md).

---

## 📄 Licença

MIT. Veja o arquivo [LICENSE](LICENSE).

---

## 👨‍💻 Autor

**David Assef**  
[GitHub](https://github.com/davidassef) | [LinkedIn](https://www.linkedin.com/in/david-assef-carneiro-2a2891b9/)

---

> Para detalhes técnicos, deploy, banco de dados e changelog, consulte a documentação em `/docs`.
