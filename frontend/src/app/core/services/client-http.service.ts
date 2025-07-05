import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ClientSyncService } from './client-sync.service';

/**
 * Serviço para simular um servidor HTTP que expõe endpoints do cliente
 * para o sistema pull-based de sincronização
 */
@Injectable({
  providedIn: 'root'
})
export class ClientHttpService {
  private serverPort = 3001;
  private isRunning = false;

  constructor(
    private http: HttpClient,
    private clientSyncService: ClientSyncService
  ) {}

  /**
   * Inicia o servidor HTTP do cliente (simulado)
   */
  async startServer(): Promise<void> {
    if (this.isRunning) {
      console.log('[ClientHttpService] Servidor já está executando');
      return;
    }

    try {
      // Em uma implementação real, isso seria um servidor Node.js ou similar
      // Por enquanto, vamos simular com event listeners
      this.setupEventListeners();
      this.isRunning = true;

      console.log(`[ClientHttpService] Servidor simulado iniciado na porta ${this.serverPort}`);

      // Tentar registrar com o backend
      await this.registerWithBackend();

      // Iniciar cleanup periódico
      this.startPeriodicCleanup();

    } catch (error) {
      console.error('[ClientHttpService] Erro ao iniciar servidor:', error);
    }
  }

  /**
   * Para o servidor HTTP do cliente
   */
  stopServer(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    console.log('[ClientHttpService] Servidor simulado parado');
  }

  /**
   * Configura event listeners para simular endpoints HTTP
   */
  private setupEventListeners(): void {
    // Simular endpoints usando postMessage ou similar
    // Esta é uma implementação simplificada
    console.log('[ClientHttpService] Event listeners configurados');
  }

  /**
   * Registra este cliente no backend
   */
  private async registerWithBackend(): Promise<void> {
    try {
      const success = await this.clientSyncService.registerWithBackend();
      if (success) {
        console.log('[ClientHttpService] Cliente registrado com sucesso no backend');
      } else {
        console.warn('[ClientHttpService] Falha ao registrar cliente no backend');
      }
    } catch (error) {
      console.error('[ClientHttpService] Erro ao registrar cliente:', error);
    }
  }

  /**
   * Inicia cleanup periódico de dados antigos
   */
  private startPeriodicCleanup(): void {
    setInterval(async () => {
      try {
        await this.clientSyncService.cleanupOldSyncData();
      } catch (error) {
        console.error('[ClientHttpService] Erro no cleanup periódico:', error);
      }
    }, 60000 * 60); // A cada hora
  }

  /**
   * Retorna a URL base do servidor do cliente
   */
  getServerUrl(): string {
    return `${window.location.protocol}//${window.location.hostname}:${this.serverPort}`;
  }

  /**
   * Retorna status do servidor
   */
  getServerStatus(): any {
    return {
      running: this.isRunning,
      port: this.serverPort,
      url: this.getServerUrl(),
      endpoints: [
        'GET /api/client/health',
        'GET /api/client/sync-data',
        'POST /api/client/acknowledge',
        'GET /api/client/stats'
      ]
    };
  }
}
