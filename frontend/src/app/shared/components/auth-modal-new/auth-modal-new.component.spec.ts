import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { AuthModalNewComponent } from './auth-modal-new.component';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../models/user.model';

describe('AuthModalNewComponent', () => {
  let component: AuthModalNewComponent;
  let fixture: ComponentFixture<AuthModalNewComponent>;
  let mockModalController: jasmine.SpyObj<ModalController>;
  let mockToastController: jasmine.SpyObj<ToastController>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    contact: '123456789',
    security_question: 'Test Question',
    security_answer: 'Test Answer'
  };

  beforeEach(async () => {
    const modalControllerSpy = jasmine.createSpyObj('ModalController', ['dismiss']);
    const toastControllerSpy = jasmine.createSpyObj('ToastController', ['create']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login', 'register', 'resetPassword', 'getSecurityQuestion'
    ]);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get']);

    await TestBed.configureTestingModule({
      declarations: [AuthModalNewComponent],
      imports: [
        IonicModule.forRoot(),
        TranslateModule.forRoot(),
        FormsModule
      ],
      providers: [
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: ToastController, useValue: toastControllerSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthModalNewComponent);
    component = fixture.componentInstance;
    mockModalController = TestBed.inject(ModalController) as jasmine.SpyObj<ModalController>;
    mockToastController = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockTranslateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;

    // Setup default mocks
    mockTranslateService.get.and.returnValue(of('Translated text'));
    mockToastController.create.and.returnValue(Promise.resolve({
      present: jasmine.createSpy('present')
    } as any));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with login view', () => {
    expect(component.currentView).toBe('login');
  });

  it('should switch to register view', () => {
    component.showRegister();
    expect(component.currentView).toBe('register');
  });

  it('should switch to forgot password view', () => {
    component.showForgotPassword();
    expect(component.currentView).toBe('forgot-password');
  });

  it('should switch back to login view', () => {
    component.currentView = 'register';
    component.showLogin();
    expect(component.currentView).toBe('login');
  });

  describe('Login Flow', () => {
    beforeEach(() => {
      component.currentView = 'login';
      component.loginEmail = 'test@example.com';
      component.loginPassword = 'password123';
    });

    it('should validate login form - missing email', () => {
      component.loginEmail = '';
      const isValid = component.validateLoginForm();
      expect(isValid).toBeFalse();
    });

    it('should validate login form - invalid email', () => {
      component.loginEmail = 'invalid-email';
      const isValid = component.validateLoginForm();
      expect(isValid).toBeFalse();
    });

    it('should validate login form - missing password', () => {
      component.loginPassword = '';
      const isValid = component.validateLoginForm();
      expect(isValid).toBeFalse();
    });

    it('should validate login form - success', () => {
      const isValid = component.validateLoginForm();
      expect(isValid).toBeTrue();
    });

    it('should login successfully', async () => {
      mockAuthService.login.and.returnValue(of({ token: 'token', user: mockUser }));

      await component.login();

      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(component.loading).toBeFalse();
      expect(mockModalController.dismiss).toHaveBeenCalledWith({ success: true });
    });

    it('should handle login error', async () => {
      mockAuthService.login.and.returnValue(throwError('Login failed'));

      await component.login();

      expect(component.loading).toBeFalse();
      expect(component.error).toContain('login_failed');
    });
  });

  describe('Registration Flow', () => {
    beforeEach(() => {
      component.currentView = 'register';
      component.registerName = 'Test User';
      component.registerEmail = 'test@example.com';
      component.registerPassword = 'password123';
      component.registerConfirmPassword = 'password123';
      component.securityQuestion = 'Test Question';
      component.securityAnswer = 'Test Answer';
    });

    it('should validate register form - missing fields', () => {
      component.registerName = '';
      const isValid = component.validateRegisterForm();
      expect(isValid).toBeFalse();
    });

    it('should validate register form - password mismatch', () => {
      component.registerConfirmPassword = 'different';
      const isValid = component.validateRegisterForm();
      expect(isValid).toBeFalse();
    });

    it('should validate register form - password too short', () => {
      component.registerPassword = '123';
      component.registerConfirmPassword = '123';
      const isValid = component.validateRegisterForm();
      expect(isValid).toBeFalse();
    });

    it('should validate register form - success', () => {
      const isValid = component.validateRegisterForm();
      expect(isValid).toBeTrue();
    });

    it('should register successfully', async () => {
      mockAuthService.register.and.returnValue(of({ token: 'token', user: mockUser }));

      await component.register();

      expect(mockAuthService.register).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        security_question: 'Test Question',
        security_answer: 'Test Answer'
      });
      expect(component.loading).toBeFalse();
      expect(mockModalController.dismiss).toHaveBeenCalledWith({ success: true });
    });

    it('should handle registration error', async () => {
      mockAuthService.register.and.returnValue(throwError('Registration failed'));

      await component.register();

      expect(component.loading).toBeFalse();
      expect(component.error).toContain('registration_failed');
    });
  });

  describe('Password Reset Flow', () => {
    beforeEach(() => {
      component.currentView = 'forgot-password';
      component.resetEmail = 'test@example.com';
    });

    it('should get security question successfully', async () => {
      mockAuthService.getSecurityQuestion.and.returnValue(of({ question: 'Test Question' }));

      await component.getSecurityQuestion();

      expect(mockAuthService.getSecurityQuestion).toHaveBeenCalledWith('test@example.com');
      expect(component.securityQuestion).toBe('Test Question');
      expect(component.currentView).toBe('security-question');
    });

    it('should handle get security question error', async () => {
      mockAuthService.getSecurityQuestion.and.returnValue(throwError('User not found'));

      await component.getSecurityQuestion();

      expect(component.loading).toBeFalse();
      expect(component.error).toContain('user_not_found');
    });

    it('should reset password successfully', async () => {
      component.currentView = 'reset-password';
      component.newPassword = 'newpassword123';
      component.confirmNewPassword = 'newpassword123';
      component.securityAnswer = 'Test Answer';

      mockAuthService.resetPassword.and.returnValue(of({ success: true }));

      await component.resetPassword();

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        securityAnswer: 'Test Answer',
        newPassword: 'newpassword123'
      });
      expect(component.currentView).toBe('login');
    });

    it('should handle reset password error', async () => {
      component.currentView = 'reset-password';
      component.newPassword = 'newpassword123';
      component.confirmNewPassword = 'newpassword123';
      component.securityAnswer = 'Wrong Answer';

      mockAuthService.resetPassword.and.returnValue(throwError('Incorrect answer'));

      await component.resetPassword();

      expect(component.loading).toBeFalse();
      expect(component.error).toContain('incorrect_answer');
    });
  });

  it('should toggle password visibility', () => {
    expect(component.showLoginPassword).toBeFalse();
    component.toggleLoginPassword();
    expect(component.showLoginPassword).toBeTrue();
  });

  it('should clear form data', () => {
    component.loginEmail = 'test@example.com';
    component.error = 'Error message';
    component.loading = true;

    component.clearForm();

    expect(component.loginEmail).toBe('');
    expect(component.error).toBe('');
    expect(component.loading).toBeFalse();
  });

  it('should close modal', () => {
    component.close();
    expect(mockModalController.dismiss).toHaveBeenCalledWith({ success: false });
  });
});
