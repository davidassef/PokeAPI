# PokeAPI App - Documentação Completa

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Frontend (Ionic + Angular)](#frontend-ionic--angular)
- [Backend (FastAPI)](#backend-fastapi)
- [Funcionalidades](#funcionalidades)
- [APIs e Integração](#apis-e-integração)
- [Deployment](#deployment)

## 🎯 Visão Geral

O **PokeAPI App** é uma aplicação Pokédex completa e moderna que permite aos usuários:
- Explorar informações detalhadas de Pokémons
- Gerenciar favoritos com persistência
- Competir em rankings globais
- Personalizar a experiência (tema, idioma, música)
- Capturar Pokémons com animações épicas

### Stack Tecnológica
- **Frontend**: Ionic 7 + Angular 17 + TypeScript
- **Backend**: FastAPI + Python + SQLAlchemy
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **APIs**: PokeAPI v2 para dados dos Pokémons
- **PWA**: Service Workers, offline support

## 🏗️ Arquitetura

### Frontend (Modular)
```
src/
├── app/
│   ├── components/          # Componentes reutilizáveis
│   ├── pages/              # Páginas principais (Home, Details, etc)
│   ├── services/           # Serviços Angular (API, estado, etc)
│   ├── models/             # Interfaces TypeScript
│   ├── utils/              # Utilitários
│   ├── data/               # Dados estáticos (traduções)
│   └── poke-ui/            # Sistema de design personalizado
├── assets/                 # Recursos estáticos
├── styles/                 # SCSS globais
└── environments/           # Configurações de ambiente
```

### Backend (Clean Architecture)
```
backend/
├── main.py                 # FastAPI app principal
├── models.py              # Modelos SQLAlchemy
├── schemas.py             # Schemas Pydantic
├── database.py            # Configuração do DB
└── requirements.txt       # Dependências Python
```

## 📱 Frontend (Ionic + Angular)

### Componentes Principais

#### 🏠 Home Page
- **Busca inteligente** com filtros por tipo, geração
- **Lista virtual** para performance com milhares de Pokémons
- **Player musical** persistente com trilhas temáticas
- **Favoritos** com acesso rápido

#### 🔍 Details Page  
- **Informações completas**: stats, tipos, habilidades, evoluções
- **Animação de captura** com efeitos visuais e sonoros
- **Sistema de favoritos** integrado
- **Navegação por relacionados**

#### ⭐ Favorites Page
- **Gerenciamento completo** dos favoritos
- **Ordenação** por nome, tipo, data de adição
- **Remoção** com confirmação
- **Estado vazio** com call-to-action

#### 🏆 Ranking Page
- **Podium** dos top 3 usuários
- **Lista completa** com estatísticas
- **Atualização em tempo real**
- **Comparação de desempenho**

#### ⚙️ Settings Page
- **Multilíngue**: PT-BR, EN-US, ES-ES
- **Temas**: claro/escuro com persistência
- **Audio**: controle de volume e trilhas
- **Limpeza de dados** com confirmação

### Serviços Angular

#### 🔗 PokemonService
```typescript
// Integração com PokeAPI
getPokemon(id: number): Observable<Pokemon>
searchPokemon(query: string): Observable<Pokemon[]>
getPokemonsByType(type: string): Observable<Pokemon[]>
```

#### ⭐ FavoritesService  
```typescript
// Gerenciamento de favoritos
addFavorite(pokemon: Pokemon): void
removeFavorite(pokemonId: number): void
getFavorites(): Observable<Pokemon[]>
isFavorite(pokemonId: number): boolean
```

#### 🎵 MusicPlayerService
```typescript
// Player musical global
playTrack(trackId: string): void
setVolume(volume: number): void
togglePlayPause(): void
getCurrentTrack(): Observable<Track>
```

#### 🎨 ThemeService
```typescript
// Sistema de temas
setTheme(theme: 'light' | 'dark'): void
getCurrentTheme(): Observable<string>
initializeTheme(): void
```

### Sistema de Tradução

#### Estrutura Multilíngue
```typescript
// app-translations.data.ts
export const APP_TRANSLATIONS = {
  'pt-BR': {
    home: { title: 'Pokédex', search: 'Buscar Pokémon...' },
    details: { stats: 'Estatísticas', capture: 'Capturar' }
  },
  'en-US': {
    home: { title: 'Pokédex', search: 'Search Pokémon...' },
    details: { stats: 'Stats', capture: 'Capture' }
  }
};
```

#### Pipe de Tradução
```typescript
// translate.pipe.ts
@Pipe({ name: 'translate' })
export class TranslatePipe implements PipeTransform {
  transform(key: string, params?: any): string {
    // Lógica de tradução dinâmica
  }
}
```

### Design System (Poke-UI)

#### Tokens de Design
```scss
// design-tokens.scss
:root {
  --poke-primary: #3b82f6;
  --poke-secondary: #ef4444;
  --poke-success: #10b981;
  
  // Type colors
  --type-fire: #ff6b35;
  --type-water: #3b82f6;
  --type-grass: #10b981;
}
```

#### Componentes Reutilizáveis
- **PokemonCard**: Card responsivo com lazy loading
- **CaptureAnimation**: Animação de captura com partículas
- **TypeBadge**: Badge de tipo com cores dinâmicas
- **StatBar**: Barra de estatística animada

## 🖥️ Backend (FastAPI)

### Estrutura de Dados

#### Modelos SQLAlchemy
```python
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True)
    email = Column(String(100), unique=True)
    created_at = Column(DateTime, default=datetime.now)
    favorites = relationship("FavoritePokemon", back_populates="user")

class FavoritePokemon(Base):
    __tablename__ = "favorite_pokemons"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    pokemon_id = Column(Integer)
    pokemon_name = Column(String(100))
    added_at = Column(DateTime, default=datetime.now)
```

#### Schemas Pydantic
```python
class UserCreate(BaseModel):
    username: str
    email: EmailStr

class FavoritePokemonResponse(BaseModel):
    id: int
    pokemon_id: int
    pokemon_name: str
    added_at: datetime
```

### Endpoints da API

#### 👤 Usuários
- `POST /users` - Criar usuário
- `GET /users/{id}` - Buscar usuário
- `GET /users/{id}/profile` - Perfil completo

#### ⭐ Favoritos
- `POST /users/{id}/favorites` - Adicionar favorito
- `GET /users/{id}/favorites` - Listar favoritos
- `DELETE /users/{id}/favorites/{pokemon_id}` - Remover favorito

#### 🏆 Ranking
- `GET /ranking` - Top usuários por favoritos
- `GET /stats` - Estatísticas gerais
- `GET /pokemon-stats` - Pokémons mais favoritados

### Integração com PokeAPI

```python
async def get_pokemon_data(pokemon_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}")
        return response.json() if response.status_code == 200 else None
```

## 🎮 Funcionalidades

### 🔍 Busca e Exploração
- **Busca inteligente** por nome, ID ou tipo
- **Filtros avançados** por geração, tipo, habilidade
- **Lazy loading** para performance
- **Cache inteligente** de dados da API

### ⭐ Sistema de Favoritos
- **Adição/remoção** rápida com feedback visual
- **Persistência local** + sincronização backend
- **Ordenação** por critérios variados
- **Backup automático** dos favoritos

### 🏆 Ranking Global
- **Competição** baseada em número de favoritos
- **Podium** destacado para top 3
- **Estatísticas** de usuários ativos
- **Atualização** em tempo real

### 🎵 Player Musical
- **Trilhas temáticas** por idioma
- **Controle global** independente da navegação
- **Persistência** de estado entre sessões
- **Controle de volume** granular

### 🎨 Personalização
- **Temas**: claro/escuro com transições suaves
- **Idiomas**: PT-BR, EN-US, ES-ES completos
- **Acessibilidade**: suporte a leitores de tela
- **Responsividade**: mobile-first design

### 📱 PWA (Progressive Web App)
- **Instalação** como app nativo
- **Offline support** para favoritos
- **Push notifications** (futuro)
- **Service workers** para cache

## 🔌 APIs e Integração

### PokeAPI v2
```typescript
// Endpoints utilizados
GET /api/v2/pokemon/{id}           // Dados básicos
GET /api/v2/pokemon-species/{id}   // Dados de espécie
GET /api/v2/evolution-chain/{id}   // Cadeia evolutiva
GET /api/v2/type/{type}            // Pokémons por tipo
```

### Cache Strategy
```typescript
// Estratégia de cache em camadas
1. Memory cache (Angular services)
2. IndexedDB (persistência local)
3. HTTP cache (service workers)
4. API cache (PokeAPI CDN)
```

## 🚀 Deployment

### Frontend (Ionic)
```bash
# Build para produção
npm run build:prod

# Deploy para Capacitor (mobile)
npx cap add ios
npx cap add android
npx cap run ios/android
```

### Backend (FastAPI)
```bash
# Local development
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production (Docker)
docker build -t pokeapi-backend .
docker run -p 8000:8000 pokeapi-backend
```

### Variáveis de Ambiente
```bash
# Frontend (.env)
IONIC_ENV=production
API_BASE_URL=https://api.pokeapi-app.com

# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost/pokedb
SECRET_KEY=your-secret-key
CORS_ORIGINS=https://pokeapi-app.com
```

## 🧪 Testing

### Frontend (Angular)
```bash
# Unit tests
npm run test

# E2E tests
npm run e2e

# Coverage
npm run test:coverage
```

### Backend (FastAPI)
```bash
# Pytest
pytest tests/

# With coverage
pytest --cov=app tests/
```

## 📊 Performance

### Métricas Alvo
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1

### Otimizações
- **Lazy loading** de imagens e componentes
- **Virtual scrolling** para listas grandes
- **Tree shaking** automático
- **Compression** gzip/brotli
- **CDN** para assets estáticos

## 🔒 Segurança

### Frontend
- **CSP headers** configurados
- **XSS protection** via sanitização
- **HTTPS only** em produção

### Backend
- **Input validation** via Pydantic
- **SQL injection** prevenção via ORM
- **CORS** configurado adequadamente
- **Rate limiting** implementado

---

**Versão**: 1.0.0  
**Última atualização**: Dezembro 2024  
**Mantido por**: PokeAPI App Team
