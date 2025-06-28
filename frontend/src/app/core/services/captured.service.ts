import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { FavoritePokemon, Pokemon } from '../../models/pokemon.model';

/**
 * Serviço para gerenciar Pokémons capturados
 * Utiliza Ionic Storage para persistência local
 */
@Injectable({
  providedIn: 'root'
})
export class CapturedService {
  private readonly CAPTURED_KEY = 'captured_pokemons';
  private capturedSubject = new BehaviorSubject<FavoritePokemon[]>([]);
  private storageReady = false;

  public captured$ = this.capturedSubject.asObservable();

  constructor(private storage: Storage) {
    this.initStorage();
  }

  private async initStorage(): Promise<void> {
    await this.storage.create();
    this.storageReady = true;
    await this.loadCaptured();
  }

  private async loadCaptured(): Promise<void> {
    if (!this.storageReady) {
      await this.initStorage();
    }
    try {
      const captured = await this.storage.get(this.CAPTURED_KEY) || [];
      this.capturedSubject.next(captured);
    } catch (error) {
      this.capturedSubject.next([]);
    }
  }

  private async saveCaptured(captured: FavoritePokemon[]): Promise<void> {
    if (!this.storageReady) {
      await this.initStorage();
    }
    try {
      await this.storage.set(this.CAPTURED_KEY, captured);
      this.capturedSubject.next(captured);
    } catch (error) {
    }
  }

  async addToCaptured(pokemon: Pokemon): Promise<boolean> {
    try {
      const current = this.capturedSubject.value;
      const exists = current.some(c => c.pokemon_id === pokemon.id);
      if (exists) return false;
      const newCaptured: FavoritePokemon = {
        user_id: 1,
        pokemon_id: pokemon.id,
        pokemon_name: pokemon.name,
        created_at: new Date().toISOString()
      };
      const updated = [...current, newCaptured];
      await this.saveCaptured(updated);
      return true;
    } catch (error) {
      return false;
    }
  }

  async removeFromCaptured(pokemonId: number): Promise<boolean> {
    try {
      const current = this.capturedSubject.value;
      const updated = current.filter(c => c.pokemon_id !== pokemonId);
      if (updated.length === current.length) return false;
      await this.saveCaptured(updated);
      return true;
    } catch (error) {
      return false;
    }
  }

  isCaptured(pokemonId: number): boolean {
    return this.capturedSubject.value.some(c => c.pokemon_id === pokemonId);
  }

  getCaptured(): Observable<FavoritePokemon[]> {
    return this.captured$;
  }

  getCapturedCount(): number {
    return this.capturedSubject.value.length;
  }

  async toggleCaptured(pokemon: Pokemon): Promise<boolean> {
    if (this.isCaptured(pokemon.id)) {
      await this.removeFromCaptured(pokemon.id);
      return false;
    } else {
      await this.addToCaptured(pokemon);
      return true;
    }
  }

  async clearAllCaptured(): Promise<void> {
    await this.saveCaptured([]);
  }

  exportCaptured(): string {
    return JSON.stringify(this.capturedSubject.value, null, 2);
  }

  async importCaptured(jsonData: string): Promise<boolean> {
    try {
      const captured: FavoritePokemon[] = JSON.parse(jsonData);
      const isValid = Array.isArray(captured) &&
        captured.every(c => c.pokemon_id && c.pokemon_name && typeof c.pokemon_id === 'number');
      if (!isValid) throw new Error('Formato de dados inválido');
      await this.saveCaptured(captured);
      return true;
    } catch (error) {
      return false;
    }
  }
}
