import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pokemonWeight'
})
export class PokemonWeightPipe implements PipeTransform {
  transform(weightInHectograms: number, unit: 'metric' | 'imperial' = 'metric'): string {
    if (!weightInHectograms && weightInHectograms !== 0) {
      return 'Unknown';
    }

    if (unit === 'imperial') {
      const pounds = weightInHectograms * 0.220462;
      return `${pounds.toFixed(1)} lbs`;
    }

    const kilograms = weightInHectograms / 10;
    return `${kilograms.toFixed(1)}kg`;
  }
}
