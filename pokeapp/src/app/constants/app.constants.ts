/**
 * Constantes centralizadas da aplicação
 */

// URLs da API
export const API_URLS = {
  BASE_URL: 'https://pokeapi.co/api/v2',
  POKEMON: 'pokemon',
  SPECIES: 'pokemon-species',
} as const;

// Configurações de paginação
export const PAGINATION = {
  ITEMS_PER_PAGE: 20,
  INITIAL_OFFSET: 0,
} as const;

// Tipos de Pokémon
export const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic',
  'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const;

// Idiomas suportados
export const SUPPORTED_LANGUAGES = ['pt', 'en', 'es'] as const;

// Chaves do localStorage
export const STORAGE_KEYS = {
  FAVORITES: 'pokemon_favorites',
  LANGUAGE: 'app_language',
  AUDIO_ENABLED: 'audioEnabled',
  AUDIO_VOLUME: 'audioVolume',
} as const;

// Configurações de áudio
export const AUDIO_CONFIG = {
  DEFAULT_VOLUME: 0.5,
  VOLUME_STEP: 0.1,
  FILE_PATHS: {
    pt: 'Pokémon - INTRO BR.mp3',
    en: 'Pokémon INTRO EN.mp3',
    es: 'Pokémon - INTRO ES.mp3',
  },
} as const;

// Configurações de toast
export const TOAST_CONFIG = {
  DURATION: 2000,
  POSITION: 'bottom' as const,
  SUCCESS_COLOR: 'success' as const,
  ERROR_COLOR: 'danger' as const,
} as const;
