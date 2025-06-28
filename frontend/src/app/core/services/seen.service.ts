import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SeenService {
  private readonly SEEN_KEY = 'seen_pokemons';
  private seenSubject = new BehaviorSubject<number[]>([]);
  private storageReady = false;

  public seen$ = this.seenSubject.asObservable();

  constructor(private storage: Storage) {
    this.initStorage();
  }

  private async initStorage(): Promise<void> {
    await this.storage.create();
    this.storageReady = true;
    await this.loadSeen();
  }

  private async loadSeen(): Promise<void> {
    if (!this.storageReady) {
      await this.initStorage();
    }
    try {
      const seen = await this.storage.get(this.SEEN_KEY) || [];
      this.seenSubject.next(seen);
    } catch (error) {
      console.error('Erro ao carregar vistos:', error);
      this.seenSubject.next([]);
    }
  }

  private async saveSeen(seen: number[]): Promise<void> {
    if (!this.storageReady) {
      await this.initStorage();
    }
    try {
      await this.storage.set(this.SEEN_KEY, seen);
      this.seenSubject.next(seen);
    } catch (error) {
      console.error('Erro ao salvar vistos:', error);
    }
  }

  async addToSeen(pokemonId: number): Promise<void> {
    const current = this.seenSubject.value;
    if (!current.includes(pokemonId)) {
      const updated = [...current, pokemonId];
      await this.saveSeen(updated);
    }
  }

  async removeFromSeen(pokemonId: number): Promise<void> {
    const current = this.seenSubject.value;
    const updated = current.filter(id => id !== pokemonId);
    await this.saveSeen(updated);
  }

  isSeen(pokemonId: number): boolean {
    return this.seenSubject.value.includes(pokemonId);
  }

  getSeen(): Observable<number[]> {
    return this.seen$;
  }

  getSeenCount(): number {
    return this.seenSubject.value.length;
  }

  async clearAllSeen(): Promise<void> {
    await this.saveSeen([]);
  }
} 