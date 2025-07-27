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
        client_version: '1.5',
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
      // ✅ CORREÇÃO: Aumentado de 7 para 30 dias para maior segurança
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Manter apenas dados sincronizados dos últimos 30 dias e todos os não sincronizados
      // ✅ CORREÇÃO: Adicionar verificação extra de segurança
      const filteredData = existingData.filter(capture => {
        const captureDate = new Date(capture.timestamp);
        // Manter se: não foi sincronizado OU foi sincronizado há menos de 30 dias OU tem menos de 100 itens totais
        return !capture.synced ||
               captureDate > thirtyDaysAgo ||
               existingData.length < 100; // Proteção adicional para poucos dados
      });

      if (filteredData.length !== existingData.length) {
        const removedCount = existingData.length - filteredData.length;
        console.log(`[ClientSyncService] ✅ Limpeza conservadora: ${removedCount} dados antigos removidos (${filteredData.length} mantidos)`);

        // ✅ CORREÇÃO: Backup antes de limpar
        await this.storage.set(`${this.SYNC_DATA_KEY}_backup_${Date.now()}`, existingData.slice(0, 50));
        await this.storage.set(this.SYNC_DATA_KEY, filteredData);
      } else {
        console.log('[ClientSyncService] ✅ Nenhum dado antigo para remover');
      }
    } catch (error) {
      console.error('[ClientSyncService] ❌ Erro no cleanup (dados preservados):', error);
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
        `${environment.apiUrl}/pull-sync/register-client`,  // ✅ CORREÇÃO: Não duplicar /api/v1
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
      version: '1.5'
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
