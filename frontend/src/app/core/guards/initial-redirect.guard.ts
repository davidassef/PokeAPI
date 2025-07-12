import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { DeviceDetectionService } from '../services/device-detection.service';

@Injectable({
  providedIn: 'root'
})
export class InitialRedirectGuard implements CanActivate {

  constructor(
    private deviceDetectionService: DeviceDetectionService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const shouldUseMobile = this.deviceDetectionService.shouldUseMobileInterface();
    const deviceInfo = this.deviceDetectionService.getCurrentDeviceInfo();
    const currentUrl = this.router.url;

    console.log('🚀 InitialRedirectGuard - Redirecionamento inicial:', {
      shouldUseMobile,
      currentUrl,
      deviceInfo: {
        type: deviceInfo.type,
        isMobile: deviceInfo.isMobile,
        screenWidth: deviceInfo.screenWidth,
        userAgent: deviceInfo.userAgent.substring(0, 50) + '...'
      },
      timestamp: new Date().toISOString()
    });

    if (shouldUseMobile) {
      console.log('📱 Redirecionando para interface MOBILE: /mobile/home');
      this.router.navigate(['/mobile/home']);
      return false;
    } else {
      console.log('🖥️ Redirecionando para interface WEB: /tabs/home');
      this.router.navigate(['/tabs/home']);
      return false;
    }
  }
}
