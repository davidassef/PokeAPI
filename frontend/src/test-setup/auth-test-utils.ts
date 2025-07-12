import { of, throwError } from 'rxjs';
import { User } from '../app/models/user.model';
import { UserRole } from '../app/models/user-role.enum';

// Tipos para testes (quando jasmine não está disponível)
declare const jasmine: any;
declare const spyOn: any;
declare const expect: any;

/**
 * Utilitários para testes de autenticação
 */

export class AuthTestUtils {
  /**
   * Cria um usuário mock para testes
   */
  static createMockUser(overrides: Partial<User> = {}): User {
    return {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.VISITOR,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      ...overrides
    };
  }

  /**
   * Cria uma resposta de autenticação mock
   */
  static createMockAuthResponse(user?: User) {
    return {
      access_token: 'mock-jwt-token-' + Date.now(),
      token_type: 'bearer',
      expires_in: 3600,
      user: user || this.createMockUser(),
      refresh_token: 'mock-refresh-token-' + Date.now()
    };
  }

  /**
   * Cria um mock do AuthService
   */
  static createMockAuthService() {
    const mockUser = this.createMockUser();
    const mockAuthResponse = this.createMockAuthResponse(mockUser);

    return {
      // Observables
      currentUser$: of(null),
      isAuthenticated$: of(false),

      // Métodos de autenticação
      login: jasmine.createSpy('login').and.returnValue(of(mockAuthResponse)),
      register: jasmine.createSpy('register').and.returnValue(of(mockAuthResponse)),
      logout: jasmine.createSpy('logout').and.returnValue(of(true)),

      // Métodos de recuperação de senha
      getSecurityQuestion: jasmine.createSpy('getSecurityQuestion').and.returnValue(
        of({ question: 'What is your favorite color?' })
      ),
      verifySecurityAnswer: jasmine.createSpy('verifySecurityAnswer').and.returnValue(of(true)),
      resetPassword: jasmine.createSpy('resetPassword').and.returnValue(of({ success: true })),

      // Métodos de estado
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(null),
      getToken: jasmine.createSpy('getToken').and.returnValue(null),

      // Métodos de token
      refreshToken: jasmine.createSpy('refreshToken').and.returnValue(of(mockAuthResponse)),

      // Métodos utilitários
      findUserByEmail: jasmine.createSpy('findUserByEmail').and.returnValue(of(mockUser))
    };
  }

  /**
   * Configura o localStorage para testes
   */
  static setupLocalStorage() {
    let store: { [key: string]: string } = {};

    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      return store[key] || null;
    });

    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      store[key] = value;
    });

    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete store[key];
    });

    spyOn(localStorage, 'clear').and.callFake(() => {
      store = {};
    });

    return store;
  }

  /**
   * Simula diferentes tipos de erro de autenticação
   */
  static createAuthError(type: 'network' | 'server' | 'timeout' | 'unauthorized' | 'validation') {
    switch (type) {
      case 'network':
        return throwError({
          status: 0,
          name: 'HttpErrorResponse',
          message: 'Network error',
          error: new ProgressEvent('error')
        });

      case 'server':
        return throwError({
          status: 500,
          name: 'HttpErrorResponse',
          message: 'Internal server error',
          error: { message: 'Server error' }
        });

      case 'timeout':
        return throwError({
          name: 'TimeoutError',
          message: 'Request timeout'
        });

      case 'unauthorized':
        return throwError({
          status: 401,
          name: 'HttpErrorResponse',
          message: 'Unauthorized',
          error: { message: 'Invalid credentials' }
        });

      case 'validation':
        return throwError({
          status: 400,
          name: 'HttpErrorResponse',
          message: 'Validation error',
          error: {
            message: 'Validation failed',
            errors: {
              email: ['Email is required'],
              password: ['Password must be at least 8 characters']
            }
          }
        });

      default:
        return throwError('Unknown error');
    }
  }

  /**
   * Cria dados de formulário válidos para testes
   */
  static createValidFormData() {
    return {
      login: {
        email: 'test@example.com',
        password: 'password123'
      },
      register: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'Blue'
      },
      resetPassword: {
        email: 'test@example.com',
        securityAnswer: 'Blue',
        newPassword: 'newpassword123',
        confirmNewPassword: 'newpassword123'
      }
    };
  }

  /**
   * Cria dados de formulário inválidos para testes
   */
  static createInvalidFormData() {
    return {
      login: {
        emptyEmail: { email: '', password: 'password123' },
        emptyPassword: { email: 'test@example.com', password: '' },
        invalidEmail: { email: 'invalid-email', password: 'password123' },
        shortPassword: { email: 'test@example.com', password: '123' }
      },
      register: {
        emptyName: { name: '', email: 'test@example.com', password: 'password123' },
        emptyEmail: { name: 'Test User', email: '', password: 'password123' },
        invalidEmail: { name: 'Test User', email: 'invalid', password: 'password123' },
        shortPassword: { name: 'Test User', email: 'test@example.com', password: '123' },
        passwordMismatch: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'different123'
        }
      }
    };
  }

  /**
   * Simula delay para testes assíncronos
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verifica se um JWT token é válido (formato básico)
   */
  static isValidJWTFormat(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * Decodifica um JWT token mock para testes
   */
  static decodeMockJWT(token: string) {
    if (!this.isValidJWTFormat(token)) {
      throw new Error('Invalid JWT format');
    }

    // Mock payload para testes
    return {
      sub: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'visitor',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
  }

  /**
   * Cria um token JWT expirado para testes
   */
  static createExpiredToken(): string {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.expired';
  }

  /**
   * Cria um token JWT válido para testes
   */
  static createValidToken(): string {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOiR7ZnV0dXJlRXhwfX0.valid`;
  }

  /**
   * Limpa todos os mocks e spies
   */
  static cleanup() {
    localStorage.clear();
    jasmine.clock().uninstall();
  }

  /**
   * Configura interceptadores HTTP para testes
   */
  static setupHttpInterceptors() {
    return {
      intercept: jasmine.createSpy('intercept').and.callFake((req: any, next: any) => {
        // Simular adição de token de autorização
        if (req.url.includes('/api/')) {
          const authReq = req.clone({
            setHeaders: {
              Authorization: 'Bearer mock-token'
            }
          });
          return next.handle(authReq);
        }
        return next.handle(req);
      })
    };
  }

  /**
   * Verifica se os elementos de acessibilidade estão presentes
   */
  static checkAccessibility(fixture: any) {
    const compiled = fixture.nativeElement;

    // Verificar ARIA labels
    const inputs = compiled.querySelectorAll('input');
    inputs.forEach((input: HTMLInputElement) => {
      expect(input.getAttribute('aria-label') || input.getAttribute('aria-labelledby')).toBeTruthy();
    });

    // Verificar roles
    const modal = compiled.querySelector('[role="dialog"]');
    if (modal) {
      expect(modal.getAttribute('aria-labelledby')).toBeTruthy();
    }

    // Verificar elementos de erro com role="alert"
    const errorElements = compiled.querySelectorAll('.error-message');
    errorElements.forEach((element: HTMLElement) => {
      expect(element.getAttribute('role')).toBe('alert');
    });
  }
}

/**
 * Classe para testes de performance de autenticação
 */
export class AuthPerformanceTestUtils {
  private static startTime: number;

  static startTimer() {
    this.startTime = performance.now();
  }

  static endTimer(): number {
    return performance.now() - this.startTime;
  }

  static expectFastResponse(maxMs: number = 1000) {
    const duration = this.endTimer();
    expect(duration).toBeLessThan(maxMs);
  }

  static measureAuthFlow(authService: any, credentials: any): Promise<number> {
    return new Promise((resolve) => {
      this.startTimer();
      authService.login(credentials.email, credentials.password).subscribe({
        next: () => resolve(this.endTimer()),
        error: () => resolve(this.endTimer())
      });
    });
  }
}

/**
 * Constantes para testes
 */
export const AUTH_TEST_CONSTANTS = {
  VALID_EMAIL: 'test@example.com',
  INVALID_EMAIL: 'invalid-email',
  VALID_PASSWORD: 'password123',
  WEAK_PASSWORD: '123',
  SECURITY_QUESTION: 'What is your favorite color?',
  SECURITY_ANSWER: 'Blue',

  TIMEOUTS: {
    SHORT: 1000,
    MEDIUM: 5000,
    LONG: 10000
  },

  ERROR_MESSAGES: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email',
    WEAK_PASSWORD: 'Password must be at least 8 characters',
    PASSWORD_MISMATCH: 'Passwords do not match',
    LOGIN_FAILED: 'Invalid email or password',
    NETWORK_ERROR: 'Network error occurred',
    SERVER_ERROR: 'Server error occurred'
  }
};
