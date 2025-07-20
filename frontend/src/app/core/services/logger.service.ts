import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../config/app.config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogComponent = 'auth' | 'cache' | 'musicPlayer' | 'captured' | 'performance' | 'navigation' | 'startup' | 'general' | 'pokeapi' | 'viewedPokemon' | 'app' | 'imagePreload' | 'theme';

/**
 * ✅ OTIMIZAÇÃO: Serviço centralizado de logging com controle granular
 * Reduz spam no console mantendo logs essenciais
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly isProduction = environment.production;
  private readonly config = APP_CONFIG.logging;

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(component: LogComponent, message: string, ...args: any[]): void {
    if (this.shouldLog('debug', component)) {
      console.log(`🔍 [${component.toUpperCase()}] ${message}`, ...args);
    }
  }

  /**
   * Log de informação
   */
  info(component: LogComponent, message: string, ...args: any[]): void {
    if (this.shouldLog('info', component)) {
      console.log(`ℹ️ [${component.toUpperCase()}] ${message}`, ...args);
    }
  }

  /**
   * Log de warning (sempre mostrado se configurado)
   */
  warn(component: LogComponent, message: string, ...args: any[]): void {
    if (this.shouldLog('warn', component) || this.config.alwaysShow.warnings) {
      console.warn(`⚠️ [${component.toUpperCase()}] ${message}`, ...args);
    }
  }

  /**
   * Log de erro (sempre mostrado)
   */
  error(component: LogComponent, message: string, ...args: any[]): void {
    if (this.config.alwaysShow.errors) {
      console.error(`❌ [${component.toUpperCase()}] ${message}`, ...args);
    }
  }

  /**
   * Log crítico (sempre mostrado)
   */
  critical(component: LogComponent, message: string, ...args: any[]): void {
    if (this.config.alwaysShow.critical) {
      console.error(`🚨 [CRITICAL-${component.toUpperCase()}] ${message}`, ...args);
    }
  }

  /**
   * Log de ação do usuário (opcional)
   */
  userAction(action: string, details?: any): void {
    if (this.config.alwaysShow.userActions) {
      console.log(`👤 [USER] ${action}`, details);
    }
  }

  /**
   * Log agrupado para operações relacionadas
   */
  group(component: LogComponent, title: string, callback: () => void): void {
    if (this.shouldLog('info', component)) {
      console.group(`📁 [${component.toUpperCase()}] ${title}`);
      callback();
      console.groupEnd();
    } else {
      // Executar callback mesmo se não mostrar logs
      callback();
    }
  }

  /**
   * Log de performance com métricas
   */
  performance(operation: string, duration: number, details?: any): void {
    if (this.shouldLog('info', 'performance')) {
      const emoji = duration > 1000 ? '🐌' : duration > 500 ? '⚠️' : '⚡';
      console.log(`${emoji} [PERFORMANCE] ${operation}: ${duration.toFixed(2)}ms`, details);
    }
  }

  /**
   * Determinar se deve mostrar log baseado no nível e componente
   */
  private shouldLog(level: LogLevel, component: LogComponent): boolean {
    // Em produção, apenas erros e warnings críticos
    if (this.isProduction && level !== 'error' && level !== 'warn') {
      return false;
    }

    // Verificar se o componente está habilitado
    if (component !== 'general' && this.config.componentLogs[component] === false) {
      return false;
    }

    // Verificar nível de log global
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const requestedLevelIndex = levels.indexOf(level);

    return requestedLevelIndex >= currentLevelIndex;
  }

  /**
   * Habilitar logs de um componente específico (para debug)
   */
  enableComponent(component: LogComponent): void {
    if (!this.isProduction) {
      (this.config.componentLogs as any)[component] = true;
      console.log(`🔧 [LOGGER] Logs habilitados para componente: ${component}`);
    }
  }

  /**
   * Desabilitar logs de um componente específico
   */
  disableComponent(component: LogComponent): void {
    (this.config.componentLogs as any)[component] = false;
    console.log(`🔇 [LOGGER] Logs desabilitados para componente: ${component}`);
  }

  /**
   * Mostrar configuração atual de logs
   */
  showConfig(): void {
    console.group('🔧 [LOGGER] Configuração atual');
    console.log('Produção:', this.isProduction);
    console.log('Nível global:', this.config.logLevel);
    console.log('Componentes:', this.config.componentLogs);
    console.log('Sempre mostrar:', this.config.alwaysShow);
    console.groupEnd();
  }
}
