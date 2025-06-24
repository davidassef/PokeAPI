/**
 * Interface para dados básicos de Pokémon da PokeAPI
 */
export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  order: number;
  sprites: PokemonSprites;
  stats: PokemonStat[];
  types: PokemonType[];
  abilities: PokemonAbility[];
  species: {
    name: string;
    url: string;
  };
  moves: PokemonMove[];
}

/**
 * Interface para sprites do Pokémon
 */
export interface PokemonSprites {
  front_default: string;
  front_shiny: string;
  back_default: string;
  back_shiny: string;
  other: {
    'official-artwork': {
      front_default: string;
    };
    home: {
      front_default: string;
      front_shiny: string;
    };
  };
}

/**
 * Interface para estatísticas do Pokémon
 */
export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

/**
 * Interface para tipos do Pokémon
 */
export interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

/**
 * Interface para habilidades do Pokémon
 */
export interface PokemonAbility {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
  slot: number;
}

/**
 * Interface para lista de Pokémons da PokeAPI
 */
export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

/**
 * Interface para item da lista de Pokémons
 */
export interface PokemonListItem {
  name: string;
  url: string;
}

/**
 * Interface para espécie do Pokémon
 */
export interface PokemonSpecies {
  id: number;
  name: string;
  flavor_text_entries: FlavorTextEntry[];
  genera: Genera[];
  habitat: {
    name: string;
    url: string;
  };
  color: {
    name: string;
    url: string;
  };
}

/**
 * Interface para entradas de texto descritivo
 */
export interface FlavorTextEntry {
  flavor_text: string;
  language: {
    name: string;
    url: string;
  };
  version: {
    name: string;
    url: string;
  };
}

/**
 * Interface para gêneros
 */
export interface Genera {
  genus: string;
  language: {
    name: string;
    url: string;
  };
}

/**
 * Interface para favoritos (integração com backend)
 */
export interface FavoritePokemon {
  id?: number;
  user_id: number;
  pokemon_id: number;
  pokemon_name: string;
  created_at?: string;
}

/**
 * Interface para ranking (integração com backend)
 */
export interface PokemonRanking {
  pokemon_id: number;
  pokemon_name: string;
  favorite_count: number;
}

/**
 * Interface para movimentos do Pokémon
 */
export interface PokemonMove {
  move: {
    name: string;
    url: string;
  };
}
