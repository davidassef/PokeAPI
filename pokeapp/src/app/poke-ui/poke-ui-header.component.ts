import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'poke-ui-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="poke-header">
      <h1>Pokédex</h1>
    </header>
  `,
  styles: [`
    .poke-header {
      background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
      color: white;
      padding: 1rem;
      text-align: center;
    }

    h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: bold;
    }
  `]
})
export class PokeUiHeaderComponent {
}
