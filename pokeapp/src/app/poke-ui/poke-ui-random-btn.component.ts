// Botão flutuante PokéSurpresa
import { Component, Output, EventEmitter } from '@angular/core';
@Component({
  selector: 'poke-ui-random-btn',
  template: '<button class=\'pokeui-random-btn\' (click)="random.emit()" aria-label="PokéSurpresa">🎲 PokéSurpresa</button>',
  styleUrls: ['./poke-ui-random-btn.component.scss'],
})
export class PokeUiRandomBtnComponent {
  @Output() random = new EventEmitter<void>();
}
