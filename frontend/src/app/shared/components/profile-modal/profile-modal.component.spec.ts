import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { ProfileModalComponent } from './profile-modal.component';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../models/user.model';

describe('ProfileModalComponent', () => {
  let component: ProfileModalComponent;
  let fixture: ComponentFixture<ProfileModalComponent>;
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
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'updateProfile']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get']);

    await TestBed.configureTestingModule({
      declarations: [ProfileModalComponent],
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

    fixture = TestBed.createComponent(ProfileModalComponent);
    component = fixture.componentInstance;
    mockModalController = TestBed.inject(ModalController) as jasmine.SpyObj<ModalController>;
    mockToastController = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockTranslateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;

    // Setup default mocks
    mockAuthService.getCurrentUser.and.returnValue(mockUser);
    mockTranslateService.get.and.returnValue(of('Translated text'));
    mockToastController.create.and.returnValue(Promise.resolve({
      present: jasmine.createSpy('present')
    } as any));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with current user data', () => {
    component.ngOnInit();

    expect(component.firstName).toBe('Test');
    expect(component.lastName).toBe('User');
    expect(component.email).toBe('test@example.com');
    expect(component.contact).toBe('123456789');
    expect(component.securityQuestion).toBe('Test Question');
    expect(component.securityAnswer).toBe('Test Answer');
  });

  it('should handle user with single name', () => {
    const singleNameUser = { ...mockUser, name: 'SingleName' };
    mockAuthService.getCurrentUser.and.returnValue(singleNameUser);

    component.ngOnInit();

    expect(component.firstName).toBe('SingleName');
    expect(component.lastName).toBe('');
  });

  it('should validate required fields', () => {
    component.firstName = '';
    component.email = '';

    const isValid = component.validateForm();

    expect(isValid).toBeFalse();
    expect(component.error).toContain('required');
  });

  it('should validate email format', () => {
    component.firstName = 'Test';
    component.email = 'invalid-email';

    const isValid = component.validateForm();

    expect(isValid).toBeFalse();
    expect(component.error).toContain('email');
  });

  it('should validate form successfully with valid data', () => {
    component.firstName = 'Test';
    component.lastName = 'User';
    component.email = 'test@example.com';
    component.contact = '123456789';
    component.securityQuestion = 'Question';
    component.securityAnswer = 'Answer';

    const isValid = component.validateForm();

    expect(isValid).toBeTrue();
    expect(component.error).toBe('');
  });

  it('should save profile successfully', async () => {
    component.firstName = 'Updated';
    component.lastName = 'User';
    component.email = 'updated@example.com';
    component.contact = '987654321';
    component.securityQuestion = 'Updated Question';
    component.securityAnswer = 'Updated Answer';

    mockAuthService.updateProfile.and.returnValue(of({ success: true }));

    await component.saveProfile();

    expect(mockAuthService.updateProfile).toHaveBeenCalledWith({
      name: 'Updated User',
      email: 'updated@example.com',
      contact: '987654321',
      security_question: 'Updated Question',
      security_answer: 'Updated Answer'
    });
    expect(component.loading).toBeFalse();
    expect(mockModalController.dismiss).toHaveBeenCalledWith({ success: true });
  });

  it('should handle profile save error', async () => {
    component.firstName = 'Test';
    component.email = 'test@example.com';

    mockAuthService.updateProfile.and.returnValue(throwError('Update failed'));

    await component.saveProfile();

    expect(component.loading).toBeFalse();
    expect(component.error).toContain('update_failed');
  });

  it('should close modal', () => {
    component.close();
    expect(mockModalController.dismiss).toHaveBeenCalledWith({ success: false });
  });

  it('should show error message', () => {
    component.showError('test.error');

    expect(mockTranslateService.get).toHaveBeenCalledWith('test.error');
    expect(component.error).toBe('Translated text');
  });

  it('should show success message', () => {
    component.showSuccess('test.success');

    expect(mockTranslateService.get).toHaveBeenCalledWith('test.success');
    expect(component.success).toBe('Translated text');
  });

  it('should clear form', () => {
    component.firstName = 'Test';
    component.error = 'Error';
    component.success = 'Success';
    component.loading = true;

    component.clearForm();

    expect(component.firstName).toBe('');
    expect(component.error).toBe('');
    expect(component.success).toBe('');
    expect(component.loading).toBeFalse();
  });

  describe('Theme Integration', () => {
    it('should apply theme classes correctly', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const modalContainer = compiled.querySelector('.modal-container');

      expect(modalContainer).toBeTruthy();
    });

    it('should handle theme switching', () => {
      // Simulate light theme
      document.body.classList.add('light-theme');
      fixture.detectChanges();

      // Simulate dark theme
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      fixture.detectChanges();

      // Component should still function correctly
      expect(component).toBeTruthy();
    });
  });

  describe('Internationalization', () => {
    it('should handle translation updates', () => {
      mockTranslateService.get.and.returnValue(of('Updated translation'));

      component.showError('test.error');

      expect(component.error).toBe('Updated translation');
    });
  });
});
