// 📊 Performance Monitoring Service
// Monitoramento de métricas de performance

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface CoreWebVitals {
  cls?: number;
  inp?: number;
  fcp?: number;
  lcp?: number;
  ttfb?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PerformanceService {
  private metrics = new Map<string, PerformanceMetrics>();
  private isEnabled = true;

  /**
   * Inicia uma medição de performance
   */
  startMeasure(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  /**
   * Finaliza uma medição de performance
   */
  endMeasure(name: string): PerformanceMetrics | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) return null;

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log apenas em desenvolvimento
    if (!environment.production) {
      console.log(`🚀 Performance: ${name} took ${duration.toFixed(2)}ms`, metric.metadata);
    }

    return metric;
  }

  /**
   * Mede uma função assíncrona
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    this.startMeasure(name, metadata);
    try {
      const result = await fn();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  /**
   * Mede uma função síncrona
   */
  measure<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>,
  ): T {
    this.startMeasure(name, metadata);
    try {
      const result = fn();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }  /**
   * Obtém métricas de Core Web Vitals
   */
  getCoreWebVitals(): Promise<CoreWebVitals> {
    return new Promise((resolve) => {
      try {
        // Importa dinamicamente web-vitals (versão 5.x)
        import('web-vitals').then((webVitals) => {
          const vitals: CoreWebVitals = {};
          let metricsCollected = 0;
          const totalMetrics = 5;

          const checkComplete = () => {
            metricsCollected++;
            if (metricsCollected === totalMetrics) {
              resolve(vitals);
            }
          };

          // Na versão 5.x, FID foi substituído por INP (Interaction to Next Paint)
          const { onCLS, onINP, onFCP, onLCP, onTTFB } = webVitals;

          // Coleta cada métrica
          onCLS(({ value }) => {
            vitals.cls = value;
            checkComplete();
          });

          // INP substituiu FID na versão 5.x
          onINP(({ value }) => {
            vitals.inp = value;
            checkComplete();
          });

          onFCP(({ value }) => {
            vitals.fcp = value;
            checkComplete();
          });

          onLCP(({ value }) => {
            vitals.lcp = value;
            checkComplete();
          });

          onTTFB(({ value }) => {
            vitals.ttfb = value;
            checkComplete();
          });

          // Timeout para garantir que resolve mesmo se nem todas as métricas forem coletadas
          setTimeout(() => {
            resolve(vitals);
          }, 3000);

        }).catch((error) => {
          console.warn('Web Vitals não disponível:', error);
          resolve({});
        });
      } catch (error) {
        console.warn('Erro ao carregar Web Vitals:', error);
        resolve({});
      }
    });
  }

  /**
   * Obtém métricas de navegação
   */
  getNavigationMetrics(): PerformanceNavigationTiming | null {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navigation;
    }
    return null;
  }

  /**
   * Obtém métricas de recursos
   */
  getResourceMetrics(): PerformanceResourceTiming[] {
    if ('performance' in window && 'getEntriesByType' in performance) {
      return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    }
    return [];
  }

  /**
   * Gera um relatório de performance
   */
  generateReport(): {
    customMetrics: PerformanceMetrics[];
    navigation: PerformanceNavigationTiming | null;
    resources: PerformanceResourceTiming[];
    memory?: any;
  } {
    const report = {
      customMetrics: Array.from(this.metrics.values()),
      navigation: this.getNavigationMetrics(),
      resources: this.getResourceMetrics(),
      memory: (performance as any).memory || null,
    };

    if (!environment.production) {
      console.table(report.customMetrics);
    }

    return report;
  }

  /**
   * Limpa métricas antigas
   */
  clearMetrics(): void {
    this.metrics.clear();
  }
  /**
   * Habilita/desabilita monitoramento
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}
