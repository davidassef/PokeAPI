export interface RankedPokemon {
  id: number;
  name: string;
  imageUrl: string;
  types: string[];
  height: number;
  weight: number;
  favorites: number;
  rank?: number;
}
