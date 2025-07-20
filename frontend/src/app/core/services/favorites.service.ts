import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PokemonListItem } from '../../models/pokemon.model';

/**
 * Interface para dados de favoritos
 */
export interface FavoriteData {
  pokemonId: number;
  name: string;
  imageUrl: string;
  types: string[];
  addedAt: Date;
}

/**
 * Interface para estatísticas de favoritos
 */
export interface FavoritesStats {
  total: number;
  byType: { [type: string]: number };
  recentlyAdded: FavoriteData[];
  oldestFavorites: FavoriteData[];
}

/**
 * Serviço para gerenciar Pokémon favoritos do usuário
 * Utiliza localStorage para persistência local
 */
@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'pokemon_favorites';
  private readonly MAX_RECENT_ITEMS = 5;

  // Subject para lista de favoritos
  private favoritesSubject = new BehaviorSubject<FavoriteData[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();

  // Subject para estatísticas
  private statsSubject = new BehaviorSubject<FavoritesStats>(this.getEmptyStats());
  public stats$ = this.statsSubject.asObservable();

  constructor() {
    this.loadFavoritesFromStorage();
  }

  /**
   * Carrega favoritos do localStorage
   */
  private loadFavoritesFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const favorites: FavoriteData[] = JSON.parse(stored);
        // Converter strings de data de volta para objetos Date
        favorites.forEach(fav => {
          fav.addedAt = new Date(fav.addedAt);
        });
        this.favoritesSubject.next(favorites);
        this.updateStats();
      }
    } catch (error) {
      console.error('❌ Erro ao carregar favoritos do localStorage:', error);
      this.favoritesSubject.next([]);
    }
  }

  /**
   * Salva favoritos no localStorage
   */
  private saveFavoritesToStorage(): void {
    try {
      const favorites = this.favoritesSubject.value;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('❌ Erro ao salvar favoritos no localStorage:', error);
    }
  }

  /**
   * Adiciona um Pokémon aos favoritos
   */
  addToFavorites(pokemon: PokemonListItem | any): void {
    const currentFavorites = this.favoritesSubject.value;

    // Verificar se já está nos favoritos
    if (this.isFavorite(pokemon.id)) {
      console.warn('⚠️ Pokémon já está nos favoritos:', pokemon.name);
      return;
    }

    const favoriteData: FavoriteData = {
      pokemonId: pokemon.id,
      name: pokemon.name,
      imageUrl: pokemon.sprites?.front_default || pokemon.imageUrl || '',
      types: pokemon.types?.map((t: any) => t.type?.name || t) || [],
      addedAt: new Date()
    };

    const updatedFavorites = [...currentFavorites, favoriteData];
    this.favoritesSubject.next(updatedFavorites);
    this.saveFavoritesToStorage();
    this.updateStats();
  }

  /**
   * Remove um Pokémon dos favoritos
   */
  removeFromFavorites(pokemonId: number): void {
    const currentFavorites = this.favoritesSubject.value;
    const updatedFavorites = currentFavorites.filter(fav => fav.pokemonId !== pokemonId);

    this.favoritesSubject.next(updatedFavorites);
    this.saveFavoritesToStorage();
    this.updateStats();
  }

  /**
   * Verifica se um Pokémon está nos favoritos
   */
  isFavorite(pokemonId: number): boolean {
    return this.favoritesSubject.value.some(fav => fav.pokemonId === pokemonId);
  }

  /**
   * Alterna o status de favorito de um Pokémon
   */
  toggleFavorite(pokemon: PokemonListItem | any): void {
    if (this.isFavorite(pokemon.id)) {
      this.removeFromFavorites(pokemon.id);
    } else {
      this.addToFavorites(pokemon);
    }
  }

  /**
   * Obtém todos os favoritos
   */
  getFavorites(): FavoriteData[] {
    return this.favoritesSubject.value;
  }

  /**
   * Obtém favoritos ordenados por data (mais recentes primeiro)
   */
  getFavoritesSortedByDate(): FavoriteData[] {
    return [...this.favoritesSubject.value].sort((a, b) =>
      b.addedAt.getTime() - a.addedAt.getTime()
    );
  }

  /**
   * Obtém favoritos filtrados por tipo
   */
  getFavoritesByType(type: string): FavoriteData[] {
    return this.favoritesSubject.value.filter(fav =>
      fav.types.includes(type)
    );
  }

  /**
   * Limpa todos os favoritos
   */
  clearAllFavorites(): void {
    this.favoritesSubject.next([]);
    this.saveFavoritesToStorage();
    this.updateStats();
  }

  /**
   * Atualiza estatísticas dos favoritos
   */
  private updateStats(): void {
    const favorites = this.favoritesSubject.value;

    // Contagem por tipo
    const byType: { [type: string]: number } = {};
    favorites.forEach(fav => {
      fav.types.forEach(type => {
        byType[type] = (byType[type] || 0) + 1;
      });
    });

    // Favoritos recentes (últimos 5)
    const recentlyAdded = [...favorites]
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
      .slice(0, this.MAX_RECENT_ITEMS);

    // Favoritos mais antigos (primeiros 5)
    const oldestFavorites = [...favorites]
      .sort((a, b) => a.addedAt.getTime() - b.addedAt.getTime())
      .slice(0, this.MAX_RECENT_ITEMS);

    const stats: FavoritesStats = {
      total: favorites.length,
      byType,
      recentlyAdded,
      oldestFavorites
    };

    this.statsSubject.next(stats);
  }

  /**
   * Retorna estatísticas vazias
   */
  private getEmptyStats(): FavoritesStats {
    return {
      total: 0,
      byType: {},
      recentlyAdded: [],
      oldestFavorites: []
    };
  }

  /**
   * Exporta favoritos como JSON
   */
  exportFavorites(): string {
    return JSON.stringify(this.favoritesSubject.value, null, 2);
  }

  /**
   * Importa favoritos de JSON
   */
  importFavorites(jsonData: string): boolean {
    try {
      const favorites: FavoriteData[] = JSON.parse(jsonData);

      // Validar estrutura dos dados
      if (!Array.isArray(favorites)) {
        throw new Error('Dados devem ser um array');
      }

      // Converter strings de data para objetos Date
      favorites.forEach(fav => {
        fav.addedAt = new Date(fav.addedAt);
      });

      this.favoritesSubject.next(favorites);
      this.saveFavoritesToStorage();
      this.updateStats();

      return true;
    } catch (error) {
      console.error('❌ Erro ao importar favoritos:', error);
      return false;
    }
  }
}
