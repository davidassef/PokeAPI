import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { DeviceDetectionService } from './device-detection.service';

@Injectable({
  providedIn: 'root'
})
export class RouteRedirectService {

  constructor(
    private router: Router,
    private deviceDetectionService: DeviceDetectionService
  ) {}

  /**
   * Verifica se a rota atual está correta para o dispositivo e redireciona se necessário
   */
  checkAndRedirectIfNeeded(): void {
    const currentPath = this.router.url;
    const shouldUseMobile = this.deviceDetectionService.shouldUseMobileInterface();

    console.log('🔄 RouteRedirectService - Verificando redirecionamento:', {
      currentPath,
      shouldUseMobile,
      timestamp: new Date().toISOString()
    });

    // Se está em rota web mas deveria estar em mobile
    if (currentPath.startsWith('/tabs') && shouldUseMobile) {
      const mobilePath = this.mapWebToMobilePath(currentPath);
      console.log('📱 Redirecionamento WEB → MOBILE:', currentPath, '→', mobilePath);
      this.router.navigate([mobilePath]);
      return;
    }

    // Se está em rota mobile mas deveria estar em web
    if (currentPath.startsWith('/mobile') && !shouldUseMobile) {
      const webPath = this.mapMobileToWebPath(currentPath);
      console.log('🖥️ Redirecionamento MOBILE → WEB:', currentPath, '→', webPath);
      this.router.navigate([webPath]);
      return;
    }

    console.log('✅ Rota atual está correta para o dispositivo');
  }

  /**
   * Mapeia rotas web para mobile
   */
  private mapWebToMobilePath(webPath: string): string {
    if (webPath.includes('/tabs/home')) return '/mobile/home';
    if (webPath.includes('/tabs/captured')) return '/mobile/captured';
    if (webPath.includes('/tabs/ranking')) return '/mobile/ranking';
    if (webPath.includes('/tabs/settings')) return '/mobile/settings';

    // Fallback padrão
    return '/mobile/home';
  }

  /**
   * Mapeia rotas mobile para web
   */
  private mapMobileToWebPath(mobilePath: string): string {
    if (mobilePath.includes('/mobile/home')) return '/tabs/home';
    if (mobilePath.includes('/mobile/captured')) return '/tabs/captured';
    if (mobilePath.includes('/mobile/ranking')) return '/tabs/ranking';
    if (mobilePath.includes('/mobile/settings')) return '/tabs/settings';

    // Fallback padrão
    return '/tabs/home';
  }

  /**
   * Força redirecionamento para interface mobile
   */
  forceRedirectToMobile(): void {
    console.log('🔧 Forçando redirecionamento para MOBILE');
    this.router.navigate(['/mobile/home']);
  }

  /**
   * Força redirecionamento para interface web
   */
  forceRedirectToWeb(): void {
    console.log('🔧 Forçando redirecionamento para WEB');
    this.router.navigate(['/tabs/home']);
  }


}
