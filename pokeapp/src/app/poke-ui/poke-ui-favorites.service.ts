/**
 * Serviço responsável pelo gerenciamento de Pokémons favoritos.
 * Utiliza localStorage para persistência dos dados entre sessões.
 */
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PokeUiFavoritesService {
  private key = 'pokeui-favorites';

  /**
   * Obtém a lista de IDs dos Pokémons favoritos salvos no localStorage.
   * @returns Array com os IDs dos Pokémons favoritos
   */
  getFavorites(): number[] {
    return JSON.parse(localStorage.getItem(this.key) || '[]');
  }

  /**
   * Adiciona um Pokémon à lista de favoritos se ainda não estiver presente.
   * @param id ID do Pokémon a ser adicionado aos favoritos
   */
  addFavorite(id: number): void {
    const favs = this.getFavorites();
    if (!favs.includes(id)) {
      favs.push(id);
      localStorage.setItem(this.key, JSON.stringify(favs));
    }
  }

  /**
   * Remove um Pokémon da lista de favoritos.
   * @param id ID do Pokémon a ser removido dos favoritos
   */
  removeFavorite(id: number): void {
    const favs = this.getFavorites().filter(f => f !== id);
    localStorage.setItem(this.key, JSON.stringify(favs));
  }

  /**
   * Alterna o status de favorito de um Pokémon (adiciona se não estiver, remove se estiver).
   * @param id ID do Pokémon para alternar status de favorito
   */
  toggleFavorite(id: number): void {
    if (this.isFavorite(id)) {
      this.removeFavorite(id);
    } else {
      this.addFavorite(id);
    }
  }

  /**
   * Verifica se um Pokémon está na lista de favoritos.
   * @param id ID do Pokémon a ser verificado
   * @returns true se o Pokémon estiver nos favoritos, false caso contrário
   */
  isFavorite(id: number): boolean {
    return this.getFavorites().includes(id);
  }
}
