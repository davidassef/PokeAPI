/**
 * Interface para configurações do aplicativo
 */
export interface AppSettings {
  language: 'pt-BR' | 'en-US' | 'es-ES';
  theme: 'light' | 'dark' | 'auto';
  darkMode: boolean;
  musicVolume?: number;
  musicEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  currentTrack?: string;
  pokemonPerPage: number;
  showShinyChance: boolean;
  autoPlayMusic: boolean;
  favoriteType?: string;
}

/**
 * Interface para filtros de Pokémon
 */
export interface PokemonFilters {
  name?: string;
  elementTypes?: string[];
  movementTypes?: string[];
  generation?: number;
  sortBy: 'id' | 'name' | 'height' | 'weight';
  sortOrder: 'asc' | 'desc';
}

/**
 * Interface para paginação
 */
export interface Pagination {
  limit: number;
  offset: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Interface para resposta da API
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Enum para cores dos tipos de Pokémon
 */
export enum PokemonTypeColors {
  normal = '#A8A878',
  fighting = '#C03028',
  flying = '#A890F0',
  poison = '#A040A0',
  ground = '#E0C068',
  rock = '#B8A038',
  bug = '#A8B820',
  ghost = '#705898',
  steel = '#B8B8D0',
  fire = '#F08030',
  water = '#6890F0',
  grass = '#78C850',
  electric = '#F8D030',
  psychic = '#F85888',
  ice = '#98D8D8',
  dragon = '#7038F8',
  dark = '#705848',
  fairy = '#EE99AC'
}

/**
 * Interface para estatísticas de stats
 */
export interface StatInfo {
  name: string;
  displayName: string;
  color: string;
  maxValue: number;
}
