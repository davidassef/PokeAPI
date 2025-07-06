import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ErrorInfo {
  id: string;
  message: string;
  type: 'warning' | 'error' | 'info';
  timestamp: Date;
  dismissible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private errorsSubject = new BehaviorSubject<ErrorInfo[]>([]);
  private errorCounter = 0;

  public errors$ = this.errorsSubject.asObservable();

  constructor() {}

  /**
   * Adiciona um erro ou aviso ao sistema
   */
  addError(
    message: string,
    type: 'warning' | 'error' | 'info' = 'error',
    dismissible = true,
    duration?: number
  ): string {
    const errorId = `error_${this.errorCounter++}`;

    const error: ErrorInfo = {
      id: errorId,
      message,
      type,
      timestamp: new Date(),
      dismissible
    };

    const currentErrors = this.errorsSubject.value;
    this.errorsSubject.next([...currentErrors, error]);

    // Auto-dismiss após duração especificada
    if (duration && duration > 0) {
      setTimeout(() => {
        this.dismissError(errorId);
      }, duration);
    }

    return errorId;
  }

  /**
   * Remove um erro específico
   */
  dismissError(errorId: string): void {
    const currentErrors = this.errorsSubject.value;
    const filteredErrors = currentErrors.filter(error => error.id !== errorId);
    this.errorsSubject.next(filteredErrors);
  }

  /**
   * Limpa todos os erros
   */
  clearAllErrors(): void {
    this.errorsSubject.next([]);
  }

  /**
   * Adiciona um aviso sobre conexão com servidor
   */
  addConnectionWarning(serverUrl: string): string {
    return this.addError(
      `Servidor local (${serverUrl}) não está disponível. Funcionando apenas com armazenamento local.`,
      'warning',
      true,
      8000 // 8 segundos
    );
  }

  /**
   * Adiciona uma informação sobre modo offline
   */
  addOfflineModeInfo(): string {
    return this.addError(
      'Aplicativo funcionando em modo offline. Dados serão sincronizados quando a conexão for restaurada.',
      'info',
      true,
      5000 // 5 segundos
    );
  }

  /**
   * Verifica se há erros do tipo especificado
   */
  hasErrorsOfType(type: 'warning' | 'error' | 'info'): boolean {
    return this.errorsSubject.value.some(error => error.type === type);
  }

  /**
   * Obtém contagem de erros por tipo
   */
  getErrorCountByType(type: 'warning' | 'error' | 'info'): number {
    return this.errorsSubject.value.filter(error => error.type === type).length;
  }
}
