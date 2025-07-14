import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe para formatar IDs de Pokémon com zeros à esquerda
 * 
 * Este pipe converte um número de ID de Pokémon em uma string formatada
 * com zeros à esquerda, seguindo o padrão da Pokédex (#001, #025, etc.)
 * 
 * @example
 * {{ 25 | pokemonId }} // Resultado: "#025"
 * {{ 1 | pokemonId:3 }} // Resultado: "#001"
 * {{ 150 | pokemonId:4 }} // Resultado: "#0150"
 */
@Pipe({
  name: 'pokemonId'
})
export class PokemonIdPipe implements PipeTransform {
  /**
   * Transforma um ID numérico de Pokémon em uma string formatada
   * 
   * @param id - O ID numérico do Pokémon
   * @param digits - Número de dígitos para preencher com zeros (padrão: 3)
   * @returns String formatada com # seguido do ID com zeros à esquerda
   */
  transform(id: number, digits: number = 3): string {
    return `#${id.toString().padStart(digits, '0')}`;
  }
}
