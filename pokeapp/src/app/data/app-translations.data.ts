// 🌐 Application Translations Data
// Dados de tradução centralizados para interface do usuário

export const APP_TRANSLATIONS: Record<string, Record<string, string>> = {
  pt: {
    // Navegação
    'nav.back': 'Voltar',
    'nav.pokedex': 'Pokédex',
    'nav.favorites': 'Favoritos',
    'nav.settings': 'Configurações',
    'nav.language': 'Idioma',

    // Home
    'home.welcome': 'Bem-vindo ao PokéDex',
    'home.subtitle': 'Descubra e explore o mundo Pokémon',
    'home.pokemonCollection': 'Coleção Pokémon',
    'home.totalFound': 'encontrados',
    'home.showingResults': 'Mostrando resultados para',

    // Busca
    'search.placeholder': 'Buscar Pokémon...',
    'search.noResults': 'Nenhum resultado encontrado',
    'search.tryDifferentTerm': 'Tente um termo diferente',
    'search.clearSearch': 'Limpar busca',
    'search.resultsFor': 'Resultados para',

    // Loading
    'loading.title': 'Carregando...',
    'loading.subtitle': 'Buscando Pokémons incríveis',
    'loading.more': 'Carregando mais...',
    'loading.pokemon': 'Carregando Pokémons...',
    'loading.data': 'Carregando dados...',
    'loading.details': 'Carregando detalhes...',

    // Erros
    'error.loadingData': 'Erro ao carregar dados',
    'error.noConnection': 'Sem conexão com a internet',
    'error.tryAgain': 'Tentar novamente',
    'error.unexpected': 'Erro inesperado',
    'error.pokemonNotFound': 'Pokémon não encontrado',
    'error.loadingMore': 'Erro ao carregar mais dados',

    // Estados comuns
    'common.retry': 'Tentar novamente',
    'common.cancel': 'Cancelar',
    'common.ok': 'OK',
    'common.yes': 'Sim',
    'common.no': 'Não',
    'common.save': 'Salvar',
    'common.close': 'Fechar',
    'common.back': 'Voltar',
    'common.clear': 'Limpar',

    // Favoritos
    'favorites.title': 'Favoritos',
    'favorites.empty': 'Nenhum favorito ainda',
    'favorites.emptySubtitle': 'Adicione Pokémons aos seus favoritos',
    'favorites.addToFavorites': 'Adicionar aos favoritos',
    'favorites.removeFromFavorites': 'Remover dos favoritos',
    'favorites.added': 'Adicionado aos favoritos',
    'favorites.removed': 'Removido dos favoritos',

    // Detalhes
    'details.height': 'Altura',
    'details.weight': 'Peso',
    'details.type': 'Tipo',
    'details.abilities': 'Habilidades',
    'details.stats': 'Estatísticas',
    'details.evolution': 'Evolução',
    'details.notFound': 'Pokémon não encontrado',

    // Tipos
    'type.normal': 'Normal',
    'type.fire': 'Fogo',
    'type.water': 'Água',
    'type.electric': 'Elétrico',
    'type.grass': 'Planta',
    'type.ice': 'Gelo',
    'type.fighting': 'Lutador',
    'type.poison': 'Venenoso',
    'type.ground': 'Terra',
    'type.flying': 'Voador',
    'type.psychic': 'Psíquico',
    'type.bug': 'Inseto',
    'type.rock': 'Pedra',
    'type.ghost': 'Fantasma',
    'type.dragon': 'Dragão',
    'type.dark': 'Sombrio',
    'type.steel': 'Aço',
    'type.fairy': 'Fada',

    // Filtros rápidos
    'filters.title': 'Filtros',
    'filters.favorites': 'Favoritos',
    'filters.legendary': 'Lendários',
    'filters.gen1': 'Geração 1',
    'filters.normal': 'Normal',
    'filters.fire': 'Fogo',
    'filters.water': 'Água',
    'filters.electric': 'Elétrico',
    'filters.grass': 'Grama',
    'filters.ice': 'Gelo',
    'filters.active': 'filtro ativo',
    'filters.clearAll': 'Limpar filtros',
    'filters.noResults': 'Nenhum resultado para o filtro',
    'filters.noResultsMessage': 'Tente outros filtros.',
    'filters.noResultsCombined': 'Nenhum resultado para busca e filtro',
    'filters.tryDifferentCriteria': 'Tente outros critérios.',
  },
  en: {
    // Navigation
    'nav.back': 'Back',
    'nav.pokedex': 'Pokédex',
    'nav.favorites': 'Favorites',
    'nav.settings': 'Settings',
    'nav.language': 'Language',

    // Home
    'home.welcome': 'Welcome to PokéDex',
    'home.subtitle': 'Discover and explore the Pokémon world',
    'home.pokemonCollection': 'Pokémon Collection',
    'home.totalFound': 'found',
    'home.showingResults': 'Showing results for',

    // Search
    'search.placeholder': 'Search Pokémon...',
    'search.noResults': 'No results found',
    'search.tryDifferentTerm': 'Try a different term',
    'search.clearSearch': 'Clear search',
    'search.resultsFor': 'Results for',

    // Loading
    'loading.title': 'Loading...',
    'loading.subtitle': 'Finding amazing Pokémon',
    'loading.more': 'Loading more...',
    'loading.pokemon': 'Loading Pokémon...',
    'loading.data': 'Loading data...',
    'loading.details': 'Loading details...',

    // Errors
    'error.loadingData': 'Error loading data',
    'error.noConnection': 'No internet connection',
    'error.tryAgain': 'Try again',
    'error.unexpected': 'Unexpected error',
    'error.pokemonNotFound': 'Pokémon not found',
    'error.loadingMore': 'Error loading more data',

    // Common states
    'common.retry': 'Try again',
    'common.cancel': 'Cancel',
    'common.ok': 'OK',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.save': 'Save',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.clear': 'Clear',

    // Favorites
    'favorites.title': 'Favorites',
    'favorites.empty': 'No favorites yet',
    'favorites.emptySubtitle': 'Add Pokémon to your favorites',
    'favorites.addToFavorites': 'Add to favorites',
    'favorites.removeFromFavorites': 'Remove from favorites',
    'favorites.added': 'Added to favorites',
    'favorites.removed': 'Removed from favorites',

    // Details
    'details.height': 'Height',
    'details.weight': 'Weight',
    'details.type': 'Type',
    'details.abilities': 'Abilities',
    'details.stats': 'Stats',
    'details.evolution': 'Evolution',
    'details.notFound': 'Pokémon not found',

    // Types
    'type.normal': 'Normal',
    'type.fire': 'Fire',
    'type.water': 'Water',
    'type.electric': 'Electric',
    'type.grass': 'Grass',
    'type.ice': 'Ice',
    'type.fighting': 'Fighting',
    'type.poison': 'Poison',
    'type.ground': 'Ground',
    'type.flying': 'Flying',
    'type.psychic': 'Psychic',
    'type.bug': 'Bug',
    'type.rock': 'Rock',
    'type.ghost': 'Ghost',
    'type.dragon': 'Dragon',
    'type.dark': 'Dark',
    'type.steel': 'Steel',
    'type.fairy': 'Fairy',

    // Quick Filters
    'filters.title': 'Filters',
    'filters.favorites': 'Favorites',
    'filters.legendary': 'Legendary',
    'filters.gen1': 'Gen 1',
    'filters.normal': 'Normal',
    'filters.fire': 'Fire',
    'filters.water': 'Water',
    'filters.electric': 'Electric',
    'filters.grass': 'Grass',
    'filters.ice': 'Ice',
    'filters.active': 'active filter',
    'filters.clearAll': 'Clear filters',
    'filters.noResults': 'No results for filter',
    'filters.noResultsMessage': 'Try other filters.',
    'filters.noResultsCombined': 'No results for search and filter',
    'filters.tryDifferentCriteria': 'Try different criteria.',
  },
  es: {
    // Navegación
    'nav.back': 'Atrás',
    'nav.pokedex': 'Pokédex',
    'nav.favorites': 'Favoritos',
    'nav.settings': 'Configuración',
    'nav.language': 'Idioma',

    // Inicio
    'home.welcome': 'Bienvenido a PokéDex',
    'home.subtitle': 'Descubre y explora el mundo Pokémon',
    'home.pokemonCollection': 'Colección Pokémon',
    'home.totalFound': 'encontrados',
    'home.showingResults': 'Mostrando resultados para',

    // Búsqueda
    'search.placeholder': 'Buscar Pokémon...',
    'search.noResults': 'No se encontraron resultados',
    'search.tryDifferentTerm': 'Prueba un término diferente',
    'search.clearSearch': 'Limpiar búsqueda',
    'search.resultsFor': 'Resultados para',

    // Carga
    'loading.title': 'Cargando...',
    'loading.subtitle': 'Buscando Pokémon incríveis',
    'loading.more': 'Cargando más...',
    'loading.pokemon': 'Cargando Pokémon...',
    'loading.data': 'Cargando dados...',
    'loading.details': 'Cargando detalhes...',

    // Errores
    'error.loadingData': 'Error al cargar dados',
    'error.noConnection': 'Sin conexión a internet',
    'error.tryAgain': 'Intentar de nuevo',
    'error.unexpected': 'Error inesperado',
    'error.pokemonNotFound': 'Pokémon no encontrado',
    'error.loadingMore': 'Error al cargar más datos',

    // Estados comuns
    'common.retry': 'Intentar de novo',
    'common.cancel': 'Cancelar',
    'common.ok': 'OK',
    'common.yes': 'Sí',
    'common.no': 'No',
    'common.save': 'Guardar',
    'common.close': 'Cerrar',
    'common.back': 'Atrás',
    'common.clear': 'Limpar',

    // Favoritos
    'favorites.title': 'Favoritos',
    'favorites.empty': 'Aún no hay favoritos',
    'favorites.emptySubtitle': 'Agrega Pokémon a tus favoritos',
    'favorites.addToFavorites': 'Agregar a favoritos',
    'favorites.removeFromFavorites': 'Quitar de favoritos',
    'favorites.added': 'Agregado a favoritos',
    'favorites.removed': 'Quitado de favoritos',

    // Detalles
    'details.height': 'Altura',
    'details.weight': 'Peso',
    'details.type': 'Tipo',
    'details.abilities': 'Habilidades',
    'details.stats': 'Estadísticas',
    'details.evolution': 'Evolución',
    'details.notFound': 'Pokémon no encontrado',

    // Tipos
    'type.normal': 'Normal',
    'type.fire': 'Fuego',
    'type.water': 'Agua',
    'type.electric': 'Eléctrico',
    'type.grass': 'Planta',
    'type.ice': 'Hielo',
    'type.fighting': 'Lucha',
    'type.poison': 'Veneno',
    'type.ground': 'Tierra',
    'type.flying': 'Volador',
    'type.psychic': 'Psíquico',
    'type.bug': 'Bicho',
    'type.rock': 'Roca',
    'type.ghost': 'Fantasma',
    'type.dragon': 'Dragón',
    'type.dark': 'Siniestro',
    'type.steel': 'Acero',
    'type.fairy': 'Hada',

    // Filtros rápidos
    'filters.title': 'Filtros',
    'filters.favorites': 'Favoritos',
    'filters.legendary': 'Legendarios',
    'filters.gen1': 'Generación 1',
    'filters.normal': 'Normal',
    'filters.fire': 'Fuego',
    'filters.water': 'Agua',
    'filters.electric': 'Eléctrico',
    'filters.grass': 'Hierba',
    'filters.ice': 'Hielo',
    'filters.active': 'filtro ativo',
    'filters.clearAll': 'Limpiar filtros',
    'filters.noResults': 'Sin resultados para el filtro',
    'filters.noResultsMessage': 'Prueba otros filtros.',
    'filters.noResultsCombined': 'Sin resultados para búsqueda y filtro',
    'filters.tryDifferentCriteria': 'Prueba otros criterios.',
  },
};
