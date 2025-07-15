import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PerformanceMetrics {
  // Core Web Vitals
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;

  // Custom Metrics
  apiResponseTime: number;
  imageLoadTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  networkRequests: number;

  // User Experience
  pageLoadTime: number;
  navigationTiming: number;
  errorRate: number;

  timestamp: number;
}

export interface PerformanceAlert {
  type: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
}

/**
 * Serviço de monitoramento de performance em tempo real
 * Coleta métricas Core Web Vitals e métricas customizadas
 */
@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitorService {
  private metricsSubject = new BehaviorSubject<PerformanceMetrics | null>(null);
  private alertsSubject = new BehaviorSubject<PerformanceAlert[]>([]);

  public metrics$ = this.metricsSubject.asObservable();
  public alerts$ = this.alertsSubject.asObservable();

  private performanceObserver?: PerformanceObserver;
  private metrics: Partial<PerformanceMetrics> = {};
  private alerts: PerformanceAlert[] = [];

  // Thresholds para alertas (em ms, exceto onde indicado)
  private thresholds = {
    firstContentfulPaint: 2000,
    largestContentfulPaint: 2500,
    firstInputDelay: 100,
    cumulativeLayoutShift: 0.1, // score
    timeToInteractive: 3000,
    apiResponseTime: 1000,
    imageLoadTime: 2000,
    cacheHitRate: 0.8, // 80%
    memoryUsage: 100, // MB
    pageLoadTime: 3000,
    errorRate: 0.05 // 5%
  };

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Inicializa o monitoramento de performance
   */
  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Core Web Vitals
    this.observeCoreWebVitals();

    // Navigation Timing
    this.observeNavigationTiming();

    // Resource Timing
    this.observeResourceTiming();

    // Memory Usage (se disponível)
    this.observeMemoryUsage();

    // Coleta métricas a cada 30 segundos
    setInterval(() => {
      this.collectMetrics();
    }, 30000);
  }

  /**
   * Observa Core Web Vitals usando PerformanceObserver
   */
  private observeCoreWebVitals(): void {
    if (!('PerformanceObserver' in window)) return;

    // First Contentful Paint
    this.createObserver(['paint'], (entries) => {
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
          this.checkThreshold('firstContentfulPaint', entry.startTime);
        }
      });
    });

    // Largest Contentful Paint
    this.createObserver(['largest-contentful-paint'], (entries) => {
      entries.forEach(entry => {
        this.metrics.largestContentfulPaint = entry.startTime;
        this.checkThreshold('largestContentfulPaint', entry.startTime);
      });
    });

    // First Input Delay
    this.createObserver(['first-input'], (entries) => {
      entries.forEach(entry => {
        const fidEntry = entry as any; // PerformanceEventTiming
        if (fidEntry.processingStart) {
          this.metrics.firstInputDelay = fidEntry.processingStart - entry.startTime;
          this.checkThreshold('firstInputDelay', this.metrics.firstInputDelay);
        }
      });
    });

    // Cumulative Layout Shift
    this.createObserver(['layout-shift'], (entries) => {
      let clsValue = 0;
      entries.forEach(entry => {
        const clsEntry = entry as any; // LayoutShift
        if (!clsEntry.hadRecentInput && clsEntry.value) {
          clsValue += clsEntry.value;
        }
      });
      this.metrics.cumulativeLayoutShift = clsValue;
      this.checkThreshold('cumulativeLayoutShift', clsValue);
    });
  }

  /**
   * Observa Navigation Timing
   */
  private observeNavigationTiming(): void {
    if (!('performance' in window)) return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
        this.metrics.timeToInteractive = navigation.domInteractive - navigation.fetchStart;

        this.checkThreshold('pageLoadTime', this.metrics.pageLoadTime);
        this.checkThreshold('timeToInteractive', this.metrics.timeToInteractive);
      }
    });
  }

  /**
   * Observa Resource Timing (APIs e imagens)
   */
  private observeResourceTiming(): void {
    this.createObserver(['resource'], (entries) => {
      entries.forEach(entry => {
        const resourceEntry = entry as any; // PerformanceResourceTiming
        if (resourceEntry.responseEnd) {
          const duration = resourceEntry.responseEnd - entry.startTime;

          // API calls
          if (entry.name.includes('api') || entry.name.includes('pokeapi')) {
            this.metrics.apiResponseTime = duration;
            this.checkThreshold('apiResponseTime', duration);
          }

          // Images
          if (resourceEntry.initiatorType === 'img') {
            this.metrics.imageLoadTime = duration;
            this.checkThreshold('imageLoadTime', duration);
          }
        }
      });
    });
  }

  /**
   * Observa uso de memória (se disponível)
   */
  private observeMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;

        this.metrics.memoryUsage = usedMB;
        this.checkThreshold('memoryUsage', usedMB);
      }, 10000); // A cada 10 segundos
    }
  }

  /**
   * Cria um PerformanceObserver
   */
  private createObserver(entryTypes: string[], callback: (entries: PerformanceEntry[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });

      observer.observe({ entryTypes });
    } catch (error) {
      console.warn('PerformanceObserver not supported for:', entryTypes);
    }
  }

  /**
   * Verifica se uma métrica excede o threshold
   */
  private checkThreshold(metric: keyof typeof this.thresholds, value: number): void {
    const threshold = this.thresholds[metric];

    if (value > threshold) {
      const alert: PerformanceAlert = {
        type: value > threshold * 1.5 ? 'critical' : 'warning',
        metric,
        value,
        threshold,
        message: `${metric} (${value.toFixed(2)}) excedeu o threshold (${threshold})`,
        timestamp: Date.now()
      };

      this.addAlert(alert);
    }
  }

  /**
   * Adiciona um alerta
   */
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.unshift(alert);

    // Manter apenas os últimos 50 alertas
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }

    this.alertsSubject.next([...this.alerts]);

    console.warn(`[Performance Alert] ${alert.message}`);
  }

  /**
   * Coleta todas as métricas atuais
   */
  private collectMetrics(): void {
    const currentMetrics: PerformanceMetrics = {
      firstContentfulPaint: this.metrics.firstContentfulPaint || 0,
      largestContentfulPaint: this.metrics.largestContentfulPaint || 0,
      firstInputDelay: this.metrics.firstInputDelay || 0,
      cumulativeLayoutShift: this.metrics.cumulativeLayoutShift || 0,
      timeToInteractive: this.metrics.timeToInteractive || 0,
      apiResponseTime: this.metrics.apiResponseTime || 0,
      imageLoadTime: this.metrics.imageLoadTime || 0,
      cacheHitRate: this.metrics.cacheHitRate || 0,
      memoryUsage: this.metrics.memoryUsage || 0,
      networkRequests: this.metrics.networkRequests || 0,
      pageLoadTime: this.metrics.pageLoadTime || 0,
      navigationTiming: this.metrics.navigationTiming || 0,
      errorRate: this.metrics.errorRate || 0,
      timestamp: Date.now()
    };

    this.metricsSubject.next(currentMetrics);
  }

  /**
   * Registra tempo de resposta de API
   */
  recordApiResponse(duration: number): void {
    this.metrics.apiResponseTime = duration;
    this.checkThreshold('apiResponseTime', duration);
  }

  /**
   * Registra hit rate do cache
   */
  recordCacheHitRate(hitRate: number): void {
    this.metrics.cacheHitRate = hitRate;
    this.checkThreshold('cacheHitRate', hitRate);
  }

  /**
   * Registra número de requests de rede
   */
  recordNetworkRequests(count: number): void {
    this.metrics.networkRequests = count;
  }

  /**
   * Registra taxa de erro
   */
  recordErrorRate(rate: number): void {
    this.metrics.errorRate = rate;
    this.checkThreshold('errorRate', rate);
  }

  /**
   * Obtém métricas atuais
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metricsSubject.value;
  }

  /**
   * Obtém alertas atuais
   */
  getCurrentAlerts(): PerformanceAlert[] {
    return this.alertsSubject.value;
  }

  /**
   * Limpa todos os alertas
   */
  clearAlerts(): void {
    this.alerts = [];
    this.alertsSubject.next([]);
  }

  /**
   * Gera relatório de performance
   */
  generateReport(): string {
    const metrics = this.getCurrentMetrics();
    if (!metrics) return 'Nenhuma métrica disponível';

    return `
📊 Relatório de Performance - ${new Date().toLocaleString()}

🎯 Core Web Vitals:
- First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms
- Largest Contentful Paint: ${metrics.largestContentfulPaint.toFixed(2)}ms
- First Input Delay: ${metrics.firstInputDelay.toFixed(2)}ms
- Cumulative Layout Shift: ${metrics.cumulativeLayoutShift.toFixed(3)}
- Time to Interactive: ${metrics.timeToInteractive.toFixed(2)}ms

⚡ Performance:
- API Response Time: ${metrics.apiResponseTime.toFixed(2)}ms
- Image Load Time: ${metrics.imageLoadTime.toFixed(2)}ms
- Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%
- Memory Usage: ${metrics.memoryUsage.toFixed(2)}MB
- Page Load Time: ${metrics.pageLoadTime.toFixed(2)}ms

🚨 Alertas Ativos: ${this.alerts.length}
    `;
  }
}
