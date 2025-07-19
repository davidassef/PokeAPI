import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Interface para informações de navegação
 */
export interface NavigationInfo {
  currentId: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  nextId: number | null;
  previousId: number | null;
  totalPokemon: number;
  position: number; // Posição atual (1-based)
}

/**
 * Serviço especializado para navegação entre Pokémons
 * Centraliza toda lógica de navegação e controle de limites
 */
@Injectable({
  providedIn: 'root'
})
export class PokemonNavigationService {
  private config = {
    enableLogging: !environment.production,
    maxPokemonId: 1010, // Limite atual da PokeAPI
    minPokemonId: 1,
    circularNavigation: true // Permite navegação circular (do último para o primeiro)
  };

  /**
   * Subject para rastrear mudanças de navegação
   */
  private currentNavigationSubject = new BehaviorSubject<NavigationInfo | null>(null);
  public currentNavigation$ = this.currentNavigationSubject.asObservable();

  constructor() {
    // ✅ CLEANUP: Log de inicialização removido - serviço estável
    // if (this.config.enableLogging) {
    //   console.log('🧭 PokemonNavigationService inicializado');
    // }
  }

  /**
   * Obtém informações completas de navegação para um Pokémon
   */
  getNavigationInfo(currentId: number): NavigationInfo {
    const navigationInfo: NavigationInfo = {
      currentId,
      canGoNext: this.canNavigateNext(currentId),
      canGoPrevious: this.canNavigatePrevious(currentId),
      nextId: this.getNextPokemonId(currentId),
      previousId: this.getPreviousPokemonId(currentId),
      totalPokemon: this.config.maxPokemonId,
      position: currentId
    };

    this.currentNavigationSubject.next(navigationInfo);
    this.logIfEnabled('Informações de navegação atualizadas:', navigationInfo);

    return navigationInfo;
  }

  /**
   * Obtém o ID do próximo Pokémon
   */
  getNextPokemonId(currentId: number): number | null {
    if (!this.isValidPokemonId(currentId)) {
      return null;
    }

    if (currentId < this.config.maxPokemonId) {
      return currentId + 1;
    }

    // Navegação circular: do último volta para o primeiro
    return this.config.circularNavigation ? this.config.minPokemonId : null;
  }

  /**
   * Obtém o ID do Pokémon anterior
   */
  getPreviousPokemonId(currentId: number): number | null {
    if (!this.isValidPokemonId(currentId)) {
      return null;
    }

    if (currentId > this.config.minPokemonId) {
      return currentId - 1;
    }

    // Navegação circular: do primeiro volta para o último
    return this.config.circularNavigation ? this.config.maxPokemonId : null;
  }

  /**
   * Verifica se pode navegar para o próximo Pokémon
   */
  canNavigateNext(currentId: number): boolean {
    if (!this.isValidPokemonId(currentId)) {
      return false;
    }

    return currentId < this.config.maxPokemonId || this.config.circularNavigation;
  }

  /**
   * Verifica se pode navegar para o Pokémon anterior
   */
  canNavigatePrevious(currentId: number): boolean {
    if (!this.isValidPokemonId(currentId)) {
      return false;
    }

    return currentId > this.config.minPokemonId || this.config.circularNavigation;
  }

  /**
   * Navega para o próximo Pokémon
   */
  navigateNext(currentId: number): number | null {
    const nextId = this.getNextPokemonId(currentId);

    if (nextId) {
      this.logIfEnabled('Navegando para próximo:', currentId, '->', nextId);
      this.getNavigationInfo(nextId); // Atualiza o subject
    }

    return nextId;
  }

  /**
   * Navega para o Pokémon anterior
   */
  navigatePrevious(currentId: number): number | null {
    const previousId = this.getPreviousPokemonId(currentId);

    if (previousId) {
      this.logIfEnabled('Navegando para anterior:', currentId, '->', previousId);
      this.getNavigationInfo(previousId); // Atualiza o subject
    }

    return previousId;
  }

  /**
   * Navega para um Pokémon específico
   */
  navigateTo(pokemonId: number): boolean {
    if (!this.isValidPokemonId(pokemonId)) {
      this.logIfEnabled('ID de Pokémon inválido:', pokemonId);
      return false;
    }

    this.logIfEnabled('Navegando para Pokémon:', pokemonId);
    this.getNavigationInfo(pokemonId);
    return true;
  }

  /**
   * Obtém uma lista de IDs adjacentes para preload
   */
  getAdjacentIds(currentId: number, range: number = 2): number[] {
    const adjacentIds: number[] = [];

    for (let i = -range; i <= range; i++) {
      if (i === 0) continue; // Pular o ID atual

      const adjacentId = currentId + i;
      if (this.isValidPokemonId(adjacentId)) {
        adjacentIds.push(adjacentId);
      }
    }

    this.logIfEnabled('IDs adjacentes gerados:', adjacentIds);
    return adjacentIds;
  }

  /**
   * Obtém informações de progresso (posição atual / total)
   */
  getProgressInfo(currentId: number): { current: number; total: number; percentage: number } {
    const current = Math.max(1, Math.min(currentId, this.config.maxPokemonId));
    const total = this.config.maxPokemonId;
    const percentage = Math.round((current / total) * 100);

    return { current, total, percentage };
  }

  /**
   * Verifica se um ID de Pokémon é válido
   */
  isValidPokemonId(pokemonId: number): boolean {
    return Number.isInteger(pokemonId) &&
           pokemonId >= this.config.minPokemonId &&
           pokemonId <= this.config.maxPokemonId;
  }

  /**
   * Obtém o primeiro Pokémon válido
   */
  getFirstPokemonId(): number {
    return this.config.minPokemonId;
  }

  /**
   * Obtém o último Pokémon válido
   */
  getLastPokemonId(): number {
    return this.config.maxPokemonId;
  }

  /**
   * Obtém um Pokémon aleatório
   */
  getRandomPokemonId(): number {
    const randomId = Math.floor(Math.random() * this.config.maxPokemonId) + 1;
    this.logIfEnabled('Pokémon aleatório gerado:', randomId);
    return randomId;
  }

  /**
   * Configura navegação circular
   */
  setCircularNavigation(enabled: boolean): void {
    this.config.circularNavigation = enabled;
    this.logIfEnabled('Navegação circular:', enabled ? 'habilitada' : 'desabilitada');
  }

  /**
   * Verifica se navegação circular está habilitada
   */
  isCircularNavigationEnabled(): boolean {
    return this.config.circularNavigation;
  }

  /**
   * Obtém configurações atuais
   */
  getConfig(): {
    maxPokemonId: number;
    minPokemonId: number;
    circularNavigation: boolean;
  } {
    return {
      maxPokemonId: this.config.maxPokemonId,
      minPokemonId: this.config.minPokemonId,
      circularNavigation: this.config.circularNavigation
    };
  }

  /**
   * Atualiza limite máximo de Pokémons (para futuras expansões)
   */
  updateMaxPokemonId(newMax: number): void {
    if (newMax > 0) {
      this.config.maxPokemonId = newMax;
      this.logIfEnabled('Limite máximo atualizado para:', newMax);
    }
  }

  /**
   * Log condicional (apenas em desenvolvimento)
   */
  private logIfEnabled(message: string, ...args: any[]): void {
    if (this.config.enableLogging) {
      console.log(`[PokemonNavigationService] ${message}`, ...args);
    }
  }
}
