import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocalizationService {
  private currentLanguageSubject = new BehaviorSubject<string>('pt');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();
  private translations: { [key: string]: { [key: string]: string } } = {
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
      'error.applyFilter': 'Erro ao aplicar filtro. Tente novamente',
      'error.changeFavorite': 'Erro ao alterar favorito',
      'error.loadingDetails': 'Erro ao carregar detalhes do Pokémon',
      'error.removeFavorite': 'Erro ao remover favorito',
      'error.noFavoritesToRemove': 'Não há favoritos para remover',

      // Estados comuns
      'common.refreshing': 'Atualizando...',
      'common.retry': 'Tentar novamente',
      'common.cancel': 'Cancelar',
      'common.ok': 'OK',
      'common.yes': 'Sim',
      'common.no': 'Não',
      'common.save': 'Salvar',
      'common.close': 'Fechar',
      'common.back': 'Voltar',
      'common.next': 'Próximo',
      'common.previous': 'Anterior',
      'common.clear': 'Limpar',
      'common.all': 'Todos',
      'common.none': 'Nenhum',

      // Favoritos
      'favorites.title': 'Favoritos',
      'favorites.viewAll': 'Ver todos',
      'favorites.empty': 'Nenhum favorito ainda',
      'favorites.emptySubtitle': 'Adicione Pokémons aos seus favoritos',      'favorites.addToFavorites': 'Adicionar aos favoritos',
      'favorites.removeFromFavorites': 'Remover dos favoritos',
      'favorites.added': 'Adicionado aos favoritos',
      'favorites.removed': 'Removido dos favoritos',
      'favorites.confirmRemove': 'Remover Favorito',
      'favorites.confirmRemoveMessage': 'Deseja remover {name} dos favoritos?',
      'favorites.confirmClearAll': 'Limpar Favoritos',
      'favorites.confirmClearAllMessage': 'Deseja remover todos os {count} Pokémons favoritos?',
      'favorites.removeButtonText': 'Remover',
      'favorites.clearAllButtonText': 'Limpar Tudo',

      // Filtros
      'filters.title': 'Filtros',
      'filters.clearAll': 'Limpar todos',
      'filters.active': 'filtros ativos',
      'filters.favorites': 'Favoritos',
      'filters.legendary': 'Lendários',
      'filters.gen1': 'Geração 1',
      'filters.fire': 'Fogo',
      'filters.water': 'Água',
      'filters.grass': 'Grama',
      'filters.electric': 'Elétrico',
      'filters.psychic': 'Psíquico',
      'filters.ice': 'Gelo',
      'filters.dragon': 'Dragão',
      'filters.dark': 'Sombrio',
      'filters.fighting': 'Lutador',
      'filters.poison': 'Veneno',
      'filters.ground': 'Terra',
      'filters.flying': 'Voador',
      'filters.bug': 'Inseto',
      'filters.rock': 'Pedra',
      'filters.ghost': 'Fantasma',
      'filters.steel': 'Metal',
      'filters.fairy': 'Fada',
      'filters.normal': 'Normal',

      // Pokémon Stats
      'stats.hp': 'PS',
      'stats.attack': 'Ataque',
      'stats.defense': 'Defesa',
      'stats.specialAttack': 'Ataque Especial',
      'stats.specialDefense': 'Defesa Especial',
      'stats.speed': 'Velocidade',
      'stats.height': 'Altura',
      'stats.weight': 'Peso',
      'stats.experience': 'Experiência',
      'stats.abilities': 'Habilidades',
      'stats.types': 'Tipos',

      // Configurações
      'settings.title': 'Configurações',
      'settings.language': 'Idioma',
      'settings.audio': 'Áudio',
      'settings.audioEnabled': 'Música ativada',
      'settings.audioDisabled': 'Música desativada',
      'settings.theme': 'Tema',
      'settings.about': 'Sobre',
      'settings.version': 'Versão',      // Audio Player
      'audio.playing': 'Tocando',
      'audio.paused': 'Pausado',
      'audio.play': 'Tocar',
      'audio.pause': 'Pausar',
      'audio.mute': 'Silenciar',
      'audio.unmute': 'Ativar som',
      'audio.restart': 'Reiniciar música',
      'audio.volume': 'Volume',
      'audio.pokemonTheme': 'Tema Pokémon',

      // Mensagens de sucesso
      'success.settingsSaved': 'Configurações salvas',
      'success.languageChanged': 'Idioma alterado',
      'success.audioToggled': 'Áudio alterado',

      // Detalhes do Pokémon
      'details.description': 'Descrição',
      'details.category': 'Categoria',
      'details.habitat': 'Habitat',
      'details.generation': 'Geração',
      'details.evolutionChain': 'Cadeia Evolutiva',
      'details.baseStats': 'Estatísticas Base',
      'details.totalStats': 'Total de Estatísticas',
      'details.averageStats': 'Média das Estatísticas',
      'details.weaknesses': 'Fraquezas',
      'details.strengths': 'Forças',
      'details.moveset': 'Movimentos',
      'details.locations': 'Localizações',
      'details.encounters': 'Encontros',      'details.info': 'Informações',
      'details.gallery': 'Galeria',
      'details.images': 'imagens',
      'details.image': 'imagem',
      'details.descriptions': 'Descrições',
      'details.noDescription': 'Descrição não disponível',
      'details.addToFavorites': 'Adicionar aos favoritos',
      'details.removeFromFavorites': 'Remover dos favoritos',

      // Categorias de Pokémon
      'category.seed': 'Semente',
      'category.lizard': 'Lagarto',
      'category.flame': 'Chama',
      'category.tiny-turtle': 'Tartaruga Pequena',
      'category.turtle': 'Tartaruga',
      'category.shellfish': 'Crustáceo',
      'category.worm': 'Minhoca',
      'category.cocoon': 'Casulo',
      'category.butterfly': 'Borboleta',
      'category.hairy-bug': 'Inseto Peludo',
      'category.poison-bee': 'Abelha Venenosa',
      'category.tiny-bird': 'Pássaro Pequeno',
      'category.bird': 'Pássaro',
      'category.mouse': 'Rato',
      'category.beak': 'Bico',
      'category.snake': 'Cobra',
      'category.electric': 'Elétrico',

      // Habilidades
      'ability.overgrow': 'Supercrescimento',
      'ability.chlorophyll': 'Clorofila',
      'ability.blaze': 'Chama',
      'ability.solar-power': 'Energia Solar',
      'ability.torrent': 'Torrente',
      'ability.rain-dish': 'Prato de Chuva',
      'ability.shield-dust': 'Poeira de Escudo',
      'ability.run-away': 'Fuga',
      'ability.swarm': 'Enxame',
      'ability.sniper': 'Atirador',
      'ability.keen-eye': 'Olho Aguçado',
      'ability.tangled-feet': 'Pés Emaranhados',
      'ability.big-pecks': 'Peito Grande',
      'ability.guts': 'Coragem',
      'ability.hustle': 'Pressa',
      'ability.static': 'Estático',
      'ability.lightning-rod': 'Para-raios',

      // Traduções específicas de nomes Pokémon (principais)
      'pokemon.bulbasaur': 'Bulbassauro',
      'pokemon.ivysaur': 'Ivysaur',
      'pokemon.venusaur': 'Venusaur',
      'pokemon.charmander': 'Charmander',
      'pokemon.charmeleon': 'Charmeleon',
      'pokemon.charizard': 'Charizard',
      'pokemon.squirtle': 'Squirtle',
      'pokemon.wartortle': 'Wartortle',
      'pokemon.blastoise': 'Blastoise',
      'pokemon.pikachu': 'Pikachu',
      'pokemon.raichu': 'Raichu',
      'pokemon.mewtwo': 'Mewtwo',
      'pokemon.mew': 'Mew',

      // Descrições de Pokémon
      'description.bulbasaur': 'Um Pokémon de tipo Grama/Veneno. Pode ficar dias sem comer graças ao bulbo em suas costas.',
      'description.charmander': 'Prefere lugares quentes. Quando chove, diz-se que vapor sai da ponta de sua cauda.',
      'description.squirtle': 'Após o nascimento, suas costas se endurecem e formam um casco.',
      'description.pikachu': 'Quando vários destes Pokémon se reúnem, sua eletricidade pode causar tempestades.',
      'description.mewtwo': 'Criado por um cientista após anos de experimentos horríveis de engenharia genética.',
      'description.mew': 'Tão raro que é considerado um Pokémon mítico por muitos estudiosos.',

      // Ações
      'actions.tapToExplore': 'Toque para explorar',
      'actions.clearFilters': 'Limpar filtros',
      'actions.refresh': 'Atualizar'
    },
    en: {
      // Navigation
      'nav.back': 'Back',
      'nav.pokedex': 'Pokédex',
      'nav.favorites': 'Favorites',
      'nav.settings': 'Settings',

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
      'error.applyFilter': 'Error applying filter. Try again',
      'error.changeFavorite': 'Error changing favorite',
      'error.loadingDetails': 'Error loading Pokémon details',
      'error.removeFavorite': 'Error removing favorite',
      'error.noFavoritesToRemove': 'No favorites to remove',

      // Common states
      'common.refreshing': 'Refreshing...',
      'common.retry': 'Retry',
      'common.cancel': 'Cancel',
      'common.ok': 'OK',
      'common.yes': 'Yes',
      'common.no': 'No',
      'common.save': 'Save',
      'common.close': 'Close',
      'common.back': 'Back',
      'common.next': 'Next',
      'common.previous': 'Previous',
      'common.clear': 'Clear',
      'common.all': 'All',
      'common.none': 'None',

      // Favorites
      'favorites.title': 'Favorites',
      'favorites.viewAll': 'View all',
      'favorites.empty': 'No favorites yet',
      'favorites.emptySubtitle': 'Add Pokémon to your favorites',      'favorites.addToFavorites': 'Add to favorites',
      'favorites.removeFromFavorites': 'Remove from favorites',
      'favorites.added': 'Added to favorites',
      'favorites.removed': 'Removed from favorites',
      'favorites.confirmRemove': 'Remove Favorite',
      'favorites.confirmRemoveMessage': 'Do you want to remove {name} from favorites?',
      'favorites.confirmClearAll': 'Clear Favorites',
      'favorites.confirmClearAllMessage': 'Do you want to remove all {count} favorite Pokémon?',
      'favorites.removeButtonText': 'Remove',
      'favorites.clearAllButtonText': 'Clear All',

      // Filters
      'filters.title': 'Filters',
      'filters.clearAll': 'Clear all',
      'filters.active': 'active filters',
      'filters.favorites': 'Favorites',
      'filters.legendary': 'Legendary',
      'filters.gen1': 'Generation 1',
      'filters.fire': 'Fire',
      'filters.water': 'Water',
      'filters.grass': 'Grass',
      'filters.electric': 'Electric',
      'filters.psychic': 'Psychic',
      'filters.ice': 'Ice',
      'filters.dragon': 'Dragon',
      'filters.dark': 'Dark',
      'filters.fighting': 'Fighting',
      'filters.poison': 'Poison',
      'filters.ground': 'Ground',
      'filters.flying': 'Flying',
      'filters.bug': 'Bug',
      'filters.rock': 'Rock',
      'filters.ghost': 'Ghost',
      'filters.steel': 'Steel',
      'filters.fairy': 'Fairy',
      'filters.normal': 'Normal',

      // Pokémon Stats
      'stats.hp': 'HP',
      'stats.attack': 'Attack',
      'stats.defense': 'Defense',
      'stats.specialAttack': 'Special Attack',
      'stats.specialDefense': 'Special Defense',
      'stats.speed': 'Speed',
      'stats.height': 'Height',
      'stats.weight': 'Weight',
      'stats.experience': 'Experience',
      'stats.abilities': 'Abilities',
      'stats.types': 'Types',

      // Settings
      'settings.title': 'Settings',
      'settings.language': 'Language',
      'settings.audio': 'Audio',
      'settings.audioEnabled': 'Music enabled',
      'settings.audioDisabled': 'Music disabled',
      'settings.theme': 'Theme',
      'settings.about': 'About',
      'settings.version': 'Version',      // Audio Player
      'audio.playing': 'Playing',
      'audio.paused': 'Paused',
      'audio.play': 'Play',
      'audio.pause': 'Pause',
      'audio.mute': 'Mute',
      'audio.unmute': 'Unmute',
      'audio.restart': 'Restart music',
      'audio.volume': 'Volume',
      'audio.pokemonTheme': 'Pokémon Theme',

      // Success messages
      'success.settingsSaved': 'Settings saved',
      'success.languageChanged': 'Language changed',
      'success.audioToggled': 'Audio toggled',

      // Pokémon details
      'details.description': 'Description',
      'details.category': 'Category',
      'details.habitat': 'Habitat',
      'details.generation': 'Generation',
      'details.evolutionChain': 'Evolution Chain',
      'details.baseStats': 'Base Stats',
      'details.totalStats': 'Total Stats',
      'details.averageStats': 'Average Stats',
      'details.weaknesses': 'Weaknesses',
      'details.strengths': 'Strengths',
      'details.moveset': 'Moveset',      'details.locations': 'Locations',
      'details.encounters': 'Encounters',
      'details.info': 'Information',
      'details.gallery': 'Gallery',
      'details.images': 'images',
      'details.image': 'image',
      'details.descriptions': 'Descriptions',
      'details.noDescription': 'Description not available',
      'details.addToFavorites': 'Add to favorites',
      'details.removeFromFavorites': 'Remove from favorites',

      // Pokémon categories
      'category.seed': 'Seed',
      'category.lizard': 'Lizard',
      'category.flame': 'Flame',
      'category.tiny-turtle': 'Tiny Turtle',
      'category.turtle': 'Turtle',
      'category.shellfish': 'Shellfish',
      'category.worm': 'Worm',
      'category.cocoon': 'Cocoon',
      'category.butterfly': 'Butterfly',
      'category.hairy-bug': 'Hairy Bug',
      'category.poison-bee': 'Poison Bee',
      'category.tiny-bird': 'Tiny Bird',
      'category.bird': 'Bird',
      'category.mouse': 'Mouse',
      'category.beak': 'Beak',
      'category.snake': 'Snake',
      'category.electric': 'Electric',

      // Abilities
      'ability.overgrow': 'Overgrow',
      'ability.chlorophyll': 'Chlorophyll',
      'ability.blaze': 'Blaze',
      'ability.solar-power': 'Solar Power',
      'ability.torrent': 'Torrent',
      'ability.rain-dish': 'Rain Dish',
      'ability.shield-dust': 'Shield Dust',
      'ability.run-away': 'Run Away',
      'ability.swarm': 'Swarm',
      'ability.sniper': 'Sniper',
      'ability.keen-eye': 'Keen Eye',
      'ability.tangled-feet': 'Tangled Feet',
      'ability.big-pecks': 'Big Pecks',
      'ability.guts': 'Guts',
      'ability.hustle': 'Hustle',
      'ability.static': 'Static',
      'ability.lightning-rod': 'Lightning Rod',

      // Traduções específicas de nomes Pokémon (principais)
      'pokemon.bulbasaur': 'Bulbasaur',
      'pokemon.ivysaur': 'Ivysaur',
      'pokemon.venusaur': 'Venusaur',
      'pokemon.charmander': 'Charmander',
      'pokemon.charmeleon': 'Charmeleon',
      'pokemon.charizard': 'Charizard',
      'pokemon.squirtle': 'Squirtle',
      'pokemon.wartortle': 'Wartortle',
      'pokemon.blastoise': 'Blastoise',
      'pokemon.pikachu': 'Pikachu',
      'pokemon.raichu': 'Raichu',
      'pokemon.mewtwo': 'Mewtwo',
      'pokemon.mew': 'Mew',

      // Descrições de Pokémon
      'description.bulbasaur': 'Um Pokémon de tipo Grama/Veneno. Pode ficar dias sem comer graças ao bulbo em suas costas.',
      'description.charmander': 'Prefere lugares quentes. Quando chove, diz-se que vapor sai da ponta de sua cauda.',
      'description.squirtle': 'Após o nascimento, suas costas se endurecem e formam um casco.',
      'description.pikachu': 'Quando vários destes Pokémon se reúnem, sua eletricidade pode causar tempestades.',
      'description.mewtwo': 'Criado por um cientista após anos de experimentos horríveis de engenharia genética.',
      'description.mew': 'Tão raro que é considerado um Pokémon mítico por muitos estudiosos.',

      // Ações
      'actions.tapToExplore': 'Toque para explorar',
      'actions.clearFilters': 'Limpar filtros',
      'actions.refresh': 'Atualizar'
    },
    es: {
      // Navegación
      'nav.back': 'Volver',
      'nav.pokedex': 'Pokédex',
      'nav.favorites': 'Favoritos',
      'nav.settings': 'Configuración',
      'nav.language': 'Idioma',

      // Home
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
      'loading.data': 'Cargando datos...',
      'loading.details': 'Cargando detalles...',

      // Errores
      'error.loadingData': 'Error al cargar datos',
      'error.noConnection': 'Sin conexión a internet',
      'error.tryAgain': 'Intentar de nuevo',
      'error.unexpected': 'Error inesperado',
      'error.pokemonNotFound': 'Pokémon no encontrado',
      'error.loadingMore': 'Error al cargar más datos',
      'error.applyFilter': 'Error al aplicar filtro. Inténtalo de nuevo',
      'error.changeFavorite': 'Error al cambiar favorito',
      'error.loadingDetails': 'Error al cargar detalles del Pokémon',
      'error.removeFavorite': 'Error al eliminar favorito',
      'error.noFavoritesToRemove': 'No hay favoritos para eliminar',

      // Estados comuns
      'common.refreshing': 'Actualizando...',
      'common.retry': 'Reintentar',
      'common.cancel': 'Cancelar',
      'common.ok': 'OK',
      'common.yes': 'Sí',
      'common.no': 'No',
      'common.save': 'Guardar',
      'common.close': 'Cerrar',
      'common.back': 'Atrás',
      'common.next': 'Siguiente',
      'common.previous': 'Anterior',
      'common.clear': 'Limpiar',
      'common.all': 'Todos',
      'common.none': 'Ninguno',

      // Favoritos
      'favorites.title': 'Favoritos',
      'favorites.viewAll': 'Ver todos',
      'favorites.empty': 'Aún no hay favoritos',
      'favorites.emptySubtitle': 'Agrega Pokémon a tus favoritos',      'favorites.addToFavorites': 'Agregar a favoritos',
      'favorites.removeFromFavorites': 'Quitar de favoritos',
      'favorites.added': 'Agregado a favoritos',
      'favorites.removed': 'Quitado de favoritos',
      'favorites.confirmRemove': 'Quitar Favorito',
      'favorites.confirmRemoveMessage': '¿Deseas quitar {name} de favoritos?',
      'favorites.confirmClearAll': 'Limpiar Favoritos',
      'favorites.confirmClearAllMessage': '¿Deseas quitar todos los {count} Pokémon favoritos?',
      'favorites.removeButtonText': 'Quitar',
      'favorites.clearAllButtonText': 'Limpiar Todo',

      // Filtros
      'filters.title': 'Filtros',
      'filters.clearAll': 'Limpiar todos',
      'filters.active': 'filtros ativos',
      'filters.favorites': 'Favoritos',
      'filters.legendary': 'Legendarios',
      'filters.gen1': 'Generación 1',
      'filters.fire': 'Fuego',
      'filters.water': 'Agua',
      'filters.grass': 'Hierba',
      'filters.electric': 'Eléctrico',
      'filters.psychic': 'Psíquico',
      'filters.ice': 'Hielo',
      'filters.dragon': 'Dragón',
      'filters.dark': 'Siniestro',
      'filters.fighting': 'Lucha',
      'filters.poison': 'Veneno',
      'filters.ground': 'Tierra',
      'filters.flying': 'Volador',
      'filters.bug': 'Bicho',
      'filters.rock': 'Roca',
      'filters.ghost': 'Fantasma',
      'filters.steel': 'Acero',
      'filters.fairy': 'Hada',
      'filters.normal': 'Normal',

      // Estadísticas Pokémon
      'stats.hp': 'PS',
      'stats.attack': 'Ataque',
      'stats.defense': 'Defensa',
      'stats.specialAttack': 'Ataque Especial',
      'stats.specialDefense': 'Defensa Especial',
      'stats.speed': 'Velocidad',
      'stats.height': 'Altura',
      'stats.weight': 'Peso',
      'stats.experience': 'Experiencia',
      'stats.abilities': 'Habilidades',
      'stats.types': 'Tipos',

      // Configuración
      'settings.title': 'Configuración',
      'settings.language': 'Idioma',
      'settings.audio': 'Audio',
      'settings.audioEnabled': 'Música activada',
      'settings.audioDisabled': 'Música desativada',
      'settings.theme': 'Tema',
      'settings.about': 'Acerca de',
      'settings.version': 'Versión',      // Reproductor de Audio
      'audio.playing': 'Reproduciendo',
      'audio.paused': 'Pausado',
      'audio.play': 'Reproducir',
      'audio.pause': 'Pausar',
      'audio.mute': 'Silenciar',
      'audio.unmute': 'Activar sonido',
      'audio.restart': 'Reiniciar música',
      'audio.volume': 'Volumen',
      'audio.pokemonTheme': 'Tema Pokémon',

      // Mensajes de éxito
      'success.settingsSaved': 'Configuración guardada',
      'success.languageChanged': 'Idioma cambiado',
      'success.audioToggled': 'Audio cambiado',

      // Detalles del Pokémon
      'details.description': 'Descripción',
      'details.category': 'Categoría',
      'details.habitat': 'Hábitat',
      'details.generation': 'Generación',
      'details.evolutionChain': 'Cadena Evolutiva',
      'details.baseStats': 'Estadísticas Base',
      'details.totalStats': 'Total de Estadísticas',
      'details.averageStats': 'Media de las Estatísticas',      'details.weaknesses': 'Debilidades',
      'details.strengths': 'Fortalezas',
      'details.moveset': 'Movimientos',
      'details.locations': 'Localizaciones',
      'details.encounters': 'Encuentros',
      'details.info': 'Información',
      'details.gallery': 'Galería',
      'details.images': 'imágenes',
      'details.image': 'imagen',
      'details.descriptions': 'Descripciones',
      'details.noDescription': 'Descripción no disponible',
      'details.addToFavorites': 'Añadir a favoritos',
      'details.removeFromFavorites': 'Quitar de favoritos',

      // Categorías de Pokémon
      'category.seed': 'Semilla',
      'category.lizard': 'Lagarto',
      'category.flame': 'Llama',
      'category.tiny-turtle': 'Tortuga Pequeña',
      'category.turtle': 'Tortuga',
      'category.shellfish': 'Crustáceo',
      'category.worm': 'Gusano',
      'category.cocoon': 'Capullo',
      'category.butterfly': 'Mariposa',
      'category.hairy-bug': 'Inseto Peludo',
      'category.poison-bee': 'Abeja Venenosa',
      'category.tiny-bird': 'Pájaro Pequeño',
      'category.bird': 'Pájaro',
      'category.mouse': 'Ratón',
      'category.beak': 'Pico',
      'category.snake': 'Serpiente',
      'category.electric': 'Eléctrico',

      // Habilidades
      'ability.overgrow': 'Sobrecrecimento',
      'ability.chlorophyll': 'Clorofila',
      'ability.blaze': 'Llama',
      'ability.solar-power': 'Energía Solar',
      'ability.torrent': 'Torrente',
      'ability.rain-dish': 'Plato de Lluvia',
      'ability.shield-dust': 'Polvo de Escudo',
      'ability.run-away': 'Huir',
      'ability.swarm': 'Enjambre',
      'ability.sniper': 'Francotirador',
      'ability.keen-eye': 'Ojo Avizor',
      'ability.tangled-feet': 'Pies Enredados',
      'ability.big-pecks': 'Pecho Grande',
      'ability.guts': 'Agallas',
      'ability.hustle': 'Prisa',
      'ability.static': 'Estático',
      'ability.lightning-rod': 'Pararrayos',

      // Traduções específicas de nomes Pokémon (principais)
      'pokemon.bulbasaur': 'Bulbasaur',
      'pokemon.ivysaur': 'Ivysaur',
      'pokemon.venusaur': 'Venusaur',
      'pokemon.charmander': 'Charmander',
      'pokemon.charmeleon': 'Charmeleon',
      'pokemon.charizard': 'Charizard',
      'pokemon.squirtle': 'Squirtle',
      'pokemon.wartortle': 'Wartortle',
      'pokemon.blastoise': 'Blastoise',
      'pokemon.pikachu': 'Pikachu',
      'pokemon.raichu': 'Raichu',
      'pokemon.mewtwo': 'Mewtwo',
      'pokemon.mew': 'Mew',

      // Descrições de Pokémon
      'description.bulbasaur': 'Um Pokémon de tipo Grama/Veneno. Pode ficar dias sem comer graças ao bulbo em suas costas.',
      'description.charmander': 'Prefere lugares quentes. Quando chove, diz-se que vapor sai da ponta de sua cauda.',
      'description.squirtle': 'Após o nascimento, suas costas se endurecem e formam um casco.',
      'description.pikachu': 'Quando vários destes Pokémon se reúnem, sua eletricidade pode causar tempestades.',
      'description.mewtwo': 'Criado por um cientista após anos de experimentos horríveis de engenharia genética.',
      'description.mew': 'Tão raro que é considerado um Pokémon mítico por muitos estudiosos.',

      // Ações
      'actions.tapToExplore': 'Toque para explorar',
      'actions.clearFilters': 'Limpar filtros',
      'actions.refresh': 'Atualizar'
    }
  };

  constructor() {
    // Recupera o idioma salvo do localStorage
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage && ['pt', 'en', 'es'].includes(savedLanguage)) {
      this.currentLanguageSubject.next(savedLanguage);
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  setLanguage(language: string): void {
    if (['pt', 'en', 'es'].includes(language)) {
      this.currentLanguageSubject.next(language);
      localStorage.setItem('selectedLanguage', language);
    }
  }

  translate(key: string): string {
    const currentLang = this.getCurrentLanguage();
    return this.translations[currentLang]?.[key] || key;
  }

  getAvailableLanguages(): string[] {
    return ['pt', 'en', 'es'];
  }
}