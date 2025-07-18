import { Component, Input } from '@angular/core';
import { TypeColorService } from '../../../services/type-color.service';
import { RankedPokemon } from '../../../models/ranked-pokemon.model';

@Component({
  selector: 'app-pokemon-rank-card',
  templateUrl: './pokemon-rank-card.component.html',
  styleUrls: ['./pokemon-rank-card.component.scss']
})
export class PokemonRankCardComponent {
  @Input() pokemon!: RankedPokemon;
  @Input() position: number = 0;
  @Input() isChampion: boolean = false;
  @Input() withGlow: boolean = false;

  constructor(private typeColorService: TypeColorService) {}



  /**
   * Retorna a cor associada ao tipo do Pokémon
   */
  getTypeColor(type: string): string {
    return this.typeColorService.getColorForType(type);
  }

  /**
   * Formata o número do Pokémon com zeros à esquerda
   */
  formatNumber(num: number): string {
    return num.toString().padStart(3, '0');
  }

  /**
   * Retorna o ícone apropriado para a posição
   */
  getMedalIcon(): string {
    switch (this.position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return this.position.toString();
    }
  }
}
