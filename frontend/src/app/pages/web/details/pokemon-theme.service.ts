import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PokemonThemeService {

  private typeColors: { [key: string]: string } = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC'
  };

  getPokemonTheme(types: string[]): { primary: string; secondary: string; gradient: string } {
    const primaryType = types[0]?.toLowerCase() || 'normal';
    const secondaryType = types[1]?.toLowerCase() || primaryType;

    const primary = this.typeColors[primaryType] || this.typeColors['normal'];
    const secondary = this.typeColors[secondaryType] || primary;

    return {
      primary,
      secondary,
      gradient: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`
    };
  }

  getTypeColor(type: string): string {
    return this.typeColors[type.toLowerCase()] || this.typeColors['normal'];
  }
}
