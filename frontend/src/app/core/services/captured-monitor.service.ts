import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { CapturedService } from './captured.service';
import { AuthService } from './auth.service';

/**
 * ✅ NOVO: Serviço de monitoramento contínuo do sistema de capturados
 * Detecta problemas potenciais e gera alertas para debugging
 */
@Injectable({
  providedIn: 'root'
})
export class CapturedMonitorService {
  private monitoringActive = false;
  private monitoringInterval: any;
  private readonly MONITORING_INTERVAL = 30000; // 30 segundos

  // Métricas de monitoramento
  private metricsSubject = new BehaviorSubject<CapturedMetrics>({
    totalCaptured: 0,
    cacheSize: 0,
    lastSync: null,
    authStatus: false,
    errorCount: 0,
    warningCount: 0,
    lastError: null,
    uptime: 0
  });

  public metrics$ = this.metricsSubject.asObservable();
  private startTime = Date.now();
  private errorHistory: MonitoringError[] = [];
  private warningHistory: MonitoringWarning[] = [];

  constructor(
    private capturedService: CapturedService,
    private authService: AuthService
  ) {
    this.initializeMonitoring();
  }

  /**
   * ✅ Inicializa o monitoramento automático
   */
  private initializeMonitoring(): void {
    console.log('[CapturedMonitor] 🔍 Inicializando monitoramento contínuo...');

    // Monitora mudanças no estado de capturas
    this.capturedService.captured$.subscribe({
      next: (captured) => {
        this.updateMetrics({ totalCaptured: captured.length });
        this.checkForAnomalies(captured);
      },
      error: (error) => {
        this.recordError('captured_observable_error', error);
      }
    });

    // Monitora mudanças no estado de autenticação
    this.authService.getAuthState().subscribe({
      next: (isAuthenticated) => {
        this.updateMetrics({ authStatus: isAuthenticated });
        if (!isAuthenticated) {
          this.recordWarning('user_logged_out', 'Usuário deslogado - monitorando cache local');
        }
      },
      error: (error) => {
        this.recordError('auth_observable_error', error);
      }
    });

    this.startPeriodicMonitoring();
  }

  /**
   * ✅ Inicia monitoramento periódico
   */
  startPeriodicMonitoring(): void {
    if (this.monitoringActive) {
      console.log('[CapturedMonitor] ⚠️ Monitoramento já está ativo');
      return;
    }

    this.monitoringActive = true;
    console.log('[CapturedMonitor] ▶️ Iniciando monitoramento periódico...');

    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.MONITORING_INTERVAL);
  }

  /**
   * ✅ Para o monitoramento periódico
   */
  stopPeriodicMonitoring(): void {
    if (!this.monitoringActive) {
      return;
    }

    this.monitoringActive = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('[CapturedMonitor] ⏹️ Monitoramento periódico parado');
  }

  /**
   * ✅ Executa verificação de saúde do sistema
   */
  private performHealthCheck(): void {
    const currentMetrics = this.metricsSubject.value;
    const uptime = Date.now() - this.startTime;

    // Verifica se há dados de captura (usando o observable)
    let capturedCount = 0;
    this.capturedService.captured$.pipe(take(1)).subscribe(captured => {
      capturedCount = captured.length;
    });

    // Verifica cache do serviço (se acessível)
    const cacheSize = this.getCacheSize();

    // Verifica última sincronização
    const lastSync = this.getLastSyncTime();

    // Atualiza métricas
    this.updateMetrics({
      totalCaptured: capturedCount,
      cacheSize: cacheSize,
      lastSync: lastSync,
      authStatus: this.authService.isAuthenticated(),
      uptime: uptime
    });

    // Verifica anomalias
    this.checkSystemHealth(currentMetrics);

    console.log('[CapturedMonitor] 💓 Health check realizado:', {
      capturedCount,
      cacheSize,
      lastSync: lastSync ? new Date(lastSync).toISOString() : 'nunca',
      authenticated: this.authService.isAuthenticated(),
      uptime: Math.floor(uptime / 1000) + 's'
    });
  }

  /**
   * ✅ Verifica anomalias no sistema
   */
  private checkForAnomalies(captured: any[]): void {
    const currentMetrics = this.metricsSubject.value;

    // Verifica perda súbita de dados
    if (currentMetrics.totalCaptured > 0 && captured.length === 0) {
      this.recordError('data_loss_detected', {
        message: 'Perda súbita de dados detectada',
        previousCount: currentMetrics.totalCaptured,
        currentCount: captured.length,
        timestamp: new Date().toISOString()
      });
    }

    // Verifica redução significativa
    if (currentMetrics.totalCaptured > 5 && captured.length < currentMetrics.totalCaptured * 0.5) {
      this.recordWarning('significant_data_reduction', {
        message: 'Redução significativa de dados detectada',
        previousCount: currentMetrics.totalCaptured,
        currentCount: captured.length,
        reductionPercent: Math.round((1 - captured.length / currentMetrics.totalCaptured) * 100)
      });
    }
  }

  /**
   * ✅ Verifica saúde geral do sistema
   */
  private checkSystemHealth(metrics: CapturedMetrics): void {
    // Verifica se não há sincronização há muito tempo
    if (metrics.lastSync && Date.now() - metrics.lastSync > 10 * 60 * 1000) { // 10 minutos
      this.recordWarning('sync_outdated', {
        message: 'Última sincronização há mais de 10 minutos',
        lastSync: new Date(metrics.lastSync).toISOString(),
        minutesAgo: Math.floor((Date.now() - metrics.lastSync) / (1000 * 60))
      });
    }

    // Verifica se usuário está autenticado mas sem dados
    if (metrics.authStatus && metrics.totalCaptured === 0 && metrics.uptime > 60000) { // 1 minuto
      this.recordWarning('authenticated_no_data', {
        message: 'Usuário autenticado mas sem dados de captura após 1 minuto',
        uptime: Math.floor(metrics.uptime / 1000)
      });
    }
  }

  /**
   * ✅ Registra erro no histórico
   */
  private recordError(type: string, error: any): void {
    const errorRecord: MonitoringError = {
      type,
      error,
      timestamp: Date.now(),
      id: Date.now().toString()
    };

    this.errorHistory.unshift(errorRecord);
    if (this.errorHistory.length > 50) {
      this.errorHistory = this.errorHistory.slice(0, 50);
    }

    this.updateMetrics({
      errorCount: this.errorHistory.length,
      lastError: errorRecord
    });

    console.error(`[CapturedMonitor] 🚨 ERRO DETECTADO [${type}]:`, error);
  }

  /**
   * ✅ Registra warning no histórico
   */
  private recordWarning(type: string, warning: any): void {
    const warningRecord: MonitoringWarning = {
      type,
      warning,
      timestamp: Date.now(),
      id: Date.now().toString()
    };

    this.warningHistory.unshift(warningRecord);
    if (this.warningHistory.length > 100) {
      this.warningHistory = this.warningHistory.slice(0, 100);
    }

    this.updateMetrics({ warningCount: this.warningHistory.length });

    console.warn(`[CapturedMonitor] ⚠️ WARNING DETECTADO [${type}]:`, warning);
  }

  /**
   * ✅ Atualiza métricas
   */
  private updateMetrics(updates: Partial<CapturedMetrics>): void {
    const currentMetrics = this.metricsSubject.value;
    this.metricsSubject.next({ ...currentMetrics, ...updates });
  }

  /**
   * ✅ Obtém tamanho do cache (se possível)
   */
  private getCacheSize(): number {
    try {
      // Tenta acessar cache interno do serviço
      return (this.capturedService as any).cachedCaptured?.length || 0;
    } catch {
      return 0;
    }
  }

  /**
   * ✅ Obtém timestamp da última sincronização
   */
  private getLastSyncTime(): number | null {
    try {
      // Tenta acessar timestamp interno do serviço
      return (this.capturedService as any).lastSuccessfulFetch || null;
    } catch {
      return null;
    }
  }

  /**
   * ✅ Obtém histórico de erros
   */
  getErrorHistory(): MonitoringError[] {
    return [...this.errorHistory];
  }

  /**
   * ✅ Obtém histórico de warnings
   */
  getWarningHistory(): MonitoringWarning[] {
    return [...this.warningHistory];
  }

  /**
   * ✅ Gera relatório de saúde do sistema
   */
  generateHealthReport(): HealthReport {
    const metrics = this.metricsSubject.value;
    const recentErrors = this.errorHistory.filter(e => Date.now() - e.timestamp < 60 * 60 * 1000); // 1 hora
    const recentWarnings = this.warningHistory.filter(w => Date.now() - w.timestamp < 60 * 60 * 1000); // 1 hora

    return {
      timestamp: Date.now(),
      metrics,
      recentErrors,
      recentWarnings,
      systemStatus: this.determineSystemStatus(metrics, recentErrors, recentWarnings),
      recommendations: this.generateRecommendations(metrics, recentErrors, recentWarnings)
    };
  }

  /**
   * ✅ Determina status geral do sistema
   */
  private determineSystemStatus(metrics: CapturedMetrics, errors: MonitoringError[], warnings: MonitoringWarning[]): 'healthy' | 'warning' | 'critical' {
    if (errors.length > 0) {
      return 'critical';
    }
    if (warnings.length > 3) {
      return 'warning';
    }
    if (!metrics.authStatus && metrics.totalCaptured === 0) {
      return 'warning';
    }
    return 'healthy';
  }

  /**
   * ✅ Gera recomendações baseadas no estado
   */
  private generateRecommendations(metrics: CapturedMetrics, errors: MonitoringError[], warnings: MonitoringWarning[]): string[] {
    const recommendations: string[] = [];

    if (errors.length > 0) {
      recommendations.push('Verificar logs de erro e corrigir problemas críticos');
    }
    if (warnings.length > 5) {
      recommendations.push('Investigar warnings recorrentes');
    }
    if (metrics.lastSync && Date.now() - metrics.lastSync > 30 * 60 * 1000) {
      recommendations.push('Forçar sincronização manual - dados podem estar desatualizados');
    }
    if (!metrics.authStatus && metrics.uptime > 5 * 60 * 1000) {
      recommendations.push('Usuário não autenticado há mais de 5 minutos - verificar sessão');
    }

    return recommendations;
  }

  /**
   * ✅ NOVO: Método para debug - exibe relatório no console
   */
  debugPrintHealthReport(): void {
    const report = this.generateHealthReport();

    console.group('[CapturedMonitor] 📊 RELATÓRIO DE SAÚDE DO SISTEMA');
    console.log('🕐 Timestamp:', new Date(report.timestamp).toISOString());
    console.log('📈 Status:', report.systemStatus.toUpperCase());

    console.group('📊 Métricas:');
    console.log('• Total Capturado:', report.metrics.totalCaptured);
    console.log('• Cache Size:', report.metrics.cacheSize);
    console.log('• Última Sync:', report.metrics.lastSync ? new Date(report.metrics.lastSync).toISOString() : 'Nunca');
    console.log('• Autenticado:', report.metrics.authStatus ? '✅' : '❌');
    console.log('• Uptime:', Math.floor(report.metrics.uptime / 1000) + 's');
    console.log('• Erros:', report.metrics.errorCount);
    console.log('• Warnings:', report.metrics.warningCount);
    console.groupEnd();

    if (report.recentErrors.length > 0) {
      console.group('🚨 Erros Recentes:');
      report.recentErrors.forEach(error => {
        console.error(`[${error.type}]`, error.error);
      });
      console.groupEnd();
    }

    if (report.recentWarnings.length > 0) {
      console.group('⚠️ Warnings Recentes:');
      report.recentWarnings.forEach(warning => {
        console.warn(`[${warning.type}]`, warning.warning);
      });
      console.groupEnd();
    }

    if (report.recommendations.length > 0) {
      console.group('💡 Recomendações:');
      report.recommendations.forEach(rec => console.log('•', rec));
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * ✅ NOVO: Método para adicionar ao window para debug global
   */
  enableGlobalDebug(): void {
    (window as any).capturedMonitor = {
      getMetrics: () => this.metricsSubject.value,
      getHealthReport: () => this.generateHealthReport(),
      printReport: () => this.debugPrintHealthReport(),
      getErrors: () => this.getErrorHistory(),
      getWarnings: () => this.getWarningHistory(),
      startMonitoring: () => this.startPeriodicMonitoring(),
      stopMonitoring: () => this.stopPeriodicMonitoring()
    };

    console.log('[CapturedMonitor] 🔧 Debug global habilitado. Use window.capturedMonitor');
  }
}

// ✅ Interfaces para tipagem
export interface CapturedMetrics {
  totalCaptured: number;
  cacheSize: number;
  lastSync: number | null;
  authStatus: boolean;
  errorCount: number;
  warningCount: number;
  lastError: MonitoringError | null;
  uptime: number;
}

export interface MonitoringError {
  id: string;
  type: string;
  error: any;
  timestamp: number;
}

export interface MonitoringWarning {
  id: string;
  type: string;
  warning: any;
  timestamp: number;
}

export interface HealthReport {
  timestamp: number;
  metrics: CapturedMetrics;
  recentErrors: MonitoringError[];
  recentWarnings: MonitoringWarning[];
  systemStatus: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
}
