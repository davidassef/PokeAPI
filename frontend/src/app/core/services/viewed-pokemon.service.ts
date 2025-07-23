import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';

export interface ViewedPokemonData {
  userId?: string;
  viewedPokemonIds: Set<number>;
  totalPokemonCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ViewedPokemonService {
  private readonly STORAGE_KEY = 'viewed_pokemon_data';
  private readonly TOTAL_POKEMON_COUNT = 1010; // Current total Pokemon count in PokeAPI

  private viewedPokemonSubject = new BehaviorSubject<ViewedPokemonData>({
    viewedPokemonIds: new Set<number>(),
    totalPokemonCount: this.TOTAL_POKEMON_COUNT
  });

  public viewedPokemon$ = this.viewedPokemonSubject.asObservable();

  constructor(
    private authService: AuthService,
    private logger: LoggerService
  ) {
    this.loadViewedPokemon();

    // ✅ CORREÇÃO CRÍTICA: Não limpar dados no logout, apenas recarregar quando logar
    this.authService.getAuthState().subscribe((isAuthenticated: boolean) => {
      if (isAuthenticated) {
        this.loadViewedPokemon();
      } else {
        // ✅ CORREÇÃO: Não limpar dados no logout - preservar para próximo login
        console.log('[ViewedPokemonService] Logout detectado, mantendo dados visualizados');
      }
    });
  }

  /**
   * Mark a Pokemon as viewed
   * @param pokemonId The ID of the Pokemon that was viewed
   */
  markPokemonAsViewed(pokemonId: number): void {
    const currentData = this.viewedPokemonSubject.value;
    const currentUser = this.authService.getCurrentUser();

    // Create new Set to ensure immutability
    const updatedViewedIds = new Set(currentData.viewedPokemonIds);
    updatedViewedIds.add(pokemonId);

    const updatedData: ViewedPokemonData = {
      userId: currentUser?.id,
      viewedPokemonIds: updatedViewedIds,
      totalPokemonCount: this.TOTAL_POKEMON_COUNT
    };

    this.viewedPokemonSubject.next(updatedData);
    this.saveViewedPokemon(updatedData);

    console.log(`[ViewedPokemonService] Pokemon ${pokemonId} marked as viewed. Total viewed: ${updatedViewedIds.size}`);
  }

  /**
   * Get the count of viewed Pokemon
   */
  getViewedCount(): number {
    return this.viewedPokemonSubject.value.viewedPokemonIds.size;
  }

  /**
   * Get the completion percentage
   */
  getCompletionPercentage(): number {
    const viewedCount = this.getViewedCount();
    return Math.round((viewedCount / this.TOTAL_POKEMON_COUNT) * 100);
  }

  /**
   * Check if a Pokemon has been viewed
   * @param pokemonId The ID of the Pokemon to check
   */
  isPokemonViewed(pokemonId: number): boolean {
    return this.viewedPokemonSubject.value.viewedPokemonIds.has(pokemonId);
  }

  /**
   * Get all viewed Pokemon IDs
   */
  getViewedPokemonIds(): number[] {
    return Array.from(this.viewedPokemonSubject.value.viewedPokemonIds);
  }

  /**
   * Load viewed Pokemon data from localStorage
   */
  private loadViewedPokemon(): void {
    try {
      const currentUser = this.authService.getCurrentUser();
      const storageKey = currentUser ? `${this.STORAGE_KEY}_${currentUser.id}` : this.STORAGE_KEY;

      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const parsedData = JSON.parse(storedData);

        // Convert array back to Set
        const viewedIds = new Set<number>(parsedData.viewedPokemonIds || []);

        const loadedData: ViewedPokemonData = {
          userId: parsedData.userId,
          viewedPokemonIds: viewedIds,
          totalPokemonCount: this.TOTAL_POKEMON_COUNT
        };

        this.viewedPokemonSubject.next(loadedData);
        // ✅ OTIMIZAÇÃO: Log apenas em debug
        this.logger.debug('viewedPokemon', `Carregados ${viewedIds.size} Pokémon visualizados para usuário ${currentUser?.id || 'anonymous'}`);
      }
    } catch (error) {
      this.logger.error('viewedPokemon', 'Erro ao carregar dados de Pokémon visualizados', error);
      this.resetViewedPokemon();
    }
  }

  /**
   * Save viewed Pokemon data to localStorage
   */
  private saveViewedPokemon(data: ViewedPokemonData): void {
    try {
      const currentUser = this.authService.getCurrentUser();
      const storageKey = currentUser ? `${this.STORAGE_KEY}_${currentUser.id}` : this.STORAGE_KEY;

      // Convert Set to array for JSON serialization
      const dataToSave = {
        userId: data.userId,
        viewedPokemonIds: Array.from(data.viewedPokemonIds),
        totalPokemonCount: data.totalPokemonCount,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('[ViewedPokemonService] Error saving viewed Pokemon data:', error);
    }
  }

  /**
   * Clear viewed Pokemon data (used when user logs out)
   */
  private clearViewedPokemon(): void {
    const clearedData: ViewedPokemonData = {
      viewedPokemonIds: new Set<number>(),
      totalPokemonCount: this.TOTAL_POKEMON_COUNT
    };

    this.viewedPokemonSubject.next(clearedData);
    // ✅ OTIMIZAÇÃO: Log apenas em debug
    this.logger.debug('viewedPokemon', 'Dados de Pokémon visualizados limpos');
  }

  /**
   * Reset viewed Pokemon data to initial state
   */
  private resetViewedPokemon(): void {
    const resetData: ViewedPokemonData = {
      viewedPokemonIds: new Set<number>(),
      totalPokemonCount: this.TOTAL_POKEMON_COUNT
    };

    this.viewedPokemonSubject.next(resetData);
    this.saveViewedPokemon(resetData);
  }

  /**
   * Get current viewed Pokemon data
   */
  getCurrentData(): ViewedPokemonData {
    return this.viewedPokemonSubject.value;
  }

  /**
   * Import viewed Pokemon data (useful for data migration or sync)
   * @param pokemonIds Array of Pokemon IDs to mark as viewed
   */
  importViewedPokemon(pokemonIds: number[]): void {
    const currentData = this.viewedPokemonSubject.value;
    const currentUser = this.authService.getCurrentUser();

    const updatedViewedIds = new Set([...currentData.viewedPokemonIds, ...pokemonIds]);

    const updatedData: ViewedPokemonData = {
      userId: currentUser?.id,
      viewedPokemonIds: updatedViewedIds,
      totalPokemonCount: this.TOTAL_POKEMON_COUNT
    };

    this.viewedPokemonSubject.next(updatedData);
    this.saveViewedPokemon(updatedData);

    console.log(`[ViewedPokemonService] Imported ${pokemonIds.length} Pokemon IDs. Total viewed: ${updatedViewedIds.size}`);
  }
}
