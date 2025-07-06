import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SyncResult {
  success: boolean;
  clients_consulted?: number;
  client_errors?: string[];
  total_captured_in_clients?: number;
  total_in_database?: number;
  added_to_database?: number;
  removed_from_database?: number;
  processing_time?: number;
  error?: string;
}

@Component({
  selector: 'app-sync-complete-test',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="container">
      <h1>🔄 Teste de Sincronização Completa</h1>

      <div class="status-section">
        <h3>Status do Backend</h3>
        <div class="status-indicator">
          <span [class]="backendStatus ? 'status-ok' : 'status-error'">
            {{ backendStatus ? '✅ Conectado' : '❌ Desconectado' }}
          </span>
          <button (click)="checkBackendStatus()" [disabled]="loading">
            Verificar Status
          </button>
        </div>
      </div>

      <div class="sync-section">
        <h3>Sincronização Completa</h3>
        <div class="sync-controls">
          <button
            (click)="runSyncComplete()"
            [disabled]="loading || !backendStatus"
            class="sync-button">
            {{ loading ? '⏳ Executando...' : '🔄 Executar Sincronização' }}
          </button>

          <div *ngIf="loading" class="loading-indicator">
            <div class="spinner"></div>
            <span>Sincronizando dados...</span>
          </div>
        </div>
      </div>

      <div *ngIf="syncResult" class="result-section">
        <h3>Resultado da Sincronização</h3>

        <div [class]="syncResult.success ? 'result-success' : 'result-error'">
          <h4>{{ syncResult.success ? '✅ Sucesso' : '❌ Erro' }}</h4>

          <div *ngIf="syncResult.success" class="success-details">
            <div class="metric">
              <span class="label">Clientes Consultados:</span>
              <span class="value">{{ syncResult.clients_consulted }}</span>
            </div>

            <div class="metric">
              <span class="label">Pokémons nos Clientes:</span>
              <span class="value">{{ syncResult.total_captured_in_clients }}</span>
            </div>

            <div class="metric">
              <span class="label">Pokémons no Banco:</span>
              <span class="value">{{ syncResult.total_in_database }}</span>
            </div>

            <div class="metric">
              <span class="label">Adicionados:</span>
              <span class="value positive">+{{ syncResult.added_to_database }}</span>
            </div>

            <div class="metric">
              <span class="label">Removidos:</span>
              <span class="value negative">-{{ syncResult.removed_from_database }}</span>
            </div>

            <div class="metric">
              <span class="label">Tempo de Processamento:</span>
              <span class="value">{{ syncResult.processing_time?.toFixed(2) }}s</span>
            </div>

            <div *ngIf="syncResult.client_errors?.length" class="client-errors">
              <h5>Erros de Clientes:</h5>
              <ul>
                <li *ngFor="let error of syncResult.client_errors">{{ error }}</li>
              </ul>
            </div>
          </div>

          <div *ngIf="!syncResult.success" class="error-details">
            <p><strong>Erro:</strong> {{ syncResult.error }}</p>
          </div>
        </div>

        <details class="raw-data">
          <summary>Dados Brutos (JSON)</summary>
          <pre>{{ formatJson(syncResult) }}</pre>
        </details>
      </div>

      <div class="info-section">
        <h3>ℹ️ Informações</h3>
        <p>Esta ferramenta testa a funcionalidade de sincronização completa com verificação de consistência.</p>
        <p>Certifique-se de que o backend está rodando em <code>http://localhost:8000</code></p>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }

    .status-section, .sync-section, .result-section, .info-section {
      margin: 20px 0;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #ddd;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .status-ok {
      color: #28a745;
      font-weight: bold;
    }

    .status-error {
      color: #dc3545;
      font-weight: bold;
    }

    .sync-controls {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .sync-button {
      padding: 12px 24px;
      font-size: 16px;
      border: none;
      border-radius: 6px;
      background-color: #007bff;
      color: white;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .sync-button:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .sync-button:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .result-success {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
      padding: 15px;
      border-radius: 6px;
    }

    .result-error {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
      padding: 15px;
      border-radius: 6px;
    }

    .success-details {
      margin-top: 10px;
    }

    .metric {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }

    .label {
      font-weight: bold;
    }

    .value {
      font-family: monospace;
    }

    .positive {
      color: #28a745;
    }

    .negative {
      color: #dc3545;
    }

    .client-errors {
      margin-top: 10px;
      padding: 10px;
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 4px;
    }

    .raw-data {
      margin-top: 15px;
    }

    .raw-data pre {
      background-color: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
    }

    button {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: #fff;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    button:hover:not(:disabled) {
      background-color: #f8f9fa;
    }

    button:disabled {
      background-color: #e9ecef;
      cursor: not-allowed;
    }

    code {
      background-color: #f8f9fa;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: monospace;
    }
  `]
})
export class SyncCompleteTestComponent implements OnInit {
  loading = false;
  backendStatus = false;
  syncResult: SyncResult | null = null;

  private readonly backendUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.checkBackendStatus();
  }

  async checkBackendStatus() {
    try {
      const response = await this.http.get(`${this.backendUrl}/api/v1/pull-sync/status`).toPromise();
      this.backendStatus = true;
      console.log('✅ Backend conectado:', response);
    } catch (error) {
      this.backendStatus = false;
      console.error('❌ Backend não disponível:', error);
    }
  }

  async runSyncComplete() {
    this.loading = true;
    this.syncResult = null;

    try {
      const response = await this.http.post<SyncResult>(
        `${this.backendUrl}/api/v1/pull-sync/sync-complete-state`,
        {}
      ).toPromise();

      this.syncResult = response || { success: false, error: 'Resposta vazia' };

      if (this.syncResult.success) {
        console.log('✅ Sincronização executada com sucesso:', this.syncResult);
      } else {
        console.error('❌ Erro na sincronização:', this.syncResult);
      }

    } catch (error: any) {
      console.error('❌ Erro na requisição:', error);
      this.syncResult = {
        success: false,
        error: error.message || 'Erro desconhecido'
      };
    } finally {
      this.loading = false;
    }
  }

  formatJson(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }
}
