import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { interval, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PokeApiService } from './pokeapi.service';

export interface SyncAction {
  pokemonId: number;
  action: 'capture' | 'favorite';
  timestamp: number;
  payload?: any;
}

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly QUEUE_KEY = 'syncQueue';
  private syncing = false;

  constructor(private storage: Storage, private pokeapi: PokeApiService) {
    this.init();
  }

  async init() {
    await this.storage.create();
    this.startSyncLoop();
  }

  async addToQueue(action: SyncAction) {
    const queue = (await this.storage.get(this.QUEUE_KEY)) || [];
    queue.push(action);
    await this.storage.set(this.QUEUE_KEY, queue);
  }

  startSyncLoop() {
    interval(30000).pipe(
      switchMap(() => from(this.syncPending()))
    ).subscribe();
  }

  async syncPending() {
    if (this.syncing) return;
    this.syncing = true;
    const queue = (await this.storage.get(this.QUEUE_KEY)) || [];
    if (queue.length === 0) {
      this.syncing = false;
      return;
    }
    const stillPending = [];
    for (const action of queue) {
      try {
        await this.pokeapi.syncCapture(action); // Implemente esse método no serviço
      } catch {
        stillPending.push(action);
      }
    }
    await this.storage.set(this.QUEUE_KEY, stillPending);
    this.syncing = false;
  }

  async getPendingCount(): Promise<number> {
    const queue = (await this.storage.get(this.QUEUE_KEY)) || [];
    return queue.length;
  }
}
