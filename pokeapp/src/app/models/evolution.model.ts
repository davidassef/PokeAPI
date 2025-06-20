export interface EvolutionChain {
  id: number;
  chain: EvolutionLink;
}

export interface EvolutionLink {
  species: {
    name: string;
    url: string;
  };
  evolves_to: EvolutionLink[];
}
