export interface Pokemon {
  id: number;
  name: string;
  url: string;
  sprites?: PokemonSprites;
  types?: PokemonType[];
  stats?: PokemonStat[];
  abilities?: PokemonAbility[];
  height?: number;
  weight?: number;
  base_experience?: number;
  species?: PokemonSpecies;
  is_legendary?: boolean;
  is_mythical?: boolean;
  generation?: number;
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Pokemon[];
}

export interface PokemonSprites {
  front_default: string;
  front_shiny: string;
  back_default: string;
  back_shiny: string;
  other: {
    'official-artwork': {
      front_default: string;
      front_shiny: string;
    };
    dream_world: {
      front_default: string;
    };
    home: {
      front_default: string;
      front_shiny: string;
    };
  };
}

export interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface PokemonAbility {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
  slot: number;
}

export interface PokemonSpecies {
  name: string;
  url: string;
  flavor_text_entries?: FlavorTextEntry[];
}

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

export interface FavoritePokemon {
  id: number;
  name: string;
  imageUrl: string;
  dateAdded: Date;
}
