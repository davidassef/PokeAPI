import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { NoAuthGuard } from './no-auth.guard';
import { AuthService } from '../services/auth.service';

describe('NoAuthGuard', () => {
  let guard: NoAuthGuard;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        NoAuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(NoAuthGuard);
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Mock route and state
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = {
      url: '/login'
    } as RouterStateSnapshot;
  });

  describe('canActivate', () => {
    it('should allow access when user is not authenticated', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBeTrue();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should deny access and redirect when user is authenticated', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/home']);
    });

    it('should redirect to home for different auth-only routes', () => {
      const authOnlyRoutes = ['/login', '/register', '/forgot-password'];

      authOnlyRoutes.forEach(url => {
        mockState.url = url;
        mockAuthService.isAuthenticated.and.returnValue(true);

        const result = guard.canActivate(mockRoute, mockState);

        expect(result).toBeFalse();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/home']);
      });
    });

    it('should handle empty URL gracefully', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockState.url = '';

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/home']);
    });
  });

  describe('Error Handling', () => {
    it('should handle AuthService errors gracefully', () => {
      mockAuthService.isAuthenticated.and.throwError('Service error');

      expect(() => guard.canActivate(mockRoute, mockState)).not.toThrow();
    });

    it('should default to allow access on service errors', () => {
      mockAuthService.isAuthenticated.and.throwError('Service error');

      const result = guard.canActivate(mockRoute, mockState);

      expect(result).toBeTrue();
    });

    it('should not redirect on service errors', () => {
      mockAuthService.isAuthenticated.and.throwError('Service error');

      guard.canActivate(mockRoute, mockState);

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('should log authentication check for non-authenticated user', () => {
      spyOn(console, 'log');
      mockAuthService.isAuthenticated.and.returnValue(false);

      guard.canActivate(mockRoute, mockState);

      expect(console.log).toHaveBeenCalledWith('[NoAuthGuard] Verificando se usuário não está autenticado para rota:', '/login');
      expect(console.log).toHaveBeenCalledWith('[NoAuthGuard] Usuário não autenticado, permitindo acesso');
    });

    it('should log redirect when user is authenticated', () => {
      spyOn(console, 'log');
      mockAuthService.isAuthenticated.and.returnValue(true);

      guard.canActivate(mockRoute, mockState);

      expect(console.log).toHaveBeenCalledWith('[NoAuthGuard] Usuário já autenticado, redirecionando para home');
    });
  });

  describe('Integration with Router', () => {
    it('should work with different auth-only route configurations', () => {
      const authOnlyRoutes = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/verify-email'
      ];

      authOnlyRoutes.forEach(url => {
        mockState.url = url;
        mockAuthService.isAuthenticated.and.returnValue(true);

        guard.canActivate(mockRoute, mockState);

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/home']);
      });
    });

    it('should handle query parameters in auth routes', () => {
      mockState.url = '/login?returnUrl=/dashboard';
      mockAuthService.isAuthenticated.and.returnValue(true);

      guard.canActivate(mockRoute, mockState);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/home']);
    });

    it('should handle fragments in auth routes', () => {
      mockState.url = '/register#step2';
      mockAuthService.isAuthenticated.and.returnValue(true);

      guard.canActivate(mockRoute, mockState);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/home']);
    });
  });

  describe('Performance', () => {
    it('should not make unnecessary service calls', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);

      guard.canActivate(mockRoute, mockState);
      guard.canActivate(mockRoute, mockState);
      guard.canActivate(mockRoute, mockState);

      expect(mockAuthService.isAuthenticated).toHaveBeenCalledTimes(3);
    });

    it('should execute quickly for non-authenticated users', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);

      const startTime = performance.now();
      guard.canActivate(mockRoute, mockState);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10); // Should complete in less than 10ms
    });
  });

  describe('Security', () => {
    it('should prevent authenticated users from accessing auth pages', () => {
      const sensitiveAuthRoutes = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password'
      ];

      sensitiveAuthRoutes.forEach(url => {
        mockState.url = url;
        mockAuthService.isAuthenticated.and.returnValue(true);

        const result = guard.canActivate(mockRoute, mockState);

        expect(result).toBeFalse();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/home']);
      });
    });

    it('should not expose sensitive route information in logs', () => {
      spyOn(console, 'log');
      mockState.url = '/reset-password?token=sensitive-token-123';
      mockAuthService.isAuthenticated.and.returnValue(true);

      guard.canActivate(mockRoute, mockState);

      // Verify that sensitive data is not exposed in logs
      const logCalls = (console.log as jasmine.Spy).calls.all();
      logCalls.forEach(call => {
        expect(call.args.join(' ')).not.toContain('sensitive-token-123');
      });
    });

    it('should handle malicious URLs safely', () => {
      const maliciousUrls = [
        '/login/../../../etc/passwd',
        '/register?redirect=javascript:alert(1)',
        '/forgot-password#<script>alert(1)</script>'
      ];

      maliciousUrls.forEach(url => {
        mockState.url = url;
        mockAuthService.isAuthenticated.and.returnValue(true);

        expect(() => guard.canActivate(mockRoute, mockState)).not.toThrow();
      });
    });
  });

  describe('User Experience', () => {
    it('should provide consistent behavior across auth routes', () => {
      const authRoutes = ['/login', '/register', '/forgot-password'];
      
      authRoutes.forEach(route => {
        mockState.url = route;
        mockAuthService.isAuthenticated.and.returnValue(true);

        const result = guard.canActivate(mockRoute, mockState);

        expect(result).toBeFalse();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/tabs/home']);
      });
    });

    it('should allow access to auth routes for non-authenticated users', () => {
      const authRoutes = ['/login', '/register', '/forgot-password'];
      
      authRoutes.forEach(route => {
        mockState.url = route;
        mockAuthService.isAuthenticated.and.returnValue(false);

        const result = guard.canActivate(mockRoute, mockState);

        expect(result).toBeTrue();
        expect(mockRouter.navigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined route state', () => {
      mockState = undefined as any;
      mockAuthService.isAuthenticated.and.returnValue(false);

      expect(() => guard.canActivate(mockRoute, mockState)).not.toThrow();
    });

    it('should handle null route', () => {
      mockRoute = null as any;
      mockAuthService.isAuthenticated.and.returnValue(false);

      expect(() => guard.canActivate(mockRoute, mockState)).not.toThrow();
    });

    it('should handle concurrent guard checks', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);

      const results = Promise.all([
        Promise.resolve(guard.canActivate(mockRoute, mockState)),
        Promise.resolve(guard.canActivate(mockRoute, mockState)),
        Promise.resolve(guard.canActivate(mockRoute, mockState))
      ]);

      results.then(values => {
        expect(values).toEqual([true, true, true]);
      });
    });
  });
});
