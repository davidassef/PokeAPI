// Cores por tipo de Pokémon
export const TYPE_COLORS: { [key: string]: string } = {
  // Tipos principais
  'normal': '#A8A878',
  'fire': '#F08030',
  'water': '#6890F0',
  'electric': '#F8D030',
  'grass': '#78C850',
  'ice': '#98D8D8',
  'fighting': '#C03028',
  'poison': '#A040A0',
  'ground': '#E0C068',
  'flying': '#A890F0',
  'psychic': '#F85888',
  'bug': '#A8B820',
  'rock': '#B8A038',
  'ghost': '#705898',
  'dragon': '#7038F8',
  'dark': '#705848',
  'steel': '#B8B8D0',
  'fairy': '#EE99AC',

  // Cores de fundo mais suaves para UI
  'normal-light': '#D4D4D4',
  'fire-light': '#FFB366',
  'water-light': '#9BB3FF',
  'electric-light': '#FFE566',
  'grass-light': '#A3E083',
  'ice-light': '#C4EEEE',
  'fighting-light': '#E85555',
  'poison-light': '#C266C2',
  'ground-light': '#F2D895',
  'flying-light': '#C4B3FF',
  'psychic-light': '#FFB3C4',
  'bug-light': '#C4D452',
  'rock-light': '#D4C165',
  'ghost-light': '#9985C4',
  'dragon-light': '#9366FF',
  'dark-light': '#998578',
  'steel-light': '#E0E0F0',
  'fairy-light': '#F7C2D4'
};

// Tipos de Pokémon disponíveis
export const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic',
  'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

/**
 * Obtém a cor de um tipo específico
 */
export function getTypeColor(type: string, isLight: boolean = false): string {
  const key = isLight ? `${type}-light` : type;
  return TYPE_COLORS[key] || TYPE_COLORS['normal'];
}

/**
 * Obtém cor de contraste para texto baseado na cor de fundo
 */
export function getContrastColor(backgroundColor: string): string {
  // Remove # se presente
  const hex = backgroundColor.replace('#', '');

  // Converte para RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calcula luminância
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Retorna cor de contraste
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
