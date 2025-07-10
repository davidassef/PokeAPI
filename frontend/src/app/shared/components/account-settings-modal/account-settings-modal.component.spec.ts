import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, ModalController, ToastController, AlertController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { AccountSettingsModalComponent } from './account-settings-modal.component';
import { AuthService } from '../../../core/services/auth.service';

describe('AccountSettingsModalComponent', () => {
  let component: AccountSettingsModalComponent;
  let fixture: ComponentFixture<AccountSettingsModalComponent>;
  let mockModalController: jasmine.SpyObj<ModalController>;
  let mockToastController: jasmine.SpyObj<ToastController>;
  let mockAlertController: jasmine.SpyObj<AlertController>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  beforeEach(async () => {
    const modalControllerSpy = jasmine.createSpyObj('ModalController', ['dismiss']);
    const toastControllerSpy = jasmine.createSpyObj('ToastController', ['create']);
    const alertControllerSpy = jasmine.createSpyObj('AlertController', ['create']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['changePassword', 'deleteAccount', 'logout']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get']);

    await TestBed.configureTestingModule({
      declarations: [AccountSettingsModalComponent],
      imports: [
        IonicModule.forRoot(),
        TranslateModule.forRoot(),
        FormsModule
      ],
      providers: [
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: ToastController, useValue: toastControllerSpy },
        { provide: AlertController, useValue: alertControllerSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AccountSettingsModalComponent);
    component = fixture.componentInstance;
    mockModalController = TestBed.inject(ModalController) as jasmine.SpyObj<ModalController>;
    mockToastController = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    mockAlertController = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;
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

  it('should initialize with main view', () => {
    expect(component.currentView).toBe('main');
  });

  it('should navigate to change password view', () => {
    component.showChangePassword();
    expect(component.currentView).toBe('change-password');
  });

  it('should navigate to delete account view', () => {
    component.showDeleteAccount();
    expect(component.currentView).toBe('delete-account');
  });

  it('should navigate back to main view', () => {
    component.currentView = 'change-password';
    component.backToMain();
    expect(component.currentView).toBe('main');
  });

  it('should toggle password visibility', () => {
    expect(component.showCurrentPassword).toBeFalse();
    component.toggleCurrentPassword();
    expect(component.showCurrentPassword).toBeTrue();
  });

  it('should validate password form - missing fields', () => {
    component.currentPassword = '';
    component.newPassword = '';
    component.confirmNewPassword = '';

    const isValid = component.validatePasswordForm();

    expect(isValid).toBeFalse();
  });

  it('should validate password form - password too short', () => {
    component.currentPassword = 'current';
    component.newPassword = '123';
    component.confirmNewPassword = '123';

    const isValid = component.validatePasswordForm();

    expect(isValid).toBeFalse();
  });

  it('should validate password form - password mismatch', () => {
    component.currentPassword = 'current';
    component.newPassword = 'newpassword';
    component.confirmNewPassword = 'different';

    const isValid = component.validatePasswordForm();

    expect(isValid).toBeFalse();
  });

  it('should validate password form - success', () => {
    component.currentPassword = 'current';
    component.newPassword = 'newpassword';
    component.confirmNewPassword = 'newpassword';

    const isValid = component.validatePasswordForm();

    expect(isValid).toBeTrue();
  });

  it('should change password successfully', async () => {
    component.currentPassword = 'current';
    component.newPassword = 'newpassword';
    component.confirmNewPassword = 'newpassword';

    mockAuthService.changePassword.and.returnValue(of({ success: true }));

    await component.changePassword();

    expect(mockAuthService.changePassword).toHaveBeenCalledWith({
      currentPassword: 'current',
      newPassword: 'newpassword'
    });
    expect(component.loading).toBeFalse();
  });

  it('should handle password change error', async () => {
    component.currentPassword = 'current';
    component.newPassword = 'newpassword';
    component.confirmNewPassword = 'newpassword';

    mockAuthService.changePassword.and.returnValue(throwError('Change failed'));

    await component.changePassword();

    expect(component.loading).toBeFalse();
    expect(component.error).toContain('password_change_failed');
  });

  it('should validate delete form - missing fields', () => {
    component.securityAnswer = '';
    component.deleteConfirmPassword = '';

    const isValid = component.validateDeleteForm();

    expect(isValid).toBeFalse();
  });

  it('should validate delete form - success', () => {
    component.securityAnswer = 'answer';
    component.deleteConfirmPassword = 'password';

    const isValid = component.validateDeleteForm();

    expect(isValid).toBeTrue();
  });

  it('should show delete confirmation alert', async () => {
    const mockAlert = {
      present: jasmine.createSpy('present')
    };
    mockAlertController.create.and.returnValue(Promise.resolve(mockAlert as any));

    await component.confirmDeleteAccount();

    expect(mockAlertController.create).toHaveBeenCalled();
    expect(mockAlert.present).toHaveBeenCalled();
  });

  it('should delete account successfully', async () => {
    component.securityAnswer = 'answer';
    component.deleteConfirmPassword = 'password';

    mockAuthService.deleteAccount.and.returnValue(of({ success: true }));

    await component.deleteAccount();

    expect(mockAuthService.deleteAccount).toHaveBeenCalledWith({
      securityAnswer: 'answer',
      password: 'password'
    });
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should handle delete account error', async () => {
    component.securityAnswer = 'answer';
    component.deleteConfirmPassword = 'password';

    mockAuthService.deleteAccount.and.returnValue(throwError('Delete failed'));

    await component.deleteAccount();

    expect(component.loading).toBeFalse();
    expect(component.error).toContain('delete_account_failed');
  });

  it('should clear form', () => {
    component.currentPassword = 'test';
    component.error = 'error';
    component.loading = true;

    component.clearForm();

    expect(component.currentPassword).toBe('');
    expect(component.error).toBe('');
    expect(component.loading).toBeFalse();
  });

  it('should close modal', () => {
    component.close();
    expect(mockModalController.dismiss).toHaveBeenCalledWith({ success: false });
  });

  it('should close modal with success', () => {
    component.close(true);
    expect(mockModalController.dismiss).toHaveBeenCalledWith({ success: true });
  });
});
