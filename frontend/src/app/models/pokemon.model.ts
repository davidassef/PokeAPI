/**
 * Interface principal para dados completos de um Pokémon da PokeAPI.
 *
 * Representa todos os dados essenciais de um Pokémon conforme retornado
 * pela PokeAPI v2, incluindo estatísticas, sprites, tipos e habilidades.
 *
 * @interface Pokemon
 */
export interface Pokemon {
  /** ID único do Pokémon na Pokédex Nacional (1-1010+) */
  id: number;

  /** Nome do Pokémon em inglês (lowercase) */
  name: string;

  /** Altura do Pokémon em decímetros */
  height: number;

  /** Peso do Pokémon em hectogramas */
  weight: number;

  /** Experiência base ganha ao derrotar este Pokémon */
  base_experience: number;

  /** Ordem do Pokémon na Pokédex (pode diferir do ID) */
  order: number;

  /** Conjunto de sprites/imagens do Pokémon */
  sprites: PokemonSprites;

  /** Array de estatísticas base (HP, Attack, Defense, etc.) */
  stats: PokemonStat[];

  /** Array de tipos do Pokémon (Fire, Water, etc.) */
  types: PokemonType[];

  /** Array de habilidades que o Pokémon pode ter */
  abilities: PokemonAbility[];

  /** Referência à espécie do Pokémon para dados adicionais */
  species: {
    name: string;
    url: string;
  };

  /** Array de movimentos que o Pokémon pode aprender */
  moves: PokemonMove[];
}

/**
 * Interface para sprites/imagens de um Pokémon.
 *
 * Contém URLs para diferentes versões das imagens do Pokémon,
 * incluindo versões normais, shiny e artwork oficial.
 *
 * @interface PokemonSprites
 */
export interface PokemonSprites {
  /** Sprite frontal padrão (pode ser null) */
  front_default: string;

  /** Sprite frontal shiny (pode ser null) */
  front_shiny: string;

  /** Sprite traseiro padrão (pode ser null) */
  back_default: string;

  /** Sprite traseiro shiny (pode ser null) */
  back_shiny: string;

  /** Sprites adicionais de alta qualidade */
  other: {
    /** Artwork oficial de alta resolução */
    'official-artwork': {
      front_default: string;
    };
    /** Sprites do Pokémon HOME */
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
  } | null;
  color: {
    name: string;
    url: string;
  };
  evolution_chain: {
    url: string;
  };
  egg_groups: Array<{
    name: string;
    url: string;
  }>;
  growth_rate: {
    name: string;
    url: string;
  };
  base_happiness: number;
  capture_rate: number;
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
 * Interface para Pokémons favoritos dos usuários.
 *
 * Representa um registro de favorito no sistema, vinculando um usuário
 * a um Pokémon específico. Usada para sincronização com o backend
 * e persistência local.
 *
 * @interface FavoritePokemon
 */
export interface FavoritePokemon {
  /** ID único do registro de favorito (opcional para novos registros) */
  id?: number;

  /** ID do usuário proprietário do favorito */
  user_id: number;

  /** ID do Pokémon na PokeAPI (1-1010+) */
  pokemon_id: number;

  /** Nome do Pokémon para facilitar consultas e exibição */
  pokemon_name: string;

  /** Data e hora de criação do favorito (ISO string, opcional) */
  created_at?: string;
}

/**
 * Interface para itens do ranking global de Pokémons.
 *
 * Representa um Pokémon no ranking dos mais favoritados,
 * com sua posição baseada no número total de favoritos
 * de todos os usuários do sistema.
 *
 * @interface PokemonRanking
 */
export interface PokemonRanking {
  /** ID do Pokémon na PokeAPI */
  pokemon_id: number;

  /** Nome do Pokémon */
  pokemon_name: string;

  /** Número total de vezes que foi favoritado por todos os usuários */
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
