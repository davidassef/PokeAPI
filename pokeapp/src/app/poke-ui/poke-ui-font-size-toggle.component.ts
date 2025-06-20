import { Component, Output, EventEmitter } from '@angular/core';

/**
 * Componente de ajuste de fonte para acessibilidade.
 * Permite aumentar ou diminuir o tamanho da fonte global.
 */
@Component({
  selector: 'poke-ui-font-size-toggle',
  standalone: true,
  template: `
    <div class="pokeui-font-size-toggle">
      <button (click)="setFont('small')" aria-label="Fonte menor">A-</button>
      <button (click)="setFont('normal')" aria-label="Fonte padrão">A</button>
      <button (click)="setFont('large')" aria-label="Fonte maior">A+</button>
    </div>
  `,
  styleUrls: ['./poke-ui-font-size-toggle.component.scss'],
})
export class PokeUiFontSizeToggleComponent {
  @Output() fontSizeChange = new EventEmitter<string>();
  setFont(size: 'small'|'normal'|'large') {
    document.body.classList.remove('pokeui-font-small', 'pokeui-font-large');
    if (size === 'small') document.body.classList.add('pokeui-font-small');
    if (size === 'large') document.body.classList.add('pokeui-font-large');
    this.fontSizeChange.emit(size);
  }
}
