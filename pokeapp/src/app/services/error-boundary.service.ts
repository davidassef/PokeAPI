// 🚨 Error Boundary Service - Refatorado e Simplificado
// Tratamento eficiente de erros sem dependencies problemáticas

import { Injectable, ErrorHandler } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ErrorBoundaryService implements ErrorHandler {

  /**
   * Manipula erros globais da aplicação
   */
  handleError(error: any): void {
    const actualError = error instanceof Error ? error : new Error(String(error));

    // Log estruturado do erro
    console.group('🚨 Erro capturado');
    console.error('Mensagem:', actualError.message);
    console.error('Stack:', actualError.stack);
    console.error('Timestamp:', new Date().toISOString());
    console.groupEnd();

    // Em produção, reportar para serviços de monitoramento
    if (this.isProduction()) {
      this.reportToMonitoring(actualError);
    }
  }

  /**
   * Log manual de erros com contexto
   */
  logError(error: Error, context: string = 'Manual Log'): void {
    console.warn(`⚠️ Erro em ${context}:`, error.message);

    if (this.isProduction()) {
      this.reportToMonitoring(error, context);
    }
  }

  /**
   * Verifica se está em produção
   */
  private isProduction(): boolean {
    return typeof window !== 'undefined' &&
           window.location.hostname !== 'localhost' &&
           !window.location.hostname.includes('192.168');
  }

  /**
   * Reporta erro para serviços de monitoramento (placeholder)
   */
  private reportToMonitoring(error: Error, context?: string): void {
    // Implementação futura para Sentry, LogRocket, etc.
    try {
      console.log('📊 Erro reportado para monitoramento:', {
        message: error.message,
        context,
      });
    } catch (reportError) {
      console.warn('⚠️ Falha ao reportar erro:', reportError);
    }
  }
}