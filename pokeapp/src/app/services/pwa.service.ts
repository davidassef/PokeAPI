// 📱 PWA Service
// Funcionalidades Progressive Web App

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PWAService {

  private deferredPrompt: any;
  private isInstallable = false;
  private isInstalled = false;

  constructor() {
    this.initializePWA();
    this.setupNetworkMonitoring();
  }

  /**
   * Inicializa funcionalidades PWA
   */
  private initializePWA(): void {
    // Detecta quando app pode ser instalado
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.isInstallable = true;

      console.log('📱 PWA: App pode ser instalado');
    });

    // Detecta quando app foi instalado
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;

      console.log('📱 PWA: App foi instalado com sucesso');
      this.trackInstallation();
    });

    // Detecta se já está instalado
    if (this.isRunningInStandaloneMode()) {
      this.isInstalled = true;
    }
  }

  /**
   * Mostra prompt de instalação
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      const result = await this.deferredPrompt.prompt();
      const outcome = await result.userChoice;

      if (outcome === 'accepted') {
        console.log('📱 PWA: Usuário aceitou instalação');
        return true;
      } else {
        console.log('📱 PWA: Usuário recusou instalação');
        return false;
      }
    } catch (error) {
      console.error('📱 PWA: Erro ao mostrar prompt:', error);
      return false;
    } finally {
      this.deferredPrompt = null;
      this.isInstallable = false;
    }
  }

  /**
   * Verifica se pode ser instalado
   */
  canInstall(): boolean {
    return this.isInstallable && !this.isInstalled;
  }

  /**
   * Verifica se já está instalado
   */
  isAppInstalled(): boolean {
    return this.isInstalled;
  }

  /**
   * Verifica se está rodando como PWA
   */
  isRunningInStandaloneMode(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://')
    );
  }
  /**
   * Verifica e aplica atualizações (simplificado sem service worker)
   */
  async checkForUpdates(): Promise<void> {
    // Implementação básica para verificar atualizações
    try {
      const response = await fetch('/version.json');
      const versionInfo = await response.json();
      const currentVersion = localStorage.getItem('app-version');

      if (currentVersion && currentVersion !== versionInfo.version) {
        await this.promptForUpdate();
      }

      localStorage.setItem('app-version', versionInfo.version);
    } catch (error) {
      console.error('📱 PWA: Erro ao verificar atualizações:', error);
    }
  }

  /**
   * Pergunta ao usuário se quer atualizar
   */
  private async promptForUpdate(): Promise<void> {
    const shouldUpdate = confirm(
      'Uma nova versão da Pokédex está disponível. Deseja atualizar agora?',
    );

    if (shouldUpdate) {
      window.location.reload();
    }
  }

  /**
   * Força atualização manual
   */
  async forceUpdate(): Promise<void> {
    window.location.reload();
  }

  /**
   * Obtém informações sobre cache
   */
  async getCacheInfo(): Promise<any> {
    if (!('caches' in window)) {
      return null;
    }

    try {
      const cacheNames = await caches.keys();
      const cacheInfo = await Promise.all(
        cacheNames.map(async (name) => {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          return {
            name,
            size: keys.length,
            urls: keys.map(req => req.url),
          };
        }),
      );

      return cacheInfo;
    } catch (error) {
      console.error('📱 PWA: Erro ao obter informações do cache:', error);
      return null;
    }
  }

  /**
   * Limpa cache antigo
   */
  async clearOldCaches(): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      const currentVersion = 'v1'; // Definir versão atual

      await Promise.all(
        cacheNames
          .filter(name => !name.includes(currentVersion))
          .map(name => caches.delete(name)),
      );

      console.log('📱 PWA: Caches antigos removidos');
    } catch (error) {
      console.error('📱 PWA: Erro ao limpar caches:', error);
    }
  }

  /**
   * Pré-carrega recursos críticos
   */
  async preloadCriticalResources(): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    const criticalUrls = [
      '/assets/images/pokeball.svg',
      '/assets/images/pokemon-logo.png',
      // Adicionar outras URLs críticas
    ];

    try {
      const cache = await caches.open('critical-v1');
      await cache.addAll(criticalUrls);
      console.log('📱 PWA: Recursos críticos pré-carregados');
    } catch (error) {
      console.error('📱 PWA: Erro ao pré-carregar recursos:', error);
    }
  }

  /**
   * Monitora status de conexão
   */
  setupNetworkMonitoring(): void {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      document.body.classList.toggle('offline', !isOnline);
        if (isOnline) {
        console.log('📱 PWA: Conexão restaurada');
        this.checkForUpdates();
      } else {
        console.log('📱 PWA: Aplicação offline');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Estado inicial
    updateOnlineStatus();
  }

  /**
   * Obtém estatísticas de uso
   */
  getUsageStats(): any {
    const stats = {
      isInstalled: this.isInstalled,
      isStandalone: this.isRunningInStandaloneMode(),
      canInstall: this.canInstall(),
      isOnline: navigator.onLine,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      installPromptShown: !!this.deferredPrompt,
      lastUpdate: localStorage.getItem('pwa-last-update'),
      launchCount: this.incrementLaunchCount(),
    };

    // Salva timestamp da última verificação
    localStorage.setItem('pwa-last-update', new Date().toISOString());

    return stats;
  }

  /**
   * Incrementa contador de launches
   */
  private incrementLaunchCount(): number {
    const count = parseInt(localStorage.getItem('pwa-launch-count') || '0') + 1;
    localStorage.setItem('pwa-launch-count', count.toString());
    return count;
  }

  /**
   * Track instalação para analytics
   */
  private trackInstallation(): void {
    // Implementar tracking de instalação
    console.log('📱 PWA: Tracking instalação...');

    // Salvar no localStorage
    localStorage.setItem('pwa-installed', 'true');
    localStorage.setItem('pwa-install-date', new Date().toISOString());
  }

  /**
   * Obtém informações de dispositivo PWA
   */
  getDeviceInfo(): any {
    return {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      doNotTrack: navigator.doNotTrack,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
      connection: (navigator as any).connection,
      serviceWorker: 'serviceWorker' in navigator,
      notifications: 'Notification' in window,
      geolocation: 'geolocation' in navigator,
      localStorage: 'localStorage' in window,
      sessionStorage: 'sessionStorage' in window,
      indexedDB: 'indexedDB' in window,
    };
  }
}
