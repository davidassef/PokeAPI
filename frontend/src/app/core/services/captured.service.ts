import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { FavoritePokemon, Pokemon } from '../../models/pokemon.model';
import { SyncAction, SyncService } from './sync.service';
import { ClientSyncService } from './client-sync.service';
import { SyncConfigService } from './sync-config.service';

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

  constructor(
    private storage: Storage,
    private syncService: SyncService,
    private clientSyncService: ClientSyncService,
    private http: HttpClient,
    private syncConfig: SyncConfigService
  ) {
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

      // Sincronização baseada na configuração
      await this.syncCapture(pokemon.id, pokemon.name, 'capture', false);

      return true;
    } catch (error) {
      console.error('[CapturedService] Erro ao adicionar captura:', error);
      return false;
    }
  }

  async removeFromCaptured(pokemonId: number): Promise<boolean> {
    try {
      const current = this.capturedSubject.value;
      const toRemove = current.find(c => c.pokemon_id === pokemonId);
      if (!toRemove) return false;

      const updated = current.filter(c => c.pokemon_id !== pokemonId);
      await this.saveCaptured(updated);

      // Sincronização baseada na configuração
      await this.syncCapture(pokemonId, toRemove.pokemon_name, 'capture', true);

      return true;
    } catch (error) {
      console.error('[CapturedService] Erro ao remover captura:', error);
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
  /**
   * Sincroniza captura baseado na configuração (push ou pull)
   */
  private async syncCapture(pokemonId: number, pokemonName: string, action: string, removed: boolean): Promise<void> {
    try {
      const syncType = this.syncConfig.getSyncType();

      if (this.syncConfig.isDebugMode()) {
        console.log(`[CapturedService] Sincronizando com modo: ${syncType}`);
      }

      // Sistema Pull (prioritário para evitar duplicação)
      if (this.syncConfig.shouldUsePullSync()) {
        await this.sendToClientServer(pokemonId, pokemonName, action, removed);

        if (this.syncConfig.isDebugMode()) {
          console.log('[CapturedService] ✅ Dados enviados via sistema PULL-BASED');
        }

        // Se está em modo estrito, não executa o push
        if (this.syncConfig.isStrictMode()) {
          return;
        }
      }

      // Sistema Push (apenas se não estiver em modo estrito)
      if (this.syncConfig.shouldUsePushSync() && !this.syncConfig.isStrictMode()) {
        const syncAction: SyncAction = {
          pokemonId: pokemonId,
          action: action as 'capture' | 'favorite',
          timestamp: Date.now(),
          payload: {
            pokemonName: pokemonName,
            removed: removed
          }
        };

        await this.syncService.addToQueue(syncAction);

        // Forçar sincronização imediata no sistema push
        setTimeout(() => {
          this.syncService.forceSyncNow();
        }, 1000);

        if (this.syncConfig.isDebugMode()) {
          console.log('[CapturedService] ⚠️  Dados enviados via sistema PUSH:', syncAction);
        }
      }

    } catch (error) {
      console.error('[CapturedService] Erro na sincronização:', error);
    }
  }

  /**
   * Envia captura para o servidor do cliente (sistema pull)
   */
  private async sendToClientServer(pokemonId: number, pokemonName: string, action: string, removed: boolean): Promise<void> {
    try {
      const clientServerUrl = this.syncConfig.getClientServerUrl();

      await this.http.post(`${clientServerUrl}/api/client/add-capture`, {
        pokemon_id: pokemonId,
        pokemon_name: pokemonName,
        action: action,
        removed: removed
      }).toPromise();

      if (this.syncConfig.isDebugMode()) {
        console.log(`[CapturedService] 📡 Captura enviada para ${clientServerUrl} (pull-based)`);
      }
    } catch (error) {
      console.error('[CapturedService] ❌ Erro ao enviar para servidor do cliente:', error);
    }
  }
}
