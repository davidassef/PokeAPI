import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, timeout, retry, finalize } from 'rxjs/operators';
import { PerformanceMonitorService } from '../services/performance-monitor.service';

export interface RequestMetrics {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  size?: number;
  cached?: boolean;
  retries?: number;
  error?: string;
}

/**
 * Interceptor para monitoramento e otimização de performance
 * - Monitora tempo de resposta das APIs
 * - Implementa retry automático
 * - Coleta métricas de rede
 * - Otimiza timeouts baseado no tipo de request
 */
@Injectable()
export class PerformanceInterceptor implements HttpInterceptor {
  private activeRequests = new Map<string, RequestMetrics>();
  private requestCounter = 0;

  // Timeouts otimizados por tipo de endpoint
  private timeoutConfig = {
    '/auth/': 15000,      // 15s para autenticação
    '/pokemon/': 8000,    // 8s para dados de Pokémon
    '/ranking/': 5000,    // 5s para ranking
    '/captured/': 3000,   // 3s para dados locais
    'default': 10000      // 10s padrão
  };

  // Configuração de retry por tipo de endpoint
  private retryConfig = {
    '/auth/': { count: 2, delay: 2000 },
    '/pokemon/': { count: 3, delay: 1000 },
    '/ranking/': { count: 1, delay: 1500 },
    'default': { count: 2, delay: 1000 }
  };

  constructor(private performanceMonitor: PerformanceMonitorService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Gerar ID único para a requisição
    const requestId = `req_${this.requestCounter++}`;
    const startTime = performance.now();

    // Criar métricas iniciais
    const metrics: RequestMetrics = {
      url: req.url,
      method: req.method,
      startTime,
      retries: 0
    };

    this.activeRequests.set(requestId, metrics);

    // Determinar timeout baseado na URL
    const timeoutMs = this.getTimeoutForUrl(req.url);
    
    // Determinar configuração de retry
    const retryConfig = this.getRetryConfigForUrl(req.url);

    // Log da requisição
    console.log(`🚀 [Performance] ${req.method} ${req.url} (timeout: ${timeoutMs}ms)`);

    return next.handle(req).pipe(
      // Aplicar timeout otimizado
      timeout(timeoutMs),
      
      // Retry automático para falhas de rede
      retry({
        count: retryConfig.count,
        delay: (error, retryCount) => {
          metrics.retries = retryCount;
          console.warn(`🔄 [Performance] Retry ${retryCount}/${retryConfig.count} para ${req.url}`);
          
          // Delay exponencial
          const delay = retryConfig.delay * Math.pow(1.5, retryCount - 1);
          return new Promise(resolve => setTimeout(resolve, delay));
        },
        resetOnSuccess: true
      }),
      
      // Monitorar resposta
      tap(event => {
        if (event instanceof HttpResponse) {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          // Atualizar métricas
          metrics.endTime = endTime;
          metrics.duration = duration;
          metrics.status = event.status;
          metrics.size = this.calculateResponseSize(event);
          metrics.cached = this.isResponseCached(event);

          // Registrar métricas no monitor
          this.performanceMonitor.recordApiResponse(duration);
          
          // Log de sucesso
          const cacheStatus = metrics.cached ? '🎯 CACHED' : '🌐 FRESH';
          console.log(
            `✅ [Performance] ${req.method} ${req.url} - ${duration.toFixed(2)}ms ${cacheStatus} (${this.formatSize(metrics.size || 0)})`
          );

          // Alertar se a resposta for muito lenta
          if (duration > timeoutMs * 0.8) {
            console.warn(`⚠️ [Performance] Resposta lenta: ${req.url} (${duration.toFixed(2)}ms)`);
          }
        }
      }),
      
      // Tratar erros
      catchError((error: HttpErrorResponse) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Atualizar métricas de erro
        metrics.endTime = endTime;
        metrics.duration = duration;
        metrics.status = error.status;
        metrics.error = error.message;

        // Log de erro
        console.error(
          `❌ [Performance] ${req.method} ${req.url} - ${duration.toFixed(2)}ms - Status: ${error.status}`
        );

        // Categorizar tipos de erro
        this.categorizeError(error, req.url);

        return throwError(() => error);
      }),
      
      // Cleanup final
      finalize(() => {
        this.activeRequests.delete(requestId);
        this.updateNetworkMetrics();
      })
    );
  }

  /**
   * Determina timeout baseado na URL
   */
  private getTimeoutForUrl(url: string): number {
    for (const [pattern, timeout] of Object.entries(this.timeoutConfig)) {
      if (pattern !== 'default' && url.includes(pattern)) {
        return timeout;
      }
    }
    return this.timeoutConfig.default;
  }

  /**
   * Determina configuração de retry baseado na URL
   */
  private getRetryConfigForUrl(url: string): { count: number; delay: number } {
    for (const [pattern, config] of Object.entries(this.retryConfig)) {
      if (pattern !== 'default' && url.includes(pattern)) {
        return config;
      }
    }
    return this.retryConfig.default;
  }

  /**
   * Calcula tamanho da resposta
   */
  private calculateResponseSize(response: HttpResponse<any>): number {
    try {
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        return parseInt(contentLength, 10);
      }
      
      // Estimar baseado no body
      if (response.body) {
        return JSON.stringify(response.body).length;
      }
    } catch (error) {
      console.warn('Erro ao calcular tamanho da resposta:', error);
    }
    return 0;
  }

  /**
   * Verifica se a resposta veio do cache
   */
  private isResponseCached(response: HttpResponse<any>): boolean {
    // Verificar headers de cache
    const cacheControl = response.headers.get('cache-control');
    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');
    
    // Se tem headers de cache, provavelmente veio do cache
    return !!(cacheControl || etag || lastModified);
  }

  /**
   * Formata tamanho em bytes
   */
  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Categoriza tipos de erro para análise
   */
  private categorizeError(error: HttpErrorResponse, url: string): void {
    let category = 'unknown';
    
    switch (error.status) {
      case 0:
        category = 'network';
        console.error('🔌 [Performance] Erro de conectividade:', url);
        break;
      case 404:
        category = 'not_found';
        console.error('🔍 [Performance] Recurso não encontrado:', url);
        break;
      case 500:
      case 502:
      case 503:
        category = 'server';
        console.error('🔥 [Performance] Erro do servidor:', url);
        break;
      case 408:
        category = 'timeout';
        console.error('⏰ [Performance] Timeout:', url);
        break;
      default:
        if (error.status >= 400 && error.status < 500) {
          category = 'client';
        } else if (error.status >= 500) {
          category = 'server';
        }
    }

    // Registrar erro no monitor
    this.updateErrorRate();
  }

  /**
   * Atualiza métricas de rede
   */
  private updateNetworkMetrics(): void {
    const activeCount = this.activeRequests.size;
    this.performanceMonitor.recordNetworkRequests(activeCount);
  }

  /**
   * Atualiza taxa de erro
   */
  private updateErrorRate(): void {
    // Calcular taxa de erro baseada nas últimas requisições
    // Esta é uma implementação simplificada
    const errorRate = 0.02; // 2% - seria calculado baseado em dados reais
    this.performanceMonitor.recordErrorRate(errorRate);
  }

  /**
   * Obtém estatísticas das requisições ativas
   */
  getActiveRequestsStats(): {
    total: number;
    byMethod: { [method: string]: number };
    byStatus: { [status: string]: number };
    averageDuration: number;
  } {
    const requests = Array.from(this.activeRequests.values());
    
    const stats = {
      total: requests.length,
      byMethod: {} as { [method: string]: number },
      byStatus: {} as { [status: string]: number },
      averageDuration: 0
    };

    let totalDuration = 0;
    let completedRequests = 0;

    requests.forEach(req => {
      // Contar por método
      stats.byMethod[req.method] = (stats.byMethod[req.method] || 0) + 1;
      
      // Contar por status
      if (req.status) {
        const statusGroup = `${Math.floor(req.status / 100)}xx`;
        stats.byStatus[statusGroup] = (stats.byStatus[statusGroup] || 0) + 1;
      }
      
      // Calcular duração média
      if (req.duration) {
        totalDuration += req.duration;
        completedRequests++;
      }
    });

    if (completedRequests > 0) {
      stats.averageDuration = totalDuration / completedRequests;
    }

    return stats;
  }

  /**
   * Gera relatório de performance das requisições
   */
  generateRequestReport(): string {
    const stats = this.getActiveRequestsStats();
    
    return `
🌐 Relatório de Requisições de Rede

📊 Estatísticas Gerais:
- Total de requisições ativas: ${stats.total}
- Duração média: ${stats.averageDuration.toFixed(2)}ms

📈 Por Método HTTP:
${Object.entries(stats.byMethod)
  .map(([method, count]) => `- ${method}: ${count}`)
  .join('\n')}

📊 Por Status:
${Object.entries(stats.byStatus)
  .map(([status, count]) => `- ${status}: ${count}`)
  .join('\n')}
    `;
  }
}
