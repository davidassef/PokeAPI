import { environment } from '../../../environments/environment';

/**
 * Configuração para suprimir avisos conhecidos e não críticos
 */
export const APP_CONFIG = {
  // Modo de desenvolvimento
  isDevelopment: !environment.production,

  // Configurações de sincronização baseadas no ambiente
  sync: {
    // Em produção, agora também temos client-server deployado
    enableClientServer: true, // Sempre habilitado agora
    clientServerUrl: environment.clientServerUrl || 'http://localhost:3001',
    fallbackToBackendOnly: false, // Não precisamos mais de fallback
    maxRetries: 2
  },

  // Configurações de logging
  logging: {
    suppressKnownWarnings: true,
    logLevel: 'warn' as 'debug' | 'info' | 'warn' | 'error',

    // Filtros para suprimir avisos específicos
    suppressedWarnings: [
      'ms-high-contrast', // Aviso de depreciação CSS
      'Images loaded lazily', // Aviso de lazy loading
      'Ionic Warning', // Avisos do Ionic já tratados
    ]
  },

  // Configurações de conectividade
  connectivity: {
    serverTimeout: 3000, // ms
    retryAttempts: 2,
    fallbackToLocal: true
  },

  // Configurações de UI
  ui: {
    showConnectionWarnings: true,
    autoHideNotifications: true,
    notificationDuration: 5000 // ms
  }
};

/**
 * Função para verificar se um aviso deve ser suprimido
 */
export function shouldSuppressWarning(message: string): boolean {
  if (!APP_CONFIG.logging.suppressKnownWarnings) {
    return false;
  }

  return APP_CONFIG.logging.suppressedWarnings.some(
    warning => message.includes(warning)
  );
}

/**
 * Console personalizado que filtra avisos conhecidos
 */
export const customConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: (message: string, ...args: any[]) => {
    if (!shouldSuppressWarning(message)) {
      console.warn(message, ...args);
    }
  },
  error: console.error.bind(console),
  debug: console.debug.bind(console)
};
