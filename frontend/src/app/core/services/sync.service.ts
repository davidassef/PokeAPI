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
    try {
      const queue = (await this.storage.get(this.QUEUE_KEY)) || [];
      queue.push(action);
      await this.storage.set(this.QUEUE_KEY, queue);
      console.log('[SyncService] Ação adicionada à fila:', action);
      console.log('[SyncService] Fila atual tem', queue.length, 'itens');
    } catch (error) {
      console.error('[SyncService] Erro ao adicionar à fila:', error);
    }
  }

  startSyncLoop() {
    interval(30000).pipe(
      switchMap(() => from(this.syncPending()))
    ).subscribe();
  }

  async syncPending() {
    if (this.syncing) return;
    this.syncing = true;

    try {
      const queue = (await this.storage.get(this.QUEUE_KEY)) || [];
      if (queue.length === 0) {
        this.syncing = false;
        return;
      }

      console.log('[SyncService] Iniciando sincronização de', queue.length, 'ações');
      const stillPending = [];

      for (const action of queue) {
        try {
          console.log('[SyncService] Sincronizando:', action);
          await this.pokeapi.syncCapture(action);
          console.log('[SyncService] Sucesso na sincronização da ação:', action.pokemonId);
        } catch (error) {
          console.error('[SyncService] Erro na sincronização:', error);
          stillPending.push(action);
        }
      }

      await this.storage.set(this.QUEUE_KEY, stillPending);
      console.log('[SyncService] Sincronização concluída.', stillPending.length, 'ações ainda pendentes');
    } catch (error) {
      console.error('[SyncService] Erro geral na sincronização:', error);
    } finally {
      this.syncing = false;
    }
  }

  async getPendingCount(): Promise<number> {
    const queue = (await this.storage.get(this.QUEUE_KEY)) || [];
    return queue.length;
  }

  async forceSyncNow(): Promise<void> {
    console.log('[SyncService] Forçando sincronização imediata...');
    await this.syncPending();
  }
}
