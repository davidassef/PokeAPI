import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';

export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop'
}

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
  hasTouch: boolean;
  // Novas propriedades avançadas
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
  isRetina: boolean;
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  isOnline: boolean;
  connectionType: string;
  batteryLevel?: number;
  isCharging?: boolean;
  memoryInfo?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  hardwareConcurrency: number;
  maxTouchPoints: number;
  colorDepth: number;
  colorGamut: string;
  reducedMotion: boolean;
  darkModePreference: boolean;
  isStandalone: boolean; // PWA
  isInWebView: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceDetectionService {
  private deviceInfoSubject = new BehaviorSubject<DeviceInfo>(this.detectDevice());
  public deviceInfo$ = this.deviceInfoSubject.asObservable();

  constructor(private platform: Platform) {
    // Escutar mudanças de orientação e redimensionamento
    window.addEventListener('resize', () => {
      this.updateDeviceInfo();
    });

    window.addEventListener('orientationchange', () => {
      // Aguardar um pouco para a orientação ser aplicada
      setTimeout(() => {
        this.updateDeviceInfo();
      }, 100);
    });

    // Escutar mudanças de conectividade
    window.addEventListener('online', () => {
      // console.log('🌐 Dispositivo ficou online'); // ✅ OTIMIZAÇÃO: Log comentado para reduzir spam no console
      this.updateDeviceInfo();
    });

    window.addEventListener('offline', () => {
      // console.log('📵 Dispositivo ficou offline'); // ✅ OTIMIZAÇÃO: Log comentado para reduzir spam no console
      this.updateDeviceInfo();
    });

    // Escutar mudanças de tema
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', () => {
      // console.log('🌙 Preferência de tema alterada:', darkModeQuery.matches ? 'dark' : 'light'); // ✅ OTIMIZAÇÃO: Log comentado para reduzir spam no console
      this.updateDeviceInfo();
    });

    // Escutar mudanças de motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener('change', () => {
      // console.log('🎭 Preferência de movimento alterada:', motionQuery.matches ? 'reduced' : 'normal'); // ✅ OTIMIZAÇÃO: Log comentado para reduzir spam no console
      this.updateDeviceInfo();
    });

    // console.log('🔍 DeviceDetectionService inicializado com monitoramento avançado'); // ✅ OTIMIZAÇÃO: Log comentado para reduzir spam no console
  }

  /**
   * Detecta o tipo de dispositivo baseado em múltiplos fatores
   */
  private detectDevice(): DeviceInfo {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const userAgent = navigator.userAgent.toLowerCase();

    // Detecção avançada de informações do dispositivo
    const deviceInfo = this.getAdvancedDeviceInfo();

    // Detecção baseada em user agent
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);

    // Detecção especial para DevTools mobile emulation (melhorada)
    const isDevToolsMobile = userAgent.includes('mobile') ||
                            (screenWidth <= 768 && window.innerWidth <= 768) ||
                            navigator.maxTouchPoints > 0 ||
                            (window.orientation !== undefined) ||
                            ('ontouchstart' in window) ||
                            /mobile/i.test(userAgent);

    // Detecção baseada em tamanho de tela (mais agressiva para mobile)
    const isMobileScreen = screenWidth <= 768;
    const isTabletScreen = screenWidth > 768 && screenWidth <= 1024;
    const isDesktopScreen = screenWidth > 1024;

    // Detecção baseada em capacidades touch
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Lógica de decisão combinada
    let deviceType: DeviceType;
    let isMobile: boolean;
    let isTablet: boolean;
    let isDesktop: boolean;

    // Lógica melhorada para detecção mobile (prioriza DevTools e tela pequena)
    if (isMobileScreen || isDevToolsMobile || (isMobileUA && !isTabletUA)) {
      deviceType = DeviceType.MOBILE;
      isMobile = true;
      isTablet = false;
      isDesktop = false;
    } else if (isTabletScreen || isTabletUA) {
      deviceType = DeviceType.TABLET;
      isMobile = false;
      isTablet = true;
      isDesktop = false;
    } else {
      deviceType = DeviceType.DESKTOP;
      isMobile = false;
      isTablet = false;
      isDesktop = true;
    }

    // Casos especiais para dispositivos específicos
    if (userAgent.includes('ipad')) {
      deviceType = DeviceType.TABLET;
      isMobile = false;
      isTablet = true;
      isDesktop = false;
    }

    // iPhone em landscape pode ser considerado tablet para UX
    if (userAgent.includes('iphone') && screenWidth > 736) {
      deviceType = DeviceType.TABLET;
      isMobile = false;
      isTablet = true;
      isDesktop = false;
    }

    // Garantir que todas as propriedades obrigatórias estejam definidas
    const completeDeviceInfo: DeviceInfo = {
      type: deviceType,
      isMobile,
      isTablet,
      isDesktop,
      screenWidth,
      screenHeight,
      userAgent,
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      // Informações avançadas com valores padrão
      orientation: deviceInfo.orientation || 'portrait',
      pixelRatio: deviceInfo.pixelRatio || 1,
      isRetina: deviceInfo.isRetina || false,
      browserName: deviceInfo.browserName || 'Unknown',
      browserVersion: deviceInfo.browserVersion || '0',
      osName: deviceInfo.osName || 'Unknown',
      osVersion: deviceInfo.osVersion || '0',
      isOnline: deviceInfo.isOnline !== undefined ? deviceInfo.isOnline : true,
      connectionType: deviceInfo.connectionType || 'unknown',
      hardwareConcurrency: deviceInfo.hardwareConcurrency || 1,
      maxTouchPoints: deviceInfo.maxTouchPoints || 0,
      colorDepth: deviceInfo.colorDepth || 24,
      colorGamut: deviceInfo.colorGamut || 'unknown',
      reducedMotion: deviceInfo.reducedMotion || false,
      darkModePreference: deviceInfo.darkModePreference || false,
      isStandalone: deviceInfo.isStandalone || false,
      isInWebView: deviceInfo.isInWebView || false,
      batteryLevel: deviceInfo.batteryLevel,
      isCharging: deviceInfo.isCharging,
      memoryInfo: deviceInfo.memoryInfo
    };

    return completeDeviceInfo;
  }

  /**
   * Obtém informações avançadas do dispositivo
   */
  private getAdvancedDeviceInfo(): Partial<DeviceInfo> {
    const userAgent = navigator.userAgent;

    // Detecção de orientação
    const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

    // Informações de pixel ratio e retina
    const pixelRatio = window.devicePixelRatio || 1;
    const isRetina = pixelRatio > 1;

    // Detecção de browser
    const browserInfo = this.detectBrowser(userAgent);

    // Detecção de OS
    const osInfo = this.detectOS(userAgent);

    // Status de conectividade
    const isOnline = navigator.onLine;
    const connectionType = this.getConnectionType();

    // Informações de hardware
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    const maxTouchPoints = navigator.maxTouchPoints || 0;

    // Informações de display
    const colorDepth = screen.colorDepth || 24;
    const colorGamut = this.getColorGamut();

    // Preferências do usuário
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const darkModePreference = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // PWA e WebView detection
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    const isInWebView = this.detectWebView(userAgent);

    // Informações de memória (se disponível)
    const memoryInfo = this.getMemoryInfo();

    // Informações de bateria (se disponível)
    const batteryInfo = this.getBatteryInfo();

    return {
      orientation,
      pixelRatio,
      isRetina,
      browserName: browserInfo.name,
      browserVersion: browserInfo.version,
      osName: osInfo.name,
      osVersion: osInfo.version,
      isOnline,
      connectionType,
      hardwareConcurrency,
      maxTouchPoints,
      colorDepth,
      colorGamut,
      reducedMotion,
      darkModePreference,
      isStandalone,
      isInWebView,
      memoryInfo,
      ...batteryInfo
    };
  }

  /**
   * Atualiza informações do dispositivo
   */
  private updateDeviceInfo(): void {
    const newDeviceInfo = this.detectDevice();
    this.deviceInfoSubject.next(newDeviceInfo);
  }

  /**
   * Retorna informações atuais do dispositivo
   */
  getCurrentDeviceInfo(): DeviceInfo {
    return this.deviceInfoSubject.value;
  }

  /**
   * Verifica se é dispositivo mobile
   */
  isMobile(): boolean {
    return this.getCurrentDeviceInfo().isMobile;
  }

  /**
   * Verifica se é tablet
   */
  isTablet(): boolean {
    return this.getCurrentDeviceInfo().isTablet;
  }

  /**
   * Verifica se é desktop
   */
  isDesktop(): boolean {
    return this.getCurrentDeviceInfo().isDesktop;
  }

  /**
   * Retorna o tipo de dispositivo
   */
  getDeviceType(): DeviceType {
    return this.getCurrentDeviceInfo().type;
  }

  /**
   * Verifica se deve usar interface mobile
   */
  shouldUseMobileInterface(): boolean {
    const deviceInfo = this.getCurrentDeviceInfo();
    const shouldUse = deviceInfo.isMobile || (deviceInfo.isTablet && deviceInfo.screenWidth <= 768);

    // Debug log detalhado
    // console.log('🔍 DeviceDetection - shouldUseMobileInterface:', { // ✅ OTIMIZAÇÃO: Log comentado para reduzir spam no console
    //   shouldUse,
    //   deviceType: deviceInfo.type,
    //   isMobile: deviceInfo.isMobile,
    //   isTablet: deviceInfo.isTablet,
    //   isDesktop: deviceInfo.isDesktop,
    //   screenWidth: deviceInfo.screenWidth,
    //   screenHeight: window.innerHeight,
    //   hasTouch: deviceInfo.hasTouch,
    //   maxTouchPoints: navigator.maxTouchPoints,
    //   orientation: window.orientation,
    //   userAgent: deviceInfo.userAgent.substring(0, 80) + '...',
    //   currentURL: window.location.href,
    //   timestamp: new Date().toISOString()
    // });

    return shouldUse;
  }

  /**
   * Verifica se deve usar interface web/desktop
   */
  shouldUseWebInterface(): boolean {
    return !this.shouldUseMobileInterface();
  }

  /**
   * Retorna observável para mudanças de dispositivo
   */
  getDeviceInfo(): Observable<DeviceInfo> {
    return this.deviceInfo$;
  }

  /**
   * Força uma nova detecção
   */
  forceDetection(): void {
    this.updateDeviceInfo();
  }

  /**
   * Verifica se é dispositivo iOS
   */
  isIOS(): boolean {
    const deviceInfo = this.getCurrentDeviceInfo();
    return deviceInfo.osName === 'iOS';
  }

  /**
   * Verifica se é dispositivo Android
   */
  isAndroid(): boolean {
    const deviceInfo = this.getCurrentDeviceInfo();
    return deviceInfo.osName === 'Android';
  }

  /**
   * Verifica se está em modo retina
   */
  isRetina(): boolean {
    return this.getCurrentDeviceInfo().isRetina;
  }

  /**
   * Verifica se está online
   */
  isOnline(): boolean {
    return this.getCurrentDeviceInfo().isOnline;
  }

  /**
   * Verifica se está em modo landscape
   */
  isLandscape(): boolean {
    return this.getCurrentDeviceInfo().orientation === 'landscape';
  }

  /**
   * Verifica se está em modo portrait
   */
  isPortrait(): boolean {
    return this.getCurrentDeviceInfo().orientation === 'portrait';
  }

  /**
   * Verifica se prefere tema escuro
   */
  prefersDarkMode(): boolean {
    return this.getCurrentDeviceInfo().darkModePreference;
  }

  /**
   * Verifica se prefere movimento reduzido
   */
  prefersReducedMotion(): boolean {
    return this.getCurrentDeviceInfo().reducedMotion;
  }

  /**
   * Verifica se é PWA
   */
  isPWA(): boolean {
    return this.getCurrentDeviceInfo().isStandalone;
  }

  /**
   * Verifica se está em WebView
   */
  isWebView(): boolean {
    return this.getCurrentDeviceInfo().isInWebView;
  }

  /**
   * Obtém informações de performance
   */
  getPerformanceInfo(): {
    hardwareConcurrency: number;
    memoryInfo?: DeviceInfo['memoryInfo'];
    connectionType: string;
    pixelRatio: number;
  } {
    const deviceInfo = this.getCurrentDeviceInfo();
    return {
      hardwareConcurrency: deviceInfo.hardwareConcurrency,
      memoryInfo: deviceInfo.memoryInfo,
      connectionType: deviceInfo.connectionType,
      pixelRatio: deviceInfo.pixelRatio
    };
  }

  /**
   * Obtém informações de display
   */
  getDisplayInfo(): {
    screenWidth: number;
    screenHeight: number;
    pixelRatio: number;
    colorDepth: number;
    colorGamut: string;
    orientation: string;
  } {
    const deviceInfo = this.getCurrentDeviceInfo();
    return {
      screenWidth: deviceInfo.screenWidth,
      screenHeight: deviceInfo.screenHeight,
      pixelRatio: deviceInfo.pixelRatio,
      colorDepth: deviceInfo.colorDepth,
      colorGamut: deviceInfo.colorGamut,
      orientation: deviceInfo.orientation
    };
  }

  /**
   * Detecta informações do browser
   */
  private detectBrowser(userAgent: string): { name: string; version: string } {
    const browsers = [
      { name: 'Chrome', regex: /chrome\/(\d+)/i },
      { name: 'Firefox', regex: /firefox\/(\d+)/i },
      { name: 'Safari', regex: /safari\/(\d+)/i },
      { name: 'Edge', regex: /edge\/(\d+)/i },
      { name: 'Opera', regex: /opera\/(\d+)/i },
      { name: 'Internet Explorer', regex: /msie (\d+)/i }
    ];

    for (const browser of browsers) {
      const match = userAgent.match(browser.regex);
      if (match) {
        return { name: browser.name, version: match[1] };
      }
    }

    return { name: 'Unknown', version: '0' };
  }

  /**
   * Detecta informações do sistema operacional
   */
  private detectOS(userAgent: string): { name: string; version: string } {
    const systems = [
      { name: 'iOS', regex: /os (\d+_\d+)/i },
      { name: 'Android', regex: /android (\d+\.?\d*)/i },
      { name: 'Windows', regex: /windows nt (\d+\.?\d*)/i },
      { name: 'macOS', regex: /mac os x (\d+_\d+)/i },
      { name: 'Linux', regex: /linux/i }
    ];

    for (const system of systems) {
      const match = userAgent.match(system.regex);
      if (match) {
        const version = match[1] ? match[1].replace(/_/g, '.') : '0';
        return { name: system.name, version };
      }
    }

    return { name: 'Unknown', version: '0' };
  }

  /**
   * Obtém tipo de conexão
   */
  private getConnectionType(): string {
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    if (connection) {
      return connection.effectiveType || connection.type || 'unknown';
    }

    return 'unknown';
  }

  /**
   * Obtém informações de color gamut
   */
  private getColorGamut(): string {
    if (window.matchMedia('(color-gamut: p3)').matches) {
      return 'p3';
    } else if (window.matchMedia('(color-gamut: srgb)').matches) {
      return 'srgb';
    } else if (window.matchMedia('(color-gamut: rec2020)').matches) {
      return 'rec2020';
    }
    return 'unknown';
  }

  /**
   * Detecta se está em WebView
   */
  private detectWebView(userAgent: string): boolean {
    return /wv|webview/i.test(userAgent) ||
           (window as any).ReactNativeWebView !== undefined ||
           (window as any).webkit?.messageHandlers !== undefined;
  }

  /**
   * Obtém informações de memória
   */
  private getMemoryInfo(): DeviceInfo['memoryInfo'] | undefined {
    const memory = (performance as any).memory;
    if (memory) {
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return undefined;
  }

  /**
   * Obtém informações de bateria
   */
  private getBatteryInfo(): { batteryLevel?: number; isCharging?: boolean } {
    // Battery API é experimental e pode não estar disponível
    return {}; // Implementação futura se necessário
  }

  /**
   * Retorna informações de debug
   */
  getDebugInfo(): any {
    const deviceInfo = this.getCurrentDeviceInfo();
    return {
      ...deviceInfo,
      platformInfo: {
        isAndroid: this.platform.is('android'),
        isIOS: this.platform.is('ios'),
        isCordova: this.platform.is('cordova'),
        isCapacitor: this.platform.is('capacitor'),
        isPWA: this.platform.is('pwa'),
        isDesktop: this.platform.is('desktop'),
        isMobile: this.platform.is('mobile'),
        isTablet: this.platform.is('tablet')
      },
      windowInfo: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        devicePixelRatio: window.devicePixelRatio,
        orientation: window.orientation || 'unknown'
      }
    };
  }
}
