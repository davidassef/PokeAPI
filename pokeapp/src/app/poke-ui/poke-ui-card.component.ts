/**
 * 🎴 Componente de Card de Pokémon - Versão Revolucionária
 * ========================================================
 *
 * Componente principal para exibição de informações de Pokémon com:
 * - Design temático baseado nos tipos
 * - Efeitos visuais épicos e partículas
 * - Suporte completo à acessibilidade (WCAG 2.1 AA)
 * - Responsividade avançada
 * - Sistema de favoritos integrado
 * - Suporte a Pokémon Shiny com efeitos especiais
 *
 * @author Equipe de Desenvolvimento
 * @version 2.0.0
 * @since 2025-01-01
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pokemon } from '../models/pokemon.model';
import { EpicEffectsService } from '../services/epic-effects.service';

/**
 * Interface para configuração das cores dos tipos de Pokémon
 */
interface TypeColorConfig {
  [key: string]: string;
}

@Component({
  selector: 'poke-ui-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poke-ui-card.component.html',
  styleUrls: ['./poke-ui-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokeUiCardComponent implements OnInit, AfterViewInit, OnDestroy {

  // ==================== INPUTS E OUTPUTS ====================

  /**
   * Dados do Pokémon a ser exibido no card
   */
  @Input({ required: true }) pokemon!: Pokemon;

  /**
   * Indica se o Pokémon está marcado como favorito
   */
  @Input() isFavorito: boolean = false;

  /**
   * Indica se deve exibir a versão Shiny do Pokémon
   */
  @Input() isShiny: boolean = false;

  /**
   * Controla se os efeitos de partículas devem ser exibidos
   */
  @Input() showParticles: boolean = true;

  /**
   * Controla se os efeitos 3D devem ser aplicados
   */
  @Input() enable3DEffects: boolean = true;

  /**
   * Emitido quando o card é clicado
   */
  @Output() cardClick = new EventEmitter<Pokemon>();

  /**
   * Emitido quando o botão de favorito é toggleado
   */
  @Output() toggleFavorito = new EventEmitter<Pokemon>();

  // ==================== PROPRIEDADES PRIVADAS ====================

  /**
   * ID único do efeito para este card
   */
  private effectId: string = '';

  /**
   * URL de fallback para imagens com erro
   */
  private readonly fallbackImageUrl = 'assets/img/pokemon-placeholder.png';

  /**
   * Mapeamento de cores por tipo de Pokémon
   */
  private readonly typeColors: TypeColorConfig = {
    normal: '#A8A878', fire: '#F08030', water: '#6890F0',
    electric: '#F8D030', grass: '#78C850', ice: '#98D8D8',
    fighting: '#C03028', poison: '#A040A0', ground: '#E0C068',
    flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
    rock: '#B8A038', ghost: '#705898', dragon: '#7038F8',
    dark: '#705848', steel: '#B8B8D0', fairy: '#EE99AC',
  };

  // ==================== PROPRIEDADES DIMENSIONAIS ====================

  /**
   * Estado de materialização do Pokémon
   */
  isMaterializing: boolean = false;

  /**
   * Controla exibição das estatísticas
   */
  showStats: boolean = false;

  /**
   * Estado de interação ativa
   */
  isInteracting: boolean = false;

  /**
   * Modo cinema ativado
   */
  isCinemaMode: boolean = false;

  // ==================== PROPRIEDADES DE ESTADO ====================

  /**
   * Estado de carregamento da imagem
   */
  imageLoaded: boolean = false;

  /**
   * Estado de erro da imagem
   */
  imageError: boolean = false;

  // ==================== CONSTRUTOR E LIFECYCLE ====================
  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private epicEffects: EpicEffectsService,
  ) {}

  /**
   * Inicialização do componente
   */
  ngOnInit(): void {
    if (!this.pokemon) {
      console.warn('PokeUiCardComponent: pokemon é obrigatório');
      return;
    }

    this.effectId = this.generateEffectId();
    this.validateInputs();
  }

  /**
   * Configuração pós-renderização
   */
  ngAfterViewInit(): void {
    try {
      this.setupCardEffects();
    } catch (error) {
      console.error('Erro ao configurar efeitos do card:', error);
    }
  }

  /**
   * Limpeza ao destruir o componente
   */
  ngOnDestroy(): void {
    this.cleanupEffects();
  }

  // ==================== EVENT LISTENERS ====================

  /**
   * Listener para eventos de teclado (acessibilidade)
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
    }
  }

  // ==================== MÉTODOS PÚBLICOS ====================

  /**
   * Retorna a URL da imagem do Pokémon, priorizando artwork oficial
   */
  getImageUrl(): string {
    try {
      // Se for shiny, tenta versão shiny primeiro
      if (this.isShiny && this.pokemon.sprites?.other?.['official-artwork']?.front_shiny) {
        return this.pokemon.sprites.other['official-artwork'].front_shiny;
      }

      // Ordem de prioridade: official artwork -> front_default -> construída
      return this.pokemon.sprites?.other?.['official-artwork']?.front_default ||
        this.pokemon.sprites?.front_default ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${this.pokemon.id}.png`;
    } catch (error) {
      console.warn('Erro ao obter URL da imagem:', error);
      return this.fallbackImageUrl;
    }
  }

  /**
   * Retorna o tipo principal do Pokémon (primeiro tipo)
   */
  getPrimaryType(): string {
    return this.pokemon.types?.[0]?.type?.name || 'normal';
  }

  /**
   * Retorna as classes CSS para os badges de tipo
   */
  getTypeClass(type: string): string {
    return `type-badge type-${type}`;
  }

  /**
   * Retorna as classes CSS dinâmicas para o card
   */
  getCardClasses(): string {
    const classes = [];

    if (this.isFavorito) classes.push('favorito');
    if (this.isShiny) classes.push('shiny');
    if (this.isMaterializing) classes.push('materializing');
    if (this.isInteracting) classes.push('interacting');
    if (this.showStats) classes.push('stats-visible');

    const primaryType = this.getPrimaryType();
    classes.push(`type-${primaryType}`);

    if (this.isLegendary()) classes.push('legendary');

    return classes.join(' ');
  }
  /**
   * Retorna a cor primária do tipo principal
   */
  getPrimaryTypeColor(): string {
    const primaryType = this.getPrimaryType();
    return this.typeColors[primaryType] || this.typeColors['normal'];
  }

  /**
   * Retorna a cor secundária (segundo tipo ou variação da primária)
   */
  getSecondaryTypeColor(): string {
    const secondaryType = this.pokemon.types?.[1]?.type?.name;
    if (secondaryType) {
      return this.typeColors[secondaryType] || this.typeColors['normal'];
    }
    // Se não há segundo tipo, retorna uma variação mais escura da cor primária
    const primaryColor = this.getPrimaryTypeColor();
    return this.darkenColor(primaryColor, 20);
  }

  /**
   * Retorna o nível de raridade do Pokémon
   */
  getRarityLevel(): string {
    if (this.isShiny) return 'shiny';
    if (this.isLegendary()) return 'legendary';
    if (this.pokemon.is_mythical) return 'mythical';
    if (this.pokemon.base_experience && this.pokemon.base_experience > 200) return 'rare';
    return 'common';
  }

  /**
   * Retorna o label acessível para o card
   */
  getAccessibleLabel(): string {
    const name = this.formatPokemonName(this.pokemon.name);
    const id = this.pokemon.id;
    const types = this.pokemon.types?.map(t => t.type.name).join(' e ') || 'tipo desconhecido';
    const favorite = this.isFavorito ? ', favoritado' : '';
    const shiny = this.isShiny ? ', versão brilhante' : '';

    return `${name}, Pokémon número ${id}, tipo ${types}${favorite}${shiny}`;
  }

  /**
   * Retorna o ícone de raridade
   */
  getRarityIcon(): string {
    const rarity = this.getRarityLevel();
    switch (rarity) {
      case 'shiny': return '✨';
      case 'legendary': return '👑';
      case 'mythical': return '🌟';
      case 'rare': return '💎';
      default: return '⭐';
    }
  }

  /**
   * Retorna o label do botão de favorito
   */
  getFavoriteButtonLabel(): string {
    const action = this.isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
    const name = this.formatPokemonName(this.pokemon.name);
    return `${action}: ${name}`;
  }
  /**
   * Retorna a cor de um tipo específico
   */
  getTypeColor(typeName: string): string {
    return this.typeColors[typeName] || this.typeColors['normal'];
  }

  /**
   * Retorna o ícone correspondente ao tipo
   */
  getTypeIcon(typeName: string): string {
    const typeIcons: { [key: string]: string } = {
      normal: '⚪',
      fire: '🔥',
      water: '💧',
      electric: '⚡',
      grass: '🌿',
      ice: '❄️',
      fighting: '👊',
      poison: '☠️',
      ground: '🌍',
      flying: '🌪️',
      psychic: '🔮',
      bug: '🐛',
      rock: '🗿',
      ghost: '👻',
      dragon: '🐉',
      dark: '🌑',
      steel: '⚙️',
      fairy: '🧚'
    };

    return typeIcons[typeName] || '❓';
  }

  /**
   * Retorna o gradiente para a barra de poder baseado no nível
   */
  getPowerGradient(): string {
    const power = this.getPowerLevel();
    if (power >= 80) {
      return 'linear-gradient(90deg, #10b981, #059669)'; // Verde
    } else if (power >= 60) {
      return 'linear-gradient(90deg, #f59e0b, #d97706)'; // Amarelo
    } else if (power >= 40) {
      return 'linear-gradient(90deg, #f97316, #ea580c)'; // Laranja
    } else {
      return 'linear-gradient(90deg, #ef4444, #dc2626)'; // Vermelho
    }
  }

  /**
   * Calcula e retorna o nível de poder baseado nas stats
   */
  getPowerLevel(): number {
    if (!this.pokemon.stats || this.pokemon.stats.length === 0) {
      return 50; // Valor padrão
    }

    const totalStats = this.pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
    const maxPossibleStats = this.pokemon.stats.length * 255; // Valor máximo teórico por stat
    const powerPercentage = Math.round((totalStats / maxPossibleStats) * 100);

    return Math.min(100, Math.max(1, powerPercentage));
  }

  /**
   * Retorna a descrição acessível detalhada
   */
  getAccessibleDescription(): string {
    const name = this.formatPokemonName(this.pokemon.name);
    const types = this.pokemon.types?.map(t => this.formatTypeName(t.type.name)).join(' e ') || 'tipo desconhecido';
    const power = this.getPowerLevel();
    const height = this.pokemon.height ? `${this.pokemon.height / 10}m` : 'altura desconhecida';
    const weight = this.pokemon.weight ? `${this.pokemon.weight / 10}kg` : 'peso desconhecido';

    return `${name} é um Pokémon do tipo ${types} com nível de poder ${power}%, medindo ${height} e pesando ${weight}.`;
  }

  /**
   * Gera dígito binário aleatório para efeitos
   */
  getRandomBinaryDigit(): string {
    return Math.random() > 0.5 ? '1' : '0';
  }

  // ==================== EFEITOS VISUAIS ÉPICOS ====================

  /**
   * Aplica efeitos de hover cinematográficos
   */
  private applyHoverEffects(): void {
    if (!this.epicEffects.isMobileDevice() && !this.epicEffects.prefersReducedMotion()) {
      // Efeito 3D
      this.epicEffects.apply3DEffect(this.elementRef, this.effectId);

      // Sistema de partículas baseado no tipo
      const primaryType = this.getPrimaryType();
      this.epicEffects.createParticleSystem(
        this.elementRef,
        primaryType as any,
        `${this.effectId}-hover`
      );

      // Efeito shiny se aplicável
      if (this.isShiny) {
        this.epicEffects.applyShinyEffect(this.elementRef, `${this.effectId}-shiny`);
      }
    }
  }

  /**
   * Remove efeitos de hover
   */
  private removeHoverEffects(): void {
    this.epicEffects.removeEffect(this.effectId);
    this.epicEffects.removeEffect(`${this.effectId}-hover`);
    this.epicEffects.removeEffect(`${this.effectId}-shiny`);
  }

  /**
   * Aplica efeitos de foco para acessibilidade
   */
  private applyFocusEffects(): void {
    // Pulso de energia sutil para indicar foco
    this.epicEffects.applyEnergyPulse(this.elementRef, `${this.effectId}-focus`);
  }
  /**
   * Remove efeitos de foco
   */
  private removeFocusEffects(): void {
    this.epicEffects.removeEffect(`${this.effectId}-focus`);
  }
  // ==================== HANDLERS DE EVENTOS ====================

  /**
   * Handler para quando a imagem carrega com sucesso
   */
  onImageLoad(): void {
    this.imageLoaded = true;
    this.imageError = false;
    this.isMaterializing = false;
  }

  /**
   * Handler para quando há erro no carregamento da imagem
   */
  onImageError(event: Event): void {
    this.imageLoaded = false;
    this.imageError = true;
    this.isMaterializing = false;
    console.warn(`Erro ao carregar imagem do Pokémon ${this.pokemon.name}:`, event);
  }

  /**
   * Handler para click no card
   */
  onCardClick(): void {
    this.cardClick.emit(this.pokemon);
  }

  /**
   * Handler para toggle do favorito
   */
  onToggleFavorito(event: Event): void {
    event.stopPropagation(); // Evita propagação para o card
    this.toggleFavorito.emit(this.pokemon);
    if (!this.isFavorito) {
      this.createCaptureEffect();
    }
  }

  /**
   * Handler para hover no card
   */
  onCardHover(isHovering: boolean): void {
    this.isInteracting = isHovering;
    if (isHovering && !this.epicEffects.prefersReducedMotion()) {
      this.applyHoverEffects();
    }
  }
  /**
   * Handler para foco no card
   */
  onCardFocus(isFocused: boolean): void {
    if (isFocused) {
      this.applyFocusEffects();
    }
  }

  /**
   * Track function para ngFor dos tipos
   */
  trackByType(index: number, type: any): string {
    return type?.type?.name || index.toString();
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Gera ID único para efeitos visuais
   */
  private generateEffectId(): string {
    return `card-${this.pokemon.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Valida as entradas do componente
   */
  private validateInputs(): void {
    if (!this.pokemon.id || !this.pokemon.name) {
      console.warn('PokeUiCardComponent: pokemon deve ter id e name válidos');
    }

    if (!this.pokemon.types || this.pokemon.types.length === 0) {
      console.warn('PokeUiCardComponent: pokemon deve ter pelo menos um tipo');
    }
  }

  /**
   * Configura todos os efeitos visuais do card
   */
  private setupCardEffects(): void {
    // Aplica entrada cinematográfica
    this.epicEffects.applyCinematicEntrance(this.elementRef, Math.random() * 500);

    // Aplica efeitos apenas se não for dispositivo móvel e usuário não preferir movimento reduzido
    if (!this.epicEffects.isMobileDevice() && !this.epicEffects.prefersReducedMotion()) {
      this.setupAdvancedEffects();
    }
  }

  /**
   * Configura efeitos avançados (apenas desktop e com movimento habilitado)
   */
  private setupAdvancedEffects(): void {
    try {
      // Efeito 3D
      if (this.enable3DEffects) {
        this.epicEffects.apply3DEffect(this.elementRef, this.effectId);
      }

      // Sistema de partículas baseado no tipo
      if (this.showParticles) {
        const primaryType = this.getPrimaryType();
        this.epicEffects.createParticleSystem(
          this.elementRef,
          primaryType,
          `${this.effectId}-particles`,
        );
      }

      // Efeito shiny se aplicável
      if (this.isShiny) {
        this.epicEffects.applyShinyEffect(this.elementRef, `${this.effectId}-shiny`);
      }
    } catch (error) {
      console.error('Erro ao configurar efeitos avançados:', error);
    }
  }

  /**
   * Cria efeito especial de "captura" quando favoritar
   */
  private createCaptureEffect(): void {
    try {
      const button = this.elementRef.nativeElement.querySelector('.pokeui-fav-btn') as HTMLElement;
      if (button) {
        button.style.animation = 'capture-effect 0.6s ease-out';

        setTimeout(() => {
          button.style.animation = '';
        }, 600);
      }
    } catch (error) {
      console.error('Erro ao criar efeito de captura:', error);
    }
  }

  /**
   * Remove todos os efeitos ativos
   */
  private cleanupEffects(): void {
    try {
      this.epicEffects.removeEffect(this.effectId);
      this.epicEffects.removeEffect(`${this.effectId}-particles`);
      this.epicEffects.removeEffect(`${this.effectId}-shiny`);
      this.epicEffects.removeEffect(`${this.effectId}-click`);
    } catch (error) {
      console.error('Erro ao limpar efeitos:', error);
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Verifica se o Pokémon é lendário
   */
  isLegendary(): boolean {
    return this.pokemon.is_legendary || false;
  }

  /**
   * Formata o nome do Pokémon
   */
  formatPokemonName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /**
   * Formata o nome do tipo
   */
  formatTypeName(typeName: string): string {
    const typeNames: { [key: string]: string } = {
      normal: 'Normal',
      fire: 'Fogo',
      water: 'Água',
      electric: 'Elétrico',
      grass: 'Grama',
      ice: 'Gelo',
      fighting: 'Lutador',
      poison: 'Venenoso',
      ground: 'Terra',
      flying: 'Voador',
      psychic: 'Psíquico',
      bug: 'Inseto',
      rock: 'Pedra',
      ghost: 'Fantasma',
      dragon: 'Dragão',
      dark: 'Sombrio',
      steel: 'Metálico',
      fairy: 'Fada'
    };

    return typeNames[typeName] || typeName.charAt(0).toUpperCase() + typeName.slice(1);
  }

  /**
   * Escurece uma cor hex em uma porcentagem
   */
  private darkenColor(hex: string, percent: number): string {
    try {
      const num = parseInt(hex.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) - amt;
      const G = (num >> 8 & 0x00FF) - amt;
      const B = (num & 0x0000FF) - amt;

      return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    } catch (error) {
      return hex; // Retorna a cor original em caso de erro
    }
  }
}
