import { Injectable } from '@angular/core';

/**
 * Serviço para gerenciar as cores associadas aos tipos de Pokémon
 */
@Injectable({
  providedIn: 'root'
})
export class TypeColorService {
  // Mapa de cores para cada tipo de Pokémon
  private typeColors = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC',
    // Traduções para PT-BR
    planta: '#78C850',
    fogo: '#F08030',
    água: '#6890F0',
    elétrico: '#F8D030',
    venenoso: '#A040A0',
    voador: '#A890F0',
    inseto: '#A8B820',
    fantasma: '#705898',
    psíquico: '#F85888',
    lutador: '#C03028',
    pedra: '#B8A038',
    terra: '#E0C068',
    gelo: '#98D8D8',
    aço: '#B8B8D0',
    fada: '#EE99AC',
    sombrio: '#705848',
    dragão: '#7038F8'
  };

  constructor() {}

  /**
   * Retorna a cor associada ao tipo de Pokémon
   * @param type O tipo de Pokémon (em inglês ou português)
   * @returns Código da cor em hexadecimal
   */
  getColorForType(type: string): string {
    const normalizedType = type.toLowerCase();
    return this.typeColors.hasOwnProperty(normalizedType)
      ? this.typeColors[normalizedType as keyof typeof this.typeColors]
      : '#777777'; // Cor padrão caso o tipo não seja encontrado
  }

  /**
   * Retorna uma cor de texto (branco ou preto) que contraste com a cor de fundo
   * @param backgroundColor A cor de fundo em hexadecimal
   * @returns '#ffffff' para branco ou '#000000' para preto
   */
  getContrastTextColor(backgroundColor: string): string {
    // Remove o caractere # se presente
    const hex = backgroundColor.replace('#', '');

    // Converte para RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calcula a luminosidade
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Retorna branco para cores escuras e preto para cores claras
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
}
