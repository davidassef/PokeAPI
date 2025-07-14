import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para converter peso de Pokémon de hectogramas para diferentes unidades
 * 
 * Este pipe converte o peso de Pokémon que vem da PokeAPI em hectogramas
 * para quilogramas (sistema métrico) ou libras (sistema imperial).
 * 
 * @example
 * {{ 69 | pokemonWeight }} // Resultado: "6.9kg"
 * {{ 69 | pokemonWeight:'imperial' }} // Resultado: "15.2 lbs"
 * {{ 905 | pokemonWeight }} // Resultado: "90.5kg"
 */
@Pipe({
  name: 'pokemonWeight'
})
export class PokemonWeightPipe implements PipeTransform {
  /**
   * Converte peso de hectogramas para a unidade especificada
   * 
   * @param weightInHectograms - Peso em hectogramas (formato da PokeAPI)
   * @param unit - Unidade de saída: 'metric' para quilogramas ou 'imperial' para libras
   * @returns String formatada com o peso na unidade especificada
   */
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
