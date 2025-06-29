import { Component, Input } from '@angular/core';
import { Pokemon } from '../pokemon-detail/pokemon-detail.component';

@Component({
  selector: 'app-pokemon-info-card',
  templateUrl: './pokemon-info-card.component.html',
  styleUrls: ['./pokemon-info-card.component.scss']
})
export class PokemonInfoCardComponent {
  @Input() pokemon!: Pokemon;
} 