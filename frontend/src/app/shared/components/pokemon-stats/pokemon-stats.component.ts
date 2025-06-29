import { Component, Input } from '@angular/core';

export interface Stat {
  label: string;
  value: number;
  tooltip: string;
}

@Component({
  selector: 'app-pokemon-stats',
  templateUrl: './pokemon-stats.component.html',
  styleUrls: ['./pokemon-stats.component.scss']
})
export class PokemonStatsComponent {
  @Input() stats: Stat[] = [];

  get total(): number {
    return this.stats.reduce((acc, s) => acc + (s.value || 0), 0);
  }

  trackByLabel(_: number, stat: Stat) {
    return stat.label;
  }
} 