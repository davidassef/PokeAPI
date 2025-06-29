import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-pokemon-types',
  templateUrl: './pokemon-types.component.html',
  styleUrls: ['./pokemon-types.component.scss']
})
export class PokemonTypesComponent {
  @Input() types: string[] = [];

  getTypeIcon(type: string): string {
    // Retorne SVG inline ou use lógica de ícone por tipo
    // Exemplo simplificado:
    const icons: any = {
      grass: `<svg width='16' height='16'><circle cx='8' cy='8' r='8' fill='#78C850'/></svg>`,
      fire: `<svg width='16' height='16'><circle cx='8' cy='8' r='8' fill='#F08030'/></svg>`,
      water: `<svg width='16' height='16'><circle cx='8' cy='8' r='8' fill='#6890F0'/></svg>`,
      poison: `<svg width='16' height='16'><circle cx='8' cy='8' r='8' fill='#A040A0'/></svg>`,
      // ... outros tipos
    };
    return icons[type] || '';
  }
} 