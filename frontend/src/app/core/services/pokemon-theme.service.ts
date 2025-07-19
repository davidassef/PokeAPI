import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Interface para tema visual do Pokémon
 */
export interface PokemonTheme {
  primaryColor: string;
  secondaryColor: string;
  gradient: string;
  textColor: string;
  shadowColor: string;
  borderColor: string;
  type: string;
  secondaryType?: string;
}

/**
 * Serviço especializado para geração de temas visuais baseados nos tipos de Pokémon
 * Centraliza toda lógica de cores e estilos visuais
 */
@Injectable({
  providedIn: 'root'
})
export class PokemonThemeService {
  private config = {
    enableLogging: !environment.production
  };

  /**
   * Mapeamento de cores por tipo de Pokémon
   */
  private readonly typeColors: { [key: string]: string } = {
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
    fairy: '#EE99AC'
  };

  /**
   * Cores de texto contrastantes para cada tipo
   */
  private readonly typeTextColors: { [key: string]: string } = {
    normal: '#000000',
    fire: '#FFFFFF',
    water: '#FFFFFF',
    electric: '#000000',
    grass: '#000000',
    ice: '#000000',
    fighting: '#FFFFFF',
    poison: '#FFFFFF',
    ground: '#000000',
    flying: '#000000',
    psychic: '#FFFFFF',
    bug: '#000000',
    rock: '#FFFFFF',
    ghost: '#FFFFFF',
    dragon: '#FFFFFF',
    dark: '#FFFFFF',
    steel: '#000000',
    fairy: '#000000'
  };

  constructor() {
    // ✅ CLEANUP: Log de inicialização removido - serviço estável
    // if (this.config.enableLogging) {
    //   console.log('🎨 PokemonThemeService inicializado');
    // }
  }

  /**
   * Gera tema visual completo baseado nos tipos do Pokémon
   */
  generateTheme(pokemon: any): PokemonTheme {
    if (!pokemon || !pokemon.types || pokemon.types.length === 0) {
      return this.getDefaultTheme();
    }

    const primaryType = pokemon.types[0]?.type?.name || 'normal';
    const secondaryType = pokemon.types[1]?.type?.name;

    const primaryColor = this.typeColors[primaryType] || this.typeColors['normal'];
    const secondaryColor = secondaryType ?
      this.typeColors[secondaryType] :
      this.generateSecondaryColor(primaryColor);

    const textColor = this.typeTextColors[primaryType] || '#000000';
    const shadowColor = this.darkenColor(primaryColor, 30);
    const borderColor = this.lightenColor(primaryColor, 20);

    const theme: PokemonTheme = {
      primaryColor,
      secondaryColor,
      gradient: this.generateGradient(primaryColor, secondaryColor),
      textColor,
      shadowColor,
      borderColor,
      type: primaryType,
      secondaryType
    };

    this.logIfEnabled('Tema gerado para', pokemon.name, ':', {
      primaryType,
      secondaryType,
      primaryColor,
      secondaryColor
    });

    return theme;
  }

  /**
   * Gera gradiente baseado nas cores primária e secundária
   */
  private generateGradient(primaryColor: string, secondaryColor: string): string {
    return `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
  }

  /**
   * Gera cor secundária baseada na cor primária
   */
  private generateSecondaryColor(primaryColor: string): string {
    // Se não há tipo secundário, usar uma variação mais clara da cor primária
    return this.lightenColor(primaryColor, 15);
  }

  /**
   * Clareia uma cor em uma porcentagem específica
   */
  private lightenColor(color: string, percent: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const factor = percent / 100;
    const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor));
    const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor));
    const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor));

    return this.rgbToHex(r, g, b);
  }

  /**
   * Escurece uma cor em uma porcentagem específica
   */
  private darkenColor(color: string, percent: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const factor = percent / 100;
    const r = Math.max(0, Math.round(rgb.r * (1 - factor)));
    const g = Math.max(0, Math.round(rgb.g * (1 - factor)));
    const b = Math.max(0, Math.round(rgb.b * (1 - factor)));

    return this.rgbToHex(r, g, b);
  }

  /**
   * Converte cor hexadecimal para RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Converte RGB para cor hexadecimal
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Retorna tema padrão para casos de erro
   */
  getDefaultTheme(): PokemonTheme {
    const defaultColor = this.typeColors['normal'];

    return {
      primaryColor: defaultColor,
      secondaryColor: this.lightenColor(defaultColor, 20),
      gradient: this.generateGradient(defaultColor, this.lightenColor(defaultColor, 20)),
      textColor: '#000000',
      shadowColor: this.darkenColor(defaultColor, 30),
      borderColor: this.lightenColor(defaultColor, 20),
      type: 'normal'
    };
  }

  /**
   * Obtém cor específica de um tipo
   */
  getTypeColor(type: string): string {
    return this.typeColors[type] || this.typeColors['normal'];
  }

  /**
   * Obtém cor de texto contrastante para um tipo
   */
  getTypeTextColor(type: string): string {
    return this.typeTextColors[type] || '#000000';
  }

  /**
   * Verifica se uma cor é clara ou escura
   */
  isLightColor(color: string): boolean {
    const rgb = this.hexToRgb(color);
    if (!rgb) return false;

    // Fórmula para calcular luminância
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5;
  }

  /**
   * Gera cor de contraste automática
   */
  getContrastColor(backgroundColor: string): string {
    return this.isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
  }

  /**
   * Gera variações de uma cor para diferentes elementos
   */
  generateColorVariations(baseColor: string): {
    light: string;
    dark: string;
    lighter: string;
    darker: string;
  } {
    return {
      light: this.lightenColor(baseColor, 20),
      dark: this.darkenColor(baseColor, 20),
      lighter: this.lightenColor(baseColor, 40),
      darker: this.darkenColor(baseColor, 40)
    };
  }

  /**
   * Log condicional (apenas em desenvolvimento)
   */
  private logIfEnabled(message: string, ...args: any[]): void {
    if (this.config.enableLogging) {
      console.log(`[PokemonThemeService] ${message}`, ...args);
    }
  }
}
