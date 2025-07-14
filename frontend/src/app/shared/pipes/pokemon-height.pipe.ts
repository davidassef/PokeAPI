import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para converter altura de Pokémon de decímetros para diferentes unidades
 * 
 * Este pipe converte a altura de Pokémon que vem da PokeAPI em decímetros
 * para metros (sistema métrico) ou pés/polegadas (sistema imperial).
 * 
 * @example
 * {{ 7 | pokemonHeight }} // Resultado: "0.7m"
 * {{ 7 | pokemonHeight:'imperial' }} // Resultado: "2'4""
 * {{ 25 | pokemonHeight }} // Resultado: "0.4m"
 */
@Pipe({
  name: 'pokemonHeight'
})
export class PokemonHeightPipe implements PipeTransform {
  /**
   * Converte altura de decímetros para a unidade especificada
   * 
   * @param heightInDecimeters - Altura em decímetros (formato da PokeAPI)
   * @param unit - Unidade de saída: 'metric' para metros ou 'imperial' para pés/polegadas
   * @returns String formatada com a altura na unidade especificada
   */
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
