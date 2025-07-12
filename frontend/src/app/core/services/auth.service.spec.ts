import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { User } from '../../models/user.model';
import { UserRole } from '../../models/user-role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.VISITOR,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockAuthResponse = {
    access_token: 'mock-jwt-token',
    token_type: 'bearer',
    expires_in: 3600,
    user: mockUser
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Authentication Flow', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should login successfully', () => {
      const email = 'test@example.com';
      const password = 'password123';

      service.login(email, password).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(service.isAuthenticated()).toBeTrue();
        expect(service.getCurrentUser()).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email, password });
      req.flush(mockAuthResponse);
    });

    it('should handle login error', () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      service.login(email, password).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(service.isAuthenticated()).toBeFalse();
        }
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/auth/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should register successfully', () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        security_question: 'Test Question',
        security_answer: 'Test Answer'
      };

      service.register(userData).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(service.isAuthenticated()).toBeTrue();
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(userData);
      req.flush(mockAuthResponse);
    });

    it('should handle registration error', () => {
      const userData = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123',
        security_question: 'Test Question',
        security_answer: 'Test Answer'
      };

      service.register(userData).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(service.isAuthenticated()).toBeFalse();
        }
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/auth/register`);
      req.flush({ message: 'Email already exists' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should logout successfully', () => {
      // Set up authenticated state
      localStorage.setItem(service['TOKEN_KEY'], 'mock-token');
      service['currentUserSubject'].next(mockUser);

      service.logout();

      expect(service.isAuthenticated()).toBeFalse();
      expect(service.getCurrentUser()).toBeNull();
      expect(localStorage.getItem(service['TOKEN_KEY'])).toBeNull();
    });
  });

  describe('Password Reset Flow', () => {
    it('should get security question', () => {
      const email = 'test@example.com';
      const mockResponse = { question: 'What is your favorite color?' };

      service.getSecurityQuestion(email).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/auth/security-question?email=${email}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should reset password', () => {
      const resetData = {
        email: 'test@example.com',
        securityAnswer: 'Blue',
        newPassword: 'newpassword123'
      };

      service.resetPassword(resetData).subscribe(response => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/auth/reset-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(resetData);
      req.flush({ success: true });
    });
  });

  describe('Token Management', () => {
    it('should store token in localStorage', () => {
      const token = 'mock-jwt-token';
      service['storeToken'](token);

      expect(localStorage.getItem(service['TOKEN_KEY'])).toBe(token);
    });

    it('should retrieve token from localStorage', () => {
      const token = 'mock-jwt-token';
      localStorage.setItem(service['TOKEN_KEY'], token);

      expect(service.getToken()).toBe(token);
    });

    it('should check if token is expired', () => {
      // Mock expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      
      expect(service['isTokenExpired'](expiredToken)).toBeTrue();
    });

    it('should refresh token automatically', () => {
      const newToken = 'new-jwt-token';
      
      service.refreshToken().subscribe(response => {
        expect(response.access_token).toBe(newToken);
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      req.flush({ access_token: newToken, token_type: 'bearer', expires_in: 3600 });
    });
  });

  describe('User State Management', () => {
    it('should emit user state changes', () => {
      let currentUser: User | null = null;
      
      service.currentUser$.subscribe(user => {
        currentUser = user;
      });

      service['currentUserSubject'].next(mockUser);
      expect(currentUser).toEqual(mockUser);

      service['currentUserSubject'].next(null);
      expect(currentUser).toBeNull();
    });

    it('should check authentication status', () => {
      expect(service.isAuthenticated()).toBeFalse();

      localStorage.setItem(service['TOKEN_KEY'], 'valid-token');
      service['currentUserSubject'].next(mockUser);

      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should get current user', () => {
      expect(service.getCurrentUser()).toBeNull();

      service['currentUserSubject'].next(mockUser);
      expect(service.getCurrentUser()).toEqual(mockUser);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', () => {
      service.login('test@example.com', 'password').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.name).toBe('HttpErrorResponse');
        }
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/auth/login`);
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle timeout errors', () => {
      service.login('test@example.com', 'password').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.name).toBe('TimeoutError');
        }
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/auth/login`);
      // Simulate timeout
      req.error(new ErrorEvent('timeout'));
    });

    it('should retry failed requests', () => {
      let attempts = 0;
      
      service.login('test@example.com', 'password').subscribe({
        next: (response) => {
          expect(response).toEqual(mockAuthResponse);
          expect(attempts).toBe(2); // Should retry once
        }
      });

      // First request fails
      const req1 = httpMock.expectOne(`${service['apiUrl']}/auth/login`);
      attempts++;
      req1.error(new ErrorEvent('Network error'));

      // Second request succeeds
      const req2 = httpMock.expectOne(`${service['apiUrl']}/auth/login`);
      attempts++;
      req2.flush(mockAuthResponse);
    });
  });

  describe('Security', () => {
    it('should clear sensitive data on logout', () => {
      // Set up authenticated state with sensitive data
      localStorage.setItem(service['TOKEN_KEY'], 'sensitive-token');
      localStorage.setItem(service['REFRESH_TOKEN_KEY'], 'sensitive-refresh-token');
      service['currentUserSubject'].next(mockUser);

      service.logout();

      expect(localStorage.getItem(service['TOKEN_KEY'])).toBeNull();
      expect(localStorage.getItem(service['REFRESH_TOKEN_KEY'])).toBeNull();
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should validate JWT token format', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const invalidToken = 'invalid-token';

      expect(service['isValidJWT'](validToken)).toBeTrue();
      expect(service['isValidJWT'](invalidToken)).toBeFalse();
    });

    it('should handle malformed tokens gracefully', () => {
      const malformedToken = 'malformed.token.here';
      localStorage.setItem(service['TOKEN_KEY'], malformedToken);

      expect(service.isAuthenticated()).toBeFalse();
      expect(localStorage.getItem(service['TOKEN_KEY'])).toBeNull();
    });
  });
});
