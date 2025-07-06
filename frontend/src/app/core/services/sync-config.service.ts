import { Injectable } from '@angular/core';

/**
 * Serviço de configuração para controlar o tipo de sincronização
 * IMPORTANTE: Para evitar duplicação, apenas um sistema deve estar ativo
 */
@Injectable({
  providedIn: 'root'
})
export class SyncConfigService {

  // Configuração: usar apenas sistema pull-based para evitar duplicação
  private readonly USE_PULL_SYNC_ONLY = true;
  private readonly USE_PUSH_SYNC = false;
  private readonly STRICT_MODE = true; // Garante que apenas um sistema esteja ativo

  /**
   * Verifica se deve usar o sistema push (original)
   * No modo estrito, retorna false se pull estiver ativo
   */
  shouldUsePushSync(): boolean {
    if (this.STRICT_MODE && this.USE_PULL_SYNC_ONLY) {
      return false; // Garante que não haverá conflito
    }
    return this.USE_PUSH_SYNC && !this.USE_PULL_SYNC_ONLY;
  }

  /**
   * Verifica se deve usar o sistema pull (novo)
   */
  shouldUsePullSync(): boolean {
    return this.USE_PULL_SYNC_ONLY;
  }

  /**
   * Retorna o tipo de sincronização ativo
   */
  getSyncType(): 'push' | 'pull' | 'both' | 'none' {
    if (this.STRICT_MODE && this.USE_PULL_SYNC_ONLY) return 'pull';
    if (this.USE_PULL_SYNC_ONLY) return 'pull';
    if (this.USE_PUSH_SYNC && !this.USE_PULL_SYNC_ONLY) return 'push';
    if (this.USE_PUSH_SYNC && this.USE_PULL_SYNC_ONLY) return 'both';
    return 'none';
  }

  /**
   * Configuração para desenvolvimento/debug
   */
  isDebugMode(): boolean {
    return true; // Ativo para monitoramento
  }

  /**
   * Verifica se está no modo estrito (apenas um sistema ativo)
   */
  isStrictMode(): boolean {
    return this.STRICT_MODE;
  }

  /**
   * Configuração de URLs para o sistema pull
   */
  getClientServerUrl(): string {
    return 'http://localhost:3001';
  }

  /**
   * Configuração de URLs para o sistema push
   */
  getBackendUrl(): string {
    return 'http://localhost:8000';
  }

  /**
   * Endpoints para forçar sincronização manual
   */
  getPullSyncEndpoints() {
    const backendUrl = this.getBackendUrl();
    return {
      // Sincronização forçada
      syncAll: `${backendUrl}/api/v1/pull-sync/sync-all`,
      syncRecent: `${backendUrl}/api/v1/pull-sync/sync-recent`,
      syncBackground: `${backendUrl}/api/v1/pull-sync/sync-all-background`,
      syncCompleteState: `${backendUrl}/api/v1/pull-sync/sync-complete-state`,

      // Gerenciamento de clientes
      registerClient: `${backendUrl}/api/v1/pull-sync/register-client`,
      unregisterClient: `${backendUrl}/api/v1/pull-sync/unregister-client`,
      registeredClients: `${backendUrl}/api/v1/pull-sync/registered-clients`,

      // Status e monitoramento
      pullStatus: `${backendUrl}/api/v1/pull-sync/status`,
      schedulerStatus: `${backendUrl}/api/v1/pull-sync/scheduler/status`,

      // Controle do scheduler
      startScheduler: `${backendUrl}/api/v1/pull-sync/scheduler/start`,
      stopScheduler: `${backendUrl}/api/v1/pull-sync/scheduler/stop`,
      setSchedulerInterval: `${backendUrl}/api/v1/pull-sync/scheduler/set-interval`,

      // Limpeza
      cleanupInactive: `${backendUrl}/api/v1/pull-sync/cleanup-inactive`,

      // Administrativos
      resetDatabase: `${backendUrl}/api/v1/admin/reset-database`,
      databaseStatus: `${backendUrl}/api/v1/admin/database-status`,
      clearTestData: `${backendUrl}/api/v1/admin/clear-fictitious-data`
    };
  }

  /**
   * Configuração de comandos cURL para testes manuais
   */
  getCurlCommands() {
    const endpoints = this.getPullSyncEndpoints();
    return {
      // Forçar sincronização
      forceSyncAll: `curl -X POST ${endpoints.syncAll} -H "Content-Type: application/json" -d '{}'`,
      forceSyncRecent: `curl -X POST ${endpoints.syncRecent} -H "Content-Type: application/json"`,
      forceSyncBackground: `curl -X POST ${endpoints.syncBackground} -H "Content-Type: application/json"`,
      forceSyncCompleteState: `curl -X POST ${endpoints.syncCompleteState} -H "Content-Type: application/json" -d '{}'`,

      // Verificar status
      checkPullStatus: `curl -X GET ${endpoints.pullStatus}`,
      checkSchedulerStatus: `curl -X GET ${endpoints.schedulerStatus}`,
      listClients: `curl -X GET ${endpoints.registeredClients}`,

      // Controle do scheduler
      startScheduler: `curl -X POST ${endpoints.startScheduler}`,
      stopScheduler: `curl -X POST ${endpoints.stopScheduler}`,
      setInterval30s: `curl -X POST ${endpoints.setSchedulerInterval} -H "Content-Type: application/json" -d '{"interval": 30}'`,

      // Limpeza
      cleanupInactive: `curl -X POST ${endpoints.cleanupInactive}`,

      // Administrativos
      resetDatabase: `curl -X DELETE ${endpoints.resetDatabase}`,
      checkDatabaseStatus: `curl -X GET ${endpoints.databaseStatus}`
    };
  }

  /**
   * Configurações de intervalo para sincronização
   */
  getSyncIntervalOptions() {
    return {
      immediate: 5,    // 5 segundos para testes
      fast: 15,        // 15 segundos para desenvolvimento
      normal: 30,      // 30 segundos (padrão)
      slow: 60,        // 1 minuto
      verySlow: 300    // 5 minutos
    };
  }
}
