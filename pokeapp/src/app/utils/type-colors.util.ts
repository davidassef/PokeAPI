/**
 * Utilidade centralizada para cores de tipos Pokémon
 * Segue o princípio DRY (Don't Repeat Yourself)
 */

export const TYPE_COLORS: { [key: string]: string } = {
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
};

/**
 * Retorna a cor específica para um tipo de Pokémon
 * @param tipo Tipo do Pokémon
 * @returns {string} Cor hexadecimal do tipo
 */
export function getTypeColor(tipo: string): string {
  return TYPE_COLORS[tipo.toLowerCase()] || '#68A090';
}

/**
 * Retorna cor de contraste (branca ou preta) baseada na luminosidade
 * @param corHexadecimal Cor em hexadecimal
 * @returns {string} Cor de contraste (#FFFFFF ou #000000)
 */
export function getContrastColor(corHexadecimal: string): string {
  const color = corHexadecimal.replace('#', '');
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // Cálculo de luminosidade
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Retorna versão mais clara da cor para backgrounds
 * @param tipo Tipo do Pokémon
 * @returns {string} Cor hexadecimal mais clara
 */
export function getLightTypeColor(tipo: string): string {
  const baseColor = getTypeColor(tipo);
  // Converter para RGB e clarear
  const color = baseColor.replace('#', '');
  const r = Math.min(255, parseInt(color.substr(0, 2), 16) + 40);
  const g = Math.min(255, parseInt(color.substr(2, 2), 16) + 40);
  const b = Math.min(255, parseInt(color.substr(4, 2), 16) + 40);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
