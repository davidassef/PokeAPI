import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController, ToastController, AlertController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-user-profile-modal',
  templateUrl: './user-profile-modal.component.html',
  styleUrls: ['./user-profile-modal.component.scss']
})
export class UserProfileModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  profileForm: FormGroup;
  user: User | null = null;
  isLoading = false;
  showPasswordConfirmation = false;
  passwordConfirmationForm: FormGroup;

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private authService: AuthService
  ) {
    this.profileForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      security_question: ['', [Validators.required]]
    });

    this.passwordConfirmationForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserData() {
    this.user = this.authService.getCurrentUser();
    if (this.user) {
      this.profileForm.patchValue({
        name: this.user.name,
        email: this.user.email,
        security_question: this.user.security_question || ''
      });
    }
  }

  async onSaveChanges() {
    if (this.profileForm.valid) {
      this.showPasswordConfirmation = true;
    } else {
      await this.showValidationErrors();
    }
  }

  async confirmSaveChanges() {
    if (this.passwordConfirmationForm.valid) {
      this.isLoading = true;

      try {
        const formData = {
          ...this.profileForm.value,
          currentPassword: this.passwordConfirmationForm.value.currentPassword
        };

        // TODO: Implementar chamada para API de atualização de perfil
        console.log('Dados para atualização:', formData);

        // Simular delay da API
        await new Promise(resolve => setTimeout(resolve, 1000));

        await this.showSuccessToast();
        this.showPasswordConfirmation = false;
        this.passwordConfirmationForm.reset();
        await this.closeModal();

      } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        await this.showErrorToast();
      } finally {
        this.isLoading = false;
      }
    }
  }

  cancelPasswordConfirmation() {
    this.showPasswordConfirmation = false;
    this.passwordConfirmationForm.reset();
  }

  async closeModal() {
    await this.modalController.dismiss();
  }

  private async showValidationErrors() {
    const toast = await this.toastController.create({
      message: this.translate.instant('auth.validation_errors'),
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }

  private async showSuccessToast() {
    const toast = await this.toastController.create({
      message: this.translate.instant('auth.profile_updated'),
      duration: 3000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  private async showErrorToast() {
    const toast = await this.toastController.create({
      message: this.translate.instant('auth.update_error'),
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }

  // Getters para facilitar acesso aos controles do formulário
  get nameControl() { return this.profileForm.get('name'); }
  get emailControl() { return this.profileForm.get('email'); }
  get securityQuestionControl() { return this.profileForm.get('security_question'); }
  get currentPasswordControl() { return this.passwordConfirmationForm.get('currentPassword'); }

  // Métodos de validação
  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return this.translate.instant('auth.field_required');
      }
      if (field.errors['email']) {
        return this.translate.instant('auth.invalid_email');
      }
      if (field.errors['minlength']) {
        return this.translate.instant('auth.min_length_error');
      }
    }
    return '';
  }
}