/**
 * 🎆 Serviço de Efeitos Visuais Épicos - Versão Corrigida
 * ======================================================
 *
 * Gerencia sistemas de partículas, animações 3D e micro-interações
 * para criar uma experiência visual revolucionária na Pokédex.
 *
 * Funcionalidades:
 * - Sistema de partículas por tipo de Pokémon
 * - Efeitos 3D com aceleração por GPU
 * - Animações cinematográficas de entrada
 * - Efeitos Shiny para Pokémon raros
 * - Otimizações para dispositivos móveis
 * - Respeito às preferências de acessibilidade
 *
 * @example
 * ```typescript
 * constructor(private epicEffects: EpicEffectsService) {}
 *
 * // Criar sistema de partículas
 * this.epicEffects.createParticleSystem(element, 'fire', 'effect-id');
 *
 * // Aplicar efeito 3D
 * this.epicEffects.apply3DEffect(element, 'effect-id');
 *
 * // Limpar efeitos
 * this.epicEffects.removeEffect('effect-id');
 * ```
 *
 * @author Equipe de Desenvolvimento
 * @version 2.0.0
 * @since 2025-01-01
 */

import { Injectable, ElementRef } from '@angular/core';

/**
 * Configuração de partículas por tipo de Pokémon
 */
export interface ParticleConfig {
  type: 'fire' | 'water' | 'electric' | 'grass' | 'normal' | 'ice' | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug' | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';
  count: number;
  size: { min: number; max: number };
  duration: { min: number; max: number };
  colors: string[];
  animation: 'float' | 'spark' | 'fall' | 'spiral' | 'pulse';
}

/**
 * Representa um efeito visual ativo no sistema
 */
export interface VisualEffect {
  id: string;
  name: string;
  element: HTMLElement;
  createdAt: number;
  cleanup: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class EpicEffectsService {

  // ====================================================================
  // PROPRIEDADES PRIVADAS
  // ====================================================================

  /**
   * Mapa de efeitos visuais ativos
   */
  private activeEffects = new Map<string, VisualEffect>();

  /**
   * Cache para verificação de device mobile
   */
  private _isMobile: boolean | null = null;

  /**
   * Cache para preferência de movimento reduzido
   */
  private _prefersReducedMotion: boolean | null = null;

  /**
   * Configurações de partículas por tipo de Pokémon
   */
  private readonly particleConfigs: Record<string, ParticleConfig> = {
    fire: {
      type: 'fire',
      count: 15,
      size: { min: 6, max: 16 },
      duration: { min: 2000, max: 4000 },
      colors: ['#ff4757', '#ff6b7a', '#ff9f43'],
      animation: 'spark',
    },
    water: {
      type: 'water',
      count: 12,
      size: { min: 4, max: 12 },
      duration: { min: 3000, max: 5000 },
      colors: ['#3742fa', '#2f3542', '#70a1ff'],
      animation: 'fall',
    },
    electric: {
      type: 'electric',
      count: 20,
      size: { min: 3, max: 8 },
      duration: { min: 1000, max: 2500 },
      colors: ['#ffa502', '#ff6348', '#ffdd59'],
      animation: 'spark',
    },
    grass: {
      type: 'grass',
      count: 10,
      size: { min: 5, max: 14 },
      duration: { min: 4000, max: 6000 },
      colors: ['#2ed573', '#7bed9f', '#5f27cd'],
      animation: 'float',
    },
    normal: {
      type: 'normal',
      count: 8,
      size: { min: 4, max: 10 },
      duration: { min: 2500, max: 4500 },
      colors: ['#a4b0be', '#c8d6e5', '#8395a7'],
      animation: 'pulse',
    },
    ice: {
      type: 'ice',
      count: 14,
      size: { min: 5, max: 12 },
      duration: { min: 3500, max: 5500 },
      colors: ['#74b9ff', '#0984e3', '#a8e6cf'],
      animation: 'fall',
    },
    fighting: {
      type: 'fighting',
      count: 18,
      size: { min: 6, max: 14 },
      duration: { min: 1500, max: 3000 },
      colors: ['#d63031', '#74b9ff', '#fd79a8'],
      animation: 'spiral',
    },
    poison: {
      type: 'poison',
      count: 12,
      size: { min: 4, max: 10 },
      duration: { min: 2000, max: 4000 },
      colors: ['#a29bfe', '#6c5ce7', '#fd79a8'],
      animation: 'float',
    },
    ground: {
      type: 'ground',
      count: 16,
      size: { min: 8, max: 16 },
      duration: { min: 3000, max: 5000 },
      colors: ['#e17055', '#d63031', '#fdcb6e'],
      animation: 'fall',
    },
    flying: {
      type: 'flying',
      count: 10,
      size: { min: 3, max: 8 },
      duration: { min: 2500, max: 4500 },
      colors: ['#74b9ff', '#0984e3', '#a8e6cf'],
      animation: 'spiral',
    },
    psychic: {
      type: 'psychic',
      count: 14,
      size: { min: 5, max: 12 },
      duration: { min: 3000, max: 5000 },
      colors: ['#fd79a8', '#e84393', '#a29bfe'],
      animation: 'pulse',
    },
    bug: {
      type: 'bug',
      count: 12,
      size: { min: 3, max: 8 },
      duration: { min: 2000, max: 4000 },
      colors: ['#00b894', '#00cec9', '#55a3ff'],
      animation: 'float',
    },
    rock: {
      type: 'rock',
      count: 18,
      size: { min: 8, max: 18 },
      duration: { min: 4000, max: 6000 },
      colors: ['#636e72', '#2d3436', '#b2bec3'],
      animation: 'fall',
    },
    ghost: {
      type: 'ghost',
      count: 10,
      size: { min: 6, max: 14 },
      duration: { min: 3500, max: 5500 },
      colors: ['#6c5ce7', '#a29bfe', '#fd79a8'],
      animation: 'pulse',
    },
    dragon: {
      type: 'dragon',
      count: 20,
      size: { min: 8, max: 16 },
      duration: { min: 2500, max: 4500 },
      colors: ['#0984e3', '#74b9ff', '#fd79a8'],
      animation: 'spiral',
    },
    dark: {
      type: 'dark',
      count: 12,
      size: { min: 6, max: 12 },
      duration: { min: 3000, max: 5000 },
      colors: ['#2d3436', '#636e72', '#6c5ce7'],
      animation: 'pulse',
    },
    steel: {
      type: 'steel',
      count: 16,
      size: { min: 5, max: 12 },
      duration: { min: 3500, max: 5500 },
      colors: ['#636e72', '#b2bec3', '#74b9ff'],
      animation: 'spark',
    },
    fairy: {
      type: 'fairy',
      count: 14,
      size: { min: 4, max: 10 },
      duration: { min: 2500, max: 4500 },
      colors: ['#fd79a8', '#fdcb6e', '#e84393'],
      animation: 'float',
    },
  };

  // ====================================================================
  // MÉTODOS PÚBLICOS - SISTEMA DE PARTÍCULAS
  // ====================================================================

  /**
   * Cria sistema de partículas para um elemento baseado no tipo do Pokémon
   * @param container - Elemento container onde as partículas serão criadas
   * @param pokemonType - Tipo do Pokémon para determinar o estilo das partículas
   * @param effectId - ID único para identificar e gerenciar o efeito
   */
  createParticleSystem(
    container: ElementRef<HTMLElement>,
    pokemonType: string,
    effectId: string,
  ): void {
    try {
      // Verifica se movimento reduzido está ativado
      if (this.prefersReducedMotion()) {
        return;
      }

      const config = this.particleConfigs[pokemonType] || this.particleConfigs['normal'];
      const containerEl = container.nativeElement;

      // Remove efeito anterior se existir
      this.removeEffect(effectId);

      // Cria container de partículas
      const particleContainer = document.createElement('div');
      particleContainer.className = 'particles-container';
      particleContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
        z-index: 1;
      `;
      containerEl.appendChild(particleContainer);

      // Gera partículas
      for (let i = 0; i < config.count; i++) {
        const particle = this.createParticle(config);
        particleContainer.appendChild(particle);
      }

      // Cleanup function
      const cleanup = () => {
        if (particleContainer.parentNode) {
          particleContainer.parentNode.removeChild(particleContainer);
        }
      };

      // Registra o efeito
      this.activeEffects.set(effectId, {
        id: effectId,
        name: `particles-${pokemonType}`,
        element: particleContainer,
        createdAt: Date.now(),
        cleanup,
      });

    } catch (error) {
      console.error('Erro ao criar sistema de partículas:', error);
    }
  }

  /**
   * Aplica efeito 3D a um elemento
   * @param container - Elemento para aplicar o efeito 3D
   * @param effectId - ID único para identificar o efeito
   */
  apply3DEffect(container: ElementRef<HTMLElement>, effectId: string): void {
    try {
      const element = container.nativeElement;

      // Remove efeito anterior se existir
      this.removeEffect(effectId);

      element.style.transformStyle = 'preserve-3d';
      element.style.transition = 'transform 0.3s ease-out';
      element.style.willChange = 'transform';

      const cleanup = () => {
        element.style.transformStyle = '';
        element.style.transition = '';
        element.style.transform = '';
        element.style.willChange = '';
      };

      this.activeEffects.set(effectId, {
        id: effectId,
        name: '3d-effect',
        element,
        createdAt: Date.now(),
        cleanup,
      });

    } catch (error) {
      console.error('Erro ao aplicar efeito 3D:', error);
    }
  }

  /**
   * Aplica entrada cinematográfica a um elemento
   * @param container - Elemento para aplicar a animação
   * @param delay - Delay antes de iniciar a animação (ms)
   */
  applyCinematicEntrance(container: ElementRef<HTMLElement>, delay: number = 0): void {
    try {
      if (this.prefersReducedMotion()) {
        return;
      }

      const element = container.nativeElement;

      element.style.opacity = '0';
      element.style.transform = 'translateY(20px) scale(0.95)';
      element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';

      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0) scale(1)';
      }, delay);

    } catch (error) {
      console.error('Erro ao aplicar entrada cinematográfica:', error);
    }
  }

  /**
   * Aplica efeito shiny especial para Pokémon raros
   * @param container - Elemento para aplicar o efeito shiny
   * @param effectId - ID único para identificar o efeito
   */
  applyShinyEffect(container: ElementRef<HTMLElement>, effectId: string): void {
    try {
      const element = container.nativeElement;

      // Remove efeito anterior se existir
      this.removeEffect(effectId);

      element.classList.add('shiny-effect');
      element.style.filter = 'hue-rotate(45deg) saturate(1.5) brightness(1.2)';

      const cleanup = () => {
        element.classList.remove('shiny-effect');
        element.style.filter = '';
      };

      this.activeEffects.set(effectId, {
        id: effectId,
        name: 'shiny-effect',
        element,
        createdAt: Date.now(),
        cleanup,
      });

    } catch (error) {
      console.error('Erro ao aplicar efeito shiny:', error);
    }
  }

  /**
   * Aplica pulso de energia a um elemento
   * @param container - Elemento para aplicar o pulso
   * @param effectId - ID único para identificar o efeito
   */
  applyEnergyPulse(container: ElementRef<HTMLElement>, effectId: string): void {
    try {
      if (this.prefersReducedMotion()) {
        return;
      }

      const element = container.nativeElement;

      // Remove efeito anterior se existir
      this.removeEffect(effectId);

      element.classList.add('energy-pulse');
      element.style.animation = 'energy-pulse 2s ease-in-out infinite';

      const cleanup = () => {
        element.classList.remove('energy-pulse');
        element.style.animation = '';
      };

      this.activeEffects.set(effectId, {
        id: effectId,
        name: 'energy-pulse',
        element,
        createdAt: Date.now(),
        cleanup,
      });

    } catch (error) {
      console.error('Erro ao aplicar pulso de energia:', error);
    }
  }

  // ====================================================================
  // MÉTODOS PÚBLICOS - GERENCIAMENTO DE EFEITOS
  // ====================================================================

  /**
   * Remove um efeito específico do sistema
   * @param effectId - ID do efeito a ser removido
   */
  removeEffect(effectId: string): void {
    try {
      const effect = this.activeEffects.get(effectId);
      if (effect) {
        effect.cleanup();
        this.activeEffects.delete(effectId);
      }
    } catch (error) {
      console.error('Erro ao remover efeito:', error);
    }
  }

  /**
   * Remove todos os efeitos ativos do sistema
   */
  removeAllEffects(): void {
    try {
      this.activeEffects.forEach(effect => effect.cleanup());
      this.activeEffects.clear();
    } catch (error) {
      console.error('Erro ao remover todos os efeitos:', error);
    }
  }

  /**
   * Obtém informações sobre todos os efeitos ativos
   * @returns Array com informações dos efeitos ativos
   */
  getActiveEffects(): VisualEffect[] {
    return Array.from(this.activeEffects.values());
  }

  /**
   * Verifica se um efeito específico está ativo
   * @param effectId - ID do efeito para verificar
   * @returns True se o efeito estiver ativo
   */
  isEffectActive(effectId: string): boolean {
    return this.activeEffects.has(effectId);
  }

  // ====================================================================
  // MÉTODOS PÚBLICOS - UTILITÁRIOS
  // ====================================================================

  /**
   * Verifica se o dispositivo é mobile
   * @returns True se for um dispositivo móvel
   */
  isMobileDevice(): boolean {
    if (this._isMobile === null) {
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;

      this._isMobile = screenWidth <= 768 ||
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    }
    return this._isMobile;
  }

  /**
   * Verifica se o usuário prefere movimento reduzido (acessibilidade)
   * @returns True se movimento reduzido estiver ativado
   */
  prefersReducedMotion(): boolean {
    if (this._prefersReducedMotion === null) {
      if (typeof window !== 'undefined' && window.matchMedia) {
        this._prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } else {
        this._prefersReducedMotion = false;
      }
    }
    return this._prefersReducedMotion;
  }

  /**
   * Limpa cache de verificações de device e preferências
   */
  clearCache(): void {
    this._isMobile = null;
    this._prefersReducedMotion = null;
  }

  // ====================================================================
  // MÉTODOS PRIVADOS - CRIAÇÃO DE PARTÍCULAS
  // ====================================================================

  /**
   * Cria uma única partícula baseada na configuração
   * @param config - Configuração do tipo de partícula
   * @returns Elemento DOM da partícula criada
   */
  private createParticle(config: ParticleConfig): HTMLElement {
    const particle = document.createElement('div');
    particle.className = `particle particle--${config.type}`;

    // Propriedades aleatórias
    const size = this.randomBetween(config.size.min, config.size.max);
    const duration = this.randomBetween(config.duration.min, config.duration.max);
    const color = config.colors[Math.floor(Math.random() * config.colors.length)];
    const startX = Math.random() * 100;
    const startY = Math.random() * 100;

    // Estilos base
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border-radius: 50%;
      pointer-events: none;
      left: ${startX}%;
      top: ${startY}%;
      animation: particle-${config.animation} ${duration}ms linear infinite;
      opacity: 0.8;
      filter: blur(0.5px);
    `;

    // Remove partícula após a duração
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, duration);

    return particle;
  }

  /**
   * Gera número aleatório entre min e max
   * @param min - Valor mínimo
   * @param max - Valor máximo
   * @returns Número aleatório no intervalo
   */
  private randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Aplica degradação progressiva para dispositivos com menor performance
   * @param baseConfig - Configuração base de partículas
   * @returns Configuração otimizada
   */
  private optimizeForDevice(baseConfig: ParticleConfig): ParticleConfig {
    if (this.isMobileDevice()) {
      return {
        ...baseConfig,
        count: Math.floor(baseConfig.count * 0.6), // 60% das partículas
        duration: {
          min: baseConfig.duration.min * 0.8,
          max: baseConfig.duration.max * 0.8,
        },
      };
    }
    return baseConfig;
  }
}
