import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { DeviceDetectionService } from '../services/device-detection.service';

@Injectable({
  providedIn: 'root'
})
export class DeviceRedirectGuard implements CanActivate {

  constructor(
    private deviceDetectionService: DeviceDetectionService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentUrl = state.url;
    const shouldUseMobile = this.deviceDetectionService.shouldUseMobileInterface();

    console.log('🛡️ DeviceRedirectGuard - canActivate:', {
      currentUrl,
      shouldUseMobile,
      routeData: route.data,
      params: route.params
    });

    // Verificar se estamos em uma rota web e deveríamos estar em mobile
    if (currentUrl.startsWith('/tabs/') && shouldUseMobile) {
      // Mapear rotas web para mobile
      const mobileRoute = this.mapWebToMobileRoute(currentUrl);
      if (mobileRoute) {
        console.log('🔄 Redirecionando WEB → MOBILE:', currentUrl, '→', mobileRoute);
        this.router.navigate([mobileRoute]);
        return false;
      }
    }

    // Verificar se estamos em uma rota mobile e deveríamos estar em web
    if (currentUrl.startsWith('/mobile/') && !shouldUseMobile) {
      // Mapear rotas mobile para web
      const webRoute = this.mapMobileToWebRoute(currentUrl);
      if (webRoute) {
        console.log('🔄 Redirecionando MOBILE → WEB:', currentUrl, '→', webRoute);
        this.router.navigate([webRoute]);
        return false;
      }
    }

    console.log('✅ DeviceRedirectGuard - Permitindo acesso:', currentUrl);
    return true;
  }

  /**
   * Mapeia rotas web para mobile
   */
  private mapWebToMobileRoute(webUrl: string): string | null {
    const routeMap: { [key: string]: string } = {
      '/tabs/home': '/mobile/home',
      '/tabs/captured': '/mobile/captured',
      '/tabs/ranking': '/mobile/ranking',
      '/tabs/settings': '/mobile/settings'
    };

    // Verificar mapeamento exato
    if (routeMap[webUrl]) {
      return routeMap[webUrl];
    }

    // Verificar mapeamento por prefixo
    for (const webRoute in routeMap) {
      if (webUrl.startsWith(webRoute)) {
        return routeMap[webRoute];
      }
    }

    return null;
  }

  /**
   * Mapeia rotas mobile para web
   */
  private mapMobileToWebRoute(mobileUrl: string): string | null {
    const routeMap: { [key: string]: string } = {
      '/mobile/home': '/tabs/home',
      '/mobile/captured': '/tabs/captured',
      '/mobile/ranking': '/tabs/ranking',
      '/mobile/settings': '/tabs/settings'
    };

    // Verificar mapeamento exato
    if (routeMap[mobileUrl]) {
      return routeMap[mobileUrl];
    }

    // Verificar mapeamento por prefixo
    for (const mobileRoute in routeMap) {
      if (mobileUrl.startsWith(mobileRoute)) {
        return routeMap[mobileRoute];
      }
    }

    return null;
  }
}
