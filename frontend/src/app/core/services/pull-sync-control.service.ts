import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SyncConfigService } from './sync-config.service';

/**
 * Serviço para controlar sincronização manual do sistema pull-based
 */
@Injectable({
  providedIn: 'root'
})
export class PullSyncControlService {

  constructor(
    private http: HttpClient,
    private syncConfig: SyncConfigService
  ) {}

  /**
   * Força sincronização de todos os clientes
   */
  forceSyncAll(since?: string): Observable<any> {
    const endpoint = this.syncConfig.getPullSyncEndpoints().syncAll;
    const payload = since ? { since } : {};

    if (this.syncConfig.isDebugMode()) {
      console.log('[PullSyncControl] 🔄 Forçando sincronização de todos os clientes...');
    }

    return this.http.post(endpoint, payload);
  }

  /**
   * Força sincronização apenas de mudanças recentes
   */
  forceSyncRecent(): Observable<any> {
    const endpoint = this.syncConfig.getPullSyncEndpoints().syncRecent;

    if (this.syncConfig.isDebugMode()) {
      console.log('[PullSyncControl] ⚡ Forçando sincronização de mudanças recentes...');
    }

    return this.http.post(endpoint, {});
  }

  /**
   * Inicia sincronização em background
   */
  startBackgroundSync(): Observable<any> {
    const endpoint = this.syncConfig.getPullSyncEndpoints().syncBackground;

    if (this.syncConfig.isDebugMode()) {
      console.log('[PullSyncControl] 🚀 Iniciando sincronização em background...');
    }

    return this.http.post(endpoint, {});
  }

  /**
   * Verifica status do sistema pull-sync
   */
  getPullSyncStatus(): Observable<any> {
    const endpoint = this.syncConfig.getPullSyncEndpoints().pullStatus;
    return this.http.get(endpoint);
  }

  /**
   * Verifica status do scheduler
   */
  getSchedulerStatus(): Observable<any> {
    const endpoint = this.syncConfig.getPullSyncEndpoints().schedulerStatus;
    return this.http.get(endpoint);
  }

  /**
   * Lista clientes registrados
   */
  getRegisteredClients(): Observable<any> {
    const endpoint = this.syncConfig.getPullSyncEndpoints().registeredClients;
    return this.http.get(endpoint);
  }

  /**
   * Controla o scheduler
   */
  startScheduler(): Observable<any> {
    const endpoint = this.syncConfig.getPullSyncEndpoints().startScheduler;

    if (this.syncConfig.isDebugMode()) {
      console.log('[PullSyncControl] ▶️  Iniciando scheduler...');
    }

    return this.http.post(endpoint, {});
  }

  stopScheduler(): Observable<any> {
    const endpoint = this.syncConfig.getPullSyncEndpoints().stopScheduler;

    if (this.syncConfig.isDebugMode()) {
      console.log('[PullSyncControl] ⏹️  Parando scheduler...');
    }

    return this.http.post(endpoint, {});
  }

  setSchedulerInterval(interval: number): Observable<any> {
    const endpoint = this.syncConfig.getPullSyncEndpoints().setSchedulerInterval;

    if (this.syncConfig.isDebugMode()) {
      console.log(`[PullSyncControl] ⏰ Configurando intervalo para ${interval} segundos...`);
    }

    return this.http.post(endpoint, { interval });
  }

  /**
   * Limpeza de clientes inativos
   */
  cleanupInactiveClients(): Observable<any> {
    const endpoint = this.syncConfig.getPullSyncEndpoints().cleanupInactive;

    if (this.syncConfig.isDebugMode()) {
      console.log('[PullSyncControl] 🧹 Limpando clientes inativos...');
    }

    return this.http.post(endpoint, {});
  }

  /**
   * Registra um novo cliente
   */
  registerClient(clientUrl: string, userId: string = 'user_1'): Observable<any> {
    const endpoint = this.syncConfig.getPullSyncEndpoints().registerClient;
    const payload = {
      client_url: clientUrl,
      user_id: userId,
      client_type: 'web',
      capabilities: ['capture', 'favorite']
    };

    if (this.syncConfig.isDebugMode()) {
      console.log(`[PullSyncControl] 📝 Registrando cliente: ${clientUrl}`);
    }

    return this.http.post(endpoint, payload);
  }

  /**
   * Remove um cliente
   */
  unregisterClient(userId: string): Observable<any> {
    const endpoint = `${this.syncConfig.getPullSyncEndpoints().unregisterClient}/${userId}`;

    if (this.syncConfig.isDebugMode()) {
      console.log(`[PullSyncControl] 🗑️  Removendo cliente: ${userId}`);
    }

    return this.http.delete(endpoint);
  }

  /**
   * Funções administrativas
   */
  resetDatabase(): Observable<any> {
    const endpoint = this.syncConfig.getPullSyncEndpoints().resetDatabase;

    if (this.syncConfig.isDebugMode()) {
      console.log('[PullSyncControl] ⚠️  RESET do banco de dados...');
    }

    return this.http.delete(endpoint);
  }

  getDatabaseStatus(): Observable<any> {
    const endpoint = this.syncConfig.getPullSyncEndpoints().databaseStatus;
    return this.http.get(endpoint);
  }

  clearTestData(): Observable<any> {
    const endpoint = this.syncConfig.getPullSyncEndpoints().clearTestData;

    if (this.syncConfig.isDebugMode()) {
      console.log('[PullSyncControl] 🧪 Limpando dados de teste...');
    }

    return this.http.post(endpoint, {});
  }

  /**
   * Métodos de conveniência para testes
   */

  /**
   * Executa um teste completo de sincronização
   */
  async runFullSyncTest(): Promise<any> {
    try {
      console.log('🧪 Iniciando teste completo de sincronização...');

      // 1. Verificar status inicial
      const initialStatus = await this.getPullSyncStatus().toPromise();
      console.log('📊 Status inicial:', initialStatus);

      // 2. Forçar sincronização
      const syncResult = await this.forceSyncAll().toPromise();
      console.log('🔄 Resultado da sincronização:', syncResult);

      // 3. Verificar status final
      const finalStatus = await this.getPullSyncStatus().toPromise();
      console.log('📊 Status final:', finalStatus);

      return {
        success: true,
        initialStatus,
        syncResult,
        finalStatus
      };

    } catch (error) {
      console.error('❌ Erro no teste de sincronização:', error);
      return {
        success: false,
        error: error
      };
    }
  }

  /**
   * Configura intervalo rápido para testes
   */
  async setTestInterval(): Promise<any> {
    const testInterval = this.syncConfig.getSyncIntervalOptions().immediate;
    return this.setSchedulerInterval(testInterval).toPromise();
  }

  /**
   * Restaura intervalo normal
   */
  async restoreNormalInterval(): Promise<any> {
    const normalInterval = this.syncConfig.getSyncIntervalOptions().normal;
    return this.setSchedulerInterval(normalInterval).toPromise();
  }

  /**
   * Retorna comandos cURL para debug manual
   */
  getCurlCommands(): any {
    return this.syncConfig.getCurlCommands();
  }
}
