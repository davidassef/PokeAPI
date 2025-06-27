import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { FavoritePokemon, Pokemon } from '../../models/pokemon.model';

/**
 * Serviço para gerenciar Pokémons favoritos
 * Utiliza Ionic Storage para persistência local
 */
@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly FAVORITES_KEY = 'favorite_pokemons';
  private favoritesSubject = new BehaviorSubject<FavoritePokemon[]>([]);
  private storageReady = false;

  public favorites$ = this.favoritesSubject.asObservable();

  constructor(private storage: Storage) {
    this.initStorage();
  }

  /**
   * Inicializa o storage e carrega favoritos existentes
   */
  private async initStorage(): Promise<void> {
    await this.storage.create();
    this.storageReady = true;
    await this.loadFavorites();
  }

  /**
   * Carrega favoritos do storage local
   */
  private async loadFavorites(): Promise<void> {
    if (!this.storageReady) {
      await this.initStorage();
    }

    try {
      const favorites = await this.storage.get(this.FAVORITES_KEY) || [];
      this.favoritesSubject.next(favorites);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      this.favoritesSubject.next([]);
    }
  }

  /**
   * Salva favoritos no storage local
   * @param favorites Lista de favoritos para salvar
   */
  private async saveFavorites(favorites: FavoritePokemon[]): Promise<void> {
    if (!this.storageReady) {
      await this.initStorage();
    }

    try {
      await this.storage.set(this.FAVORITES_KEY, favorites);
      this.favoritesSubject.next(favorites);
    } catch (error) {
      console.error('Erro ao salvar favoritos:', error);
    }
  }

  /**
   * Adiciona um Pokémon aos favoritos
   * @param pokemon Pokémon para adicionar aos favoritos
   * @returns Promise<boolean> true se adicionado com sucesso
   */
  async addToFavorites(pokemon: Pokemon): Promise<boolean> {
    try {
      const currentFavorites = this.favoritesSubject.value;

      // Verifica se já está nos favoritos
      const exists = currentFavorites.some(fav => fav.pokemon_id === pokemon.id);
      if (exists) {
        return false;
      }

      const newFavorite: FavoritePokemon = {
        user_id: 1, // ID padrão do usuário local
        pokemon_id: pokemon.id,
        pokemon_name: pokemon.name,
        created_at: new Date().toISOString()
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
   * Remove um Pokémon dos favoritos
   * @param pokemonId ID do Pokémon para remover
   * @returns Promise<boolean> true se removido com sucesso
   */
  async removeFromFavorites(pokemonId: number): Promise<boolean> {
    try {
      const currentFavorites = this.favoritesSubject.value;
      const updatedFavorites = currentFavorites.filter(fav => fav.pokemon_id !== pokemonId);

      if (updatedFavorites.length === currentFavorites.length) {
        return false; // Não foi encontrado
      }

      await this.saveFavorites(updatedFavorites);
      return true;
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      return false;
    }
  }

  /**
   * Verifica se um Pokémon está nos favoritos
   * @param pokemonId ID do Pokémon
   * @returns boolean true se está nos favoritos
   */
  isFavorite(pokemonId: number): boolean {
    return this.favoritesSubject.value.some(fav => fav.pokemon_id === pokemonId);
  }

  /**
   * Obtém todos os favoritos
   * @returns Observable<FavoritePokemon[]>
   */
  getFavorites(): Observable<FavoritePokemon[]> {
    return this.favorites$;
  }

  /**
   * Obtém a quantidade de favoritos
   * @returns number quantidade de favoritos
   */
  getFavoritesCount(): number {
    return this.favoritesSubject.value.length;
  }

  /**
   * Alterna o status de favorito de um Pokémon
   * @param pokemon Pokémon para alternar status
   * @returns Promise<boolean> true se foi adicionado, false se foi removido
   */
  async toggleFavorite(pokemon: Pokemon): Promise<boolean> {
    if (this.isFavorite(pokemon.id)) {
      await this.removeFromFavorites(pokemon.id);
      return false;
    } else {
      await this.addToFavorites(pokemon);
      return true;
    }
  }

  /**
   * Limpa todos os favoritos
   * @returns Promise<void>
   */
  async clearAllFavorites(): Promise<void> {
    await this.saveFavorites([]);
  }

  /**
   * Exporta favoritos como JSON
   * @returns string JSON dos favoritos
   */
  exportFavorites(): string {
    return JSON.stringify(this.favoritesSubject.value, null, 2);
  }

  /**
   * Importa favoritos a partir de JSON
   * @param jsonData String JSON com dados dos favoritos
   * @returns Promise<boolean> true se importado com sucesso
   */
  async importFavorites(jsonData: string): Promise<boolean> {
    try {
      const favorites: FavoritePokemon[] = JSON.parse(jsonData);

      // Valida estrutura dos dados
      const isValid = Array.isArray(favorites) &&
        favorites.every(fav =>
          fav.pokemon_id &&
          fav.pokemon_name &&
          typeof fav.pokemon_id === 'number'
        );

      if (!isValid) {
        throw new Error('Formato de dados inválido');
      }

      await this.saveFavorites(favorites);
      return true;
    } catch (error) {
      console.error('Erro ao importar favoritos:', error);
      return false;
    }
  }
}
