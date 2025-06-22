import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pokemonHeight'
})
export class PokemonHeightPipe implements PipeTransform {
  transform(heightInDecimeters: number, unit: 'metric' | 'imperial' = 'metric'): string {
    if (!heightInDecimeters && heightInDecimeters !== 0) {
      return 'Unknown';
    }

    if (unit === 'imperial') {
      const totalInches = heightInDecimeters * 3.937;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return `${feet}'${inches}"`;
    }

    const meters = heightInDecimeters / 10;
    return `${meters.toFixed(1)}m`;
  }
}
