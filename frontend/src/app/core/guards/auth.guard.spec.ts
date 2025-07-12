import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Mock route and state
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = {
      url: '/protected-route'
    } as RouterStateSnapshot;
  });

  describe('canActivate', () => {
    it('should allow access when user is authenticated', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBeTrue();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should deny access and redirect when user is not authenticated', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/protected-route' }
      });
    });

    it('should preserve return URL for redirect after login', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);
      mockState.url = '/admin/dashboard';

      guard.canActivate(mockRoute, mockState);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/admin/dashboard' }
      });
    });

    it('should handle empty URL gracefully', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);
      mockState.url = '';

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '' }
      });
    });

    it('should handle root URL', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);
      mockState.url = '/';

      guard.canActivate(mockRoute, mockState);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/' }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle AuthService errors gracefully', () => {
      mockAuthService.isAuthenticated.and.throwError('Service error');

      expect(() => guard.canActivate(mockRoute, mockState)).not.toThrow();
    });

    it('should default to deny access on service errors', () => {
      mockAuthService.isAuthenticated.and.throwError('Service error');

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBeFalse();
    });
  });

  describe('Logging', () => {
    it('should log authentication check', () => {
      spyOn(console, 'log');
      mockAuthService.isAuthenticated.and.returnValue(true);

      guard.canActivate(mockRoute, mockState);

      expect(console.log).toHaveBeenCalledWith('[AuthGuard] Verificando autenticação para rota:', '/protected-route');
      expect(console.log).toHaveBeenCalledWith('[AuthGuard] Usuário autenticado, permitindo acesso');
    });

    it('should log redirect when not authenticated', () => {
      spyOn(console, 'log');
      mockAuthService.isAuthenticated.and.returnValue(false);

      guard.canActivate(mockRoute, mockState);

      expect(console.log).toHaveBeenCalledWith('[AuthGuard] Usuário não autenticado, redirecionando para login');
    });
  });

  describe('Integration with Router', () => {
    it('should work with different route configurations', () => {
      const routes = [
        '/admin',
        '/profile',
        '/settings',
        '/dashboard/analytics'
      ];

      routes.forEach(url => {
        mockState.url = url;
        mockAuthService.isAuthenticated.and.returnValue(false);

        guard.canActivate(mockRoute, mockState);

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
          queryParams: { returnUrl: url }
        });
      });
    });

    it('should handle query parameters in original URL', () => {
      mockState.url = '/dashboard?tab=analytics&filter=active';
      mockAuthService.isAuthenticated.and.returnValue(false);

      guard.canActivate(mockRoute, mockState);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/dashboard?tab=analytics&filter=active' }
      });
    });

    it('should handle fragments in original URL', () => {
      mockState.url = '/profile#settings';
      mockAuthService.isAuthenticated.and.returnValue(false);

      guard.canActivate(mockRoute, mockState);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/profile#settings' }
      });
    });
  });

  describe('Performance', () => {
    it('should not make unnecessary service calls', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);

      guard.canActivate(mockRoute, mockState);
      guard.canActivate(mockRoute, mockState);
      guard.canActivate(mockRoute, mockState);

      expect(mockAuthService.isAuthenticated).toHaveBeenCalledTimes(3);
    });

    it('should execute quickly for authenticated users', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);

      const startTime = performance.now();
      guard.canActivate(mockRoute, mockState);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10); // Should complete in less than 10ms
    });
  });

  describe('Security', () => {
    it('should not expose sensitive route information in logs', () => {
      spyOn(console, 'log');
      mockState.url = '/admin/users/123/sensitive-data';
      mockAuthService.isAuthenticated.and.returnValue(false);

      guard.canActivate(mockRoute, mockState);

      // Verify that sensitive data is not exposed in logs
      const logCalls = (console.log as jasmine.Spy).calls.all();
      logCalls.forEach(call => {
        expect(call.args.join(' ')).not.toContain('sensitive-data');
      });
    });

    it('should handle malicious URLs safely', () => {
      const maliciousUrls = [
        '/admin/../../../etc/passwd',
        '/profile?redirect=javascript:alert(1)',
        '/dashboard#<script>alert(1)</script>'
      ];

      maliciousUrls.forEach(url => {
        mockState.url = url;
        mockAuthService.isAuthenticated.and.returnValue(false);

        expect(() => guard.canActivate(mockRoute, mockState)).not.toThrow();
      });
    });
  });
});
