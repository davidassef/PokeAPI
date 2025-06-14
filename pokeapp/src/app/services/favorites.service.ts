import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { FavoritePokemon } from '../models/pokemon.model';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly FAVORITES_KEY = 'pokemon_favorites';
  private favoritesSubject = new BehaviorSubject<FavoritePokemon[]>([]);
  private storageReady = false;

  constructor(private storage: Storage) {
    this.initStorage();
  }

  /**
   * Inicializa o storage e carrega favoritos
   */
  private async initStorage(): Promise<void> {
    try {
      await this.storage.create();
      this.storageReady = true;
      await this.loadFavorites();
    } catch (error) {
      console.error('Erro ao inicializar storage:', error);
    }
  }

  /**
   * Carrega favoritos do storage
   */
  private async loadFavorites(): Promise<void> {
    if (!this.storageReady) return;

    try {
      const favorites = await this.storage.get(this.FAVORITES_KEY) || [];
      this.favoritesSubject.next(favorites);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      this.favoritesSubject.next([]);
    }
  }

  /**
   * Salva favoritos no storage
   */
  private async saveFavorites(favorites: FavoritePokemon[]): Promise<void> {
    if (!this.storageReady) return;

    try {
      await this.storage.set(this.FAVORITES_KEY, favorites);
      this.favoritesSubject.next(favorites);
    } catch (error) {
      console.error('Erro ao salvar favoritos:', error);
    }
  }

  /**
   * Retorna Observable dos favoritos
   */
  getFavorites(): Observable<FavoritePokemon[]> {
    return this.favoritesSubject.asObservable();
  }

  /**
   * Retorna lista atual de favoritos
   */
  getCurrentFavorites(): FavoritePokemon[] {
    return this.favoritesSubject.value;
  }

  /**
   * Adiciona Pokémon aos favoritos
   */
  async addToFavorites(pokemon: {
    id: number;
    name: string;
    imageUrl: string;
  }): Promise<boolean> {
    try {
      const currentFavorites = this.getCurrentFavorites();

      // Verifica se já existe nos favoritos
      if (this.isFavorite(pokemon.id)) {
        return false;
      }

      const newFavorite: FavoritePokemon = {
        id: pokemon.id,
        name: pokemon.name,
        imageUrl: pokemon.imageUrl,
        dateAdded: new Date()
      };

      const updatedFavorites = [...currentFavorites, newFavorite];
      await this.saveFavorites(updatedFavorites);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      return false;
    }
  }

  /**
   * Remove Pokémon dos favoritos
   */
  async removeFromFavorites(pokemonId: number): Promise<boolean> {
    try {
      const currentFavorites = this.getCurrentFavorites();
      const updatedFavorites = currentFavorites.filter(
        fav => fav.id !== pokemonId
      );

      await this.saveFavorites(updatedFavorites);
      return true;
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      return false;
    }
  }

  /**
   * Verifica se Pokémon é favorito
   */
  isFavorite(pokemonId: number): boolean {
    const favorites = this.getCurrentFavorites();
    return favorites.some(fav => fav.id === pokemonId);
  }

  /**
   * Alterna status de favorito
   */
  async toggleFavorite(pokemon: {
    id: number;
    name: string;
    imageUrl: string;
  }): Promise<boolean> {
    if (this.isFavorite(pokemon.id)) {
      return await this.removeFromFavorites(pokemon.id);
    } else {
      return await this.addToFavorites(pokemon);
    }
  }

  /**
   * Limpa todos os favoritos
   */
  async clearAllFavorites(): Promise<void> {
    try {
      await this.saveFavorites([]);
    } catch (error) {
      console.error('Erro ao limpar favoritos:', error);
    }
  }

  /**
   * Retorna quantidade de favoritos
   */
  getFavoritesCount(): number {
    return this.getCurrentFavorites().length;
  }

  /**
   * Busca favorito por ID
   */
  getFavoriteById(id: number): FavoritePokemon | undefined {
    return this.getCurrentFavorites().find(fav => fav.id === id);
  }
}
