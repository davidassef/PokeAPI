import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test-sync',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2>Teste de Sincronização Completa</h2>
      <button (click)="testSync()" [disabled]="loading">
        {{ loading ? 'Executando...' : 'Testar Sincronização' }}
      </button>
      <div *ngIf="result">
        <h3>Resultado:</h3>
        <pre>{{ getResultJson() }}</pre>
      </div>
    </div>
  `
})
export class TestSyncComponent {
  loading = false;
  result: any = null;

  constructor(private http: HttpClient) {}

  async testSync() {
    this.loading = true;
    try {
      const response = await this.http.post('http://localhost:8000/api/v1/pull-sync/sync-complete-state', {}).toPromise();
      this.result = response;
      console.log('Resultado:', response);
    } catch (error) {
      console.error('Erro:', error);
      this.result = { error: error };
    } finally {
      this.loading = false;
    }
  }

  getResultJson(): string {
    return JSON.stringify(this.result, null, 2);
  }
}
