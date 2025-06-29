import { Component, Input } from '@angular/core';

export interface Pokemon {
  id: number;
  name: string;
  image: string;
  types: string[];
  height: number;
  weight: number;
  baseExperience: number;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  abilities: {
    name: string;
    isHidden: boolean;
  }[];
  themeSongUrl?: string;
}

@Component({
  selector: 'app-pokemon-detail',
  templateUrl: './pokemon-detail.component.html',
  styleUrls: ['./pokemon-detail.component.scss']
})
export class PokemonDetailComponent {
  @Input() pokemon!: Pokemon;

  get statList() {
    return [
      { label: 'HP', value: this.pokemon?.stats.hp, tooltip: 'Pontos de vida' },
      { label: 'Ataque', value: this.pokemon?.stats.attack, tooltip: 'Dano físico' },
      { label: 'Defesa', value: this.pokemon?.stats.defense, tooltip: 'Resistência física' },
      { label: 'Ataque Especial', value: this.pokemon?.stats.specialAttack, tooltip: 'Dano especial' },
      { label: 'Defesa Especial', value: this.pokemon?.stats.specialDefense, tooltip: 'Resistência especial' },
      { label: 'Velocidade', value: this.pokemon?.stats.speed, tooltip: 'Ordem de ataque' },
    ];
  }

  getTypeColor(type: string): string {
    const colors: any = {
      grass: '#78C850', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
      poison: '#A040A0', bug: '#A8B820', flying: '#A890F0', normal: '#A8A878',
      ground: '#E0C068', fairy: '#EE99AC', fighting: '#C03028', psychic: '#F85888',
      rock: '#B8A038', ghost: '#705898', ice: '#98D8D8', dragon: '#7038F8', dark: '#705848', steel: '#B8B8D0'
    };
    return colors[type.toLowerCase()] || '#888';
  }

  getStatColor(label: string, value: number): string {
    if (value >= 100) return 'success';
    if (value >= 70) return 'warning';
    return 'danger';
  }
} 