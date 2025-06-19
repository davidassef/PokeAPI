// Serviço responsável por gerenciar favoritos de Pokémon
// Segue o princípio de responsabilidade única e código limpo

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageUtil } from '../utils/storage.util';

/**
 * Serviço de favoritos de Pokémon
 * Permite adicionar, remover, consultar e limpar favoritos de forma reativa.
 */
@Injectable({ providedIn: 'root' })
export class PokemonFavoritesService {
  private readonly STORAGE_KEY = 'pokemon-favorites';
  private favoritesSubject = new BehaviorSubject<number[]>(
    StorageUtil.get<number[]>(this.STORAGE_KEY, []),
  );

  /**
   * Observable com a lista de IDs favoritos
   */
  public readonly favorites$: Observable<number[]> = this.favoritesSubject.asObservable();

  /**
   * Adiciona ou remove um Pokémon dos favoritos
   * @param pokemonId ID do Pokémon
   */
  toggleFavorite(pokemonId: number): void {
    const current = this.favoritesSubject.value;
    const isFavorite = current.includes(pokemonId);
    const updated = isFavorite
      ? current.filter(id => id !== pokemonId)
      : [...current, pokemonId];
    this.favoritesSubject.next(updated);
    StorageUtil.set(this.STORAGE_KEY, updated);
  }

  /**
   * Verifica se um Pokémon está nos favoritos
   * @param pokemonId ID do Pokémon
   * @returns true se for favorito
   */
  isFavorite(pokemonId: number): boolean {
    return this.favoritesSubject.value.includes(pokemonId);
  }

  /**
   * Limpa todos os favoritos
   */
  clearFavorites(): void {
    this.favoritesSubject.next([]);
    StorageUtil.set(this.STORAGE_KEY, []);
  }

  /**
   * Retorna a lista atual de IDs favoritos
   */
  getFavorites(): number[] {
    return this.favoritesSubject.value;
  }
}
