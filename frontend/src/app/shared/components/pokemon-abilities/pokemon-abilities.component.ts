import { Component, Input } from '@angular/core';
import { PokemonAbility } from '../../../models/pokemon.model';

@Component({
  selector: 'app-pokemon-abilities',
  templateUrl: './pokemon-abilities.component.html',
  styleUrls: ['./pokemon-abilities.component.scss']
})
export class PokemonAbilitiesComponent {
  @Input() abilities: PokemonAbility[] = [];

  trackByAbility(index: number, ability: PokemonAbility): string {
    return ability.ability.name;
  }
} 