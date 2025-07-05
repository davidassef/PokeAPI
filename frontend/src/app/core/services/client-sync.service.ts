import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CaptureData {
  capture_id: string;
  pokemon_id: number;
  pokemon_name: string;
  action: 'capture' | 'favorite';
  timestamp: string;
  user_id: string;
  synced: boolean;
  metadata?: any;
}

export interface ClientSyncData {
  user_id: string;
  client_url?: string;
  captures: CaptureData[];
  last_sync?: string;
  total_pending: number;
}

/**
 * Serviço para expor dados do cliente para o backend puxar (pull-based sync)
 */
@Injectable({
  providedIn: 'root'
})
export class ClientSyncService {
  private readonly SYNC_DATA_KEY = 'client_sync_data';
  private readonly LAST_SYNC_KEY = 'last_sync_timestamp';
  private readonly USER_ID = 'user_1'; // Por enquanto fixo
  private storageReady = false;

  constructor(
    private http: HttpClient,
    private storage: Storage
  ) {
    this.initStorage();
  }

  private async initStorage(): Promise<void> {
    await this.storage.create();
    this.storageReady = true;
  }

  /**
   * Adiciona uma captura aos dados de sincronização
   */
  async addCaptureToSync(pokemonId: number, pokemonName: string, action: 'capture' | 'favorite', removed: boolean = false): Promise<void> {
    if (!this.storageReady) {
      await this.initStorage();
    }

    const captureData: CaptureData = {
      capture_id: `${pokemonId}_${Date.now()}_${action}`,
      pokemon_id: pokemonId,
      pokemon_name: pokemonName,
      action: action,
      timestamp: new Date().toISOString(),
      user_id: this.USER_ID,
      synced: false,
      metadata: {
        removed: removed,
        client_version: '1.0.0',
        device_info: navigator.userAgent
      }
    };

    try {
      const existingData = await this.storage.get(this.SYNC_DATA_KEY) || [];
      const updatedData = [...existingData, captureData];
      await this.storage.set(this.SYNC_DATA_KEY, updatedData);
      console.log('[ClientSyncService] Captura adicionada aos dados de sync:', captureData);
    } catch (error) {
      console.error('[ClientSyncService] Erro ao adicionar captura:', error);
    }
  }

  /**
   * Retorna dados de sincronização para o backend
   */
  async getSyncData(since?: string): Promise<ClientSyncData> {
    if (!this.storageReady) {
      await this.initStorage();
    }

    try {
      let captures: CaptureData[] = await this.storage.get(this.SYNC_DATA_KEY) || [];

      // Filtrar por timestamp se fornecido
      if (since) {
        const sinceDate = new Date(since);
        captures = captures.filter(capture => new Date(capture.timestamp) > sinceDate);
      }

      // Filtrar apenas capturas não sincronizadas
      const pendingCaptures = captures.filter(capture => !capture.synced);

      const lastSync = await this.storage.get(this.LAST_SYNC_KEY);

      const syncData: ClientSyncData = {
        user_id: this.USER_ID,
        client_url: window.location.origin,
        captures: pendingCaptures,
        last_sync: lastSync,
        total_pending: pendingCaptures.length
      };

      console.log('[ClientSyncService] Dados de sync preparados:', syncData);
      return syncData;
    } catch (error) {
      console.error('[ClientSyncService] Erro ao obter dados de sync:', error);
      return {
        user_id: this.USER_ID,
        client_url: window.location.origin,
        captures: [],
        last_sync: undefined,
        total_pending: 0
      };
    }
  }

  /**
   * Marca capturas como sincronizadas
   */
  async acknowledgeSyncedCaptures(captureIds: string[]): Promise<void> {
    if (!this.storageReady) {
      await this.initStorage();
    }

    try {
      const existingData: CaptureData[] = await this.storage.get(this.SYNC_DATA_KEY) || [];

      // Marcar capturas como sincronizadas
      const updatedData = existingData.map(capture => {
        if (captureIds.includes(capture.capture_id)) {
          return { ...capture, synced: true };
        }
        return capture;
      });

      await this.storage.set(this.SYNC_DATA_KEY, updatedData);
      await this.storage.set(this.LAST_SYNC_KEY, new Date().toISOString());

      console.log('[ClientSyncService] Capturas marcadas como sincronizadas:', captureIds);
    } catch (error) {
      console.error('[ClientSyncService] Erro ao confirmar sincronização:', error);
    }
  }

  /**
   * Limpa dados de sincronização antigos (mais de 7 dias)
   */
  async cleanupOldSyncData(): Promise<void> {
    if (!this.storageReady) {
      await this.initStorage();
    }

    try {
      const existingData: CaptureData[] = await this.storage.get(this.SYNC_DATA_KEY) || [];
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Manter apenas dados sincronizados dos últimos 7 dias e todos os não sincronizados
      const filteredData = existingData.filter(capture => {
        const captureDate = new Date(capture.timestamp);
        return !capture.synced || captureDate > oneWeekAgo;
      });

      if (filteredData.length !== existingData.length) {
        await this.storage.set(this.SYNC_DATA_KEY, filteredData);
        console.log('[ClientSyncService] Dados antigos removidos:', existingData.length - filteredData.length);
      }
    } catch (error) {
      console.error('[ClientSyncService] Erro no cleanup:', error);
    }
  }

  /**
   * Registra este cliente no backend para pull sync
   */
  async registerWithBackend(): Promise<boolean> {
    try {
      const registrationData = {
        client_url: window.location.origin,
        user_id: this.USER_ID,
        client_type: 'web',
        capabilities: ['capture', 'favorite']
      };

      const response = await this.http.post(
        `${environment.apiUrl}/api/v1/pull-sync/register-client`,
        registrationData
      ).toPromise();

      console.log('[ClientSyncService] Cliente registrado no backend:', response);
      return true;
    } catch (error) {
      console.error('[ClientSyncService] Erro ao registrar cliente:', error);
      return false;
    }
  }

  /**
   * Status de saúde do cliente
   */
  getHealthStatus(): any {
    return {
      status: 'healthy',
      client_id: this.USER_ID,
      client_url: window.location.origin,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Estatísticas de sincronização
   */
  async getSyncStats(): Promise<any> {
    if (!this.storageReady) {
      await this.initStorage();
    }

    const syncData: CaptureData[] = await this.storage.get(this.SYNC_DATA_KEY) || [];
    const lastSync = await this.storage.get(this.LAST_SYNC_KEY);

    return {
      total_captures: syncData.length,
      pending_sync: syncData.filter(c => !c.synced).length,
      synced_captures: syncData.filter(c => c.synced).length,
      last_sync: lastSync,
      client_id: this.USER_ID
    };
  }
}
