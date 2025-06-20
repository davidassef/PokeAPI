import { Injectable } from '@angular/core';

/**
 * Serviço de conquistas do usuário na Pokédex.
 * Gerencia desbloqueio e persistência de conquistas.
 */
@Injectable({ providedIn: 'root' })
export class PokeUiAchievementsService {
  private readonly STORAGE_KEY = 'pokeui:achievements';
  private defaultAchievements = [
    { id: 'first-fav', name: 'Primeiro Favorito', description: 'Adicione seu primeiro Pokémon aos favoritos.', unlocked: false },
    { id: 'ten-favs', name: 'Coleção Inicial', description: 'Adicione 10 Pokémon aos favoritos.', unlocked: false },
    { id: 'all-favs', name: 'Coleção Completa', description: 'Adicione todos os Pokémon aos favoritos.', unlocked: false },
  ];

  getAchievements() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return this.defaultAchievements;
  }

  unlock(id: string) {
    const ach = this.getAchievements();
    const idx = ach.findIndex((a: any) => a.id === id);
    if (idx >= 0 && !ach[idx].unlocked) {
      ach[idx].unlocked = true;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ach));
    }
  }

  checkAndUnlock(favCount: number, total: number) {
    if (favCount >= 1) this.unlock('first-fav');
    if (favCount >= 10) this.unlock('ten-favs');
    if (favCount === total) this.unlock('all-favs');
  }
}
