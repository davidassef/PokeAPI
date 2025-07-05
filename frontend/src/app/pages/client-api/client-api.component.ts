import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ClientSyncService } from '../../core/services/client-sync.service';

/**
 * Componente para expor endpoints do cliente para o backend
 * Usado no sistema pull-based de sincronização
 */
@Component({
  selector: 'app-client-api',
  template: `
    <div class="client-api-status">
      <h2>Client API Status</h2>
      <p>Este cliente está expondo endpoints para sincronização pull-based</p>
      <div class="status-info">
        <p><strong>Client ID:</strong> {{ clientId }}</p>
        <p><strong>Client URL:</strong> {{ clientUrl }}</p>
        <p><strong>Status:</strong> {{ status }}</p>
      </div>
    </div>
  `,
  styleUrls: ['./client-api.component.scss']
})
export class ClientApiComponent {
  clientId = 'user_1';
  clientUrl = window.location.origin;
  status = 'active';

  constructor(
    private router: Router,
    private clientSyncService: ClientSyncService
  ) {}

  /**
   * Endpoint para health check - GET /api/client/health
   */
  async getHealthCheck(): Promise<any> {
    return this.clientSyncService.getHealthStatus();
  }

  /**
   * Endpoint para dados de sincronização - GET /api/client/sync-data
   */
  async getSyncData(since?: string): Promise<any> {
    return await this.clientSyncService.getSyncData(since);
  }

  /**
   * Endpoint para confirmação de sincronização - POST /api/client/acknowledge
   */
  async acknowledgeSyncedCaptures(captureIds: string[]): Promise<any> {
    await this.clientSyncService.acknowledgeSyncedCaptures(captureIds);
    return {
      message: 'Captures acknowledged successfully',
      count: captureIds.length
    };
  }

  /**
   * Endpoint para estatísticas - GET /api/client/stats
   */
  async getStats(): Promise<any> {
    return await this.clientSyncService.getSyncStats();
  }
}
