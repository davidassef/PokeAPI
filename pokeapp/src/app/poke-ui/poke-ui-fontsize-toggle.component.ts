// Botão de ajuste de fonte
import { Component } from '@angular/core';
@Component({
  selector: 'poke-ui-fontsize-toggle',
  template: `<div class='pokeui-fontsize-toggle'>
    <button (click)="setSize('sm')" aria-label="Fonte menor">A-</button>
    <button (click)="setSize('md')" aria-label="Fonte padrão">A</button>
    <button (click)="setSize('lg')" aria-label="Fonte maior">A+</button>
  </div>`,
  styleUrls: ['./poke-ui-fontsize-toggle.component.scss'],
})
export class PokeUiFontsizeToggleComponent {
  setSize(size: 'sm'|'md'|'lg') {
    document.body.classList.remove('pokeui-font-sm','pokeui-font-md','pokeui-font-lg');
    document.body.classList.add('pokeui-font-' + size);
  }
}
