import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-pokemon-abilities',
  templateUrl: './pokemon-abilities.component.html',
  styleUrls: ['./pokemon-abilities.component.scss']
})
export class PokemonAbilitiesComponent {
  @Input() abilities: { name: string; isHidden: boolean }[] = [];
} 