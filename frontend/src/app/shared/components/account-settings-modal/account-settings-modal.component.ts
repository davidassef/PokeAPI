import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-account-settings-modal',
  templateUrl: './account-settings-modal.component.html',
  styleUrls: ['./account-settings-modal.component.scss']
})
export class AccountSettingsModalComponent implements OnInit {
  // Current view: 'main' | 'change-password' | 'delete-account'
  currentView = 'main';

  // Change Password form
  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Delete Account form
  securityAnswer = '';
  deleteConfirmPassword = '';
  showDeletePassword = false;
  userSecurityQuestion = '';

  // UI states
  loading = false;
  error = '';
  success = '';

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadUserSecurityQuestion();
  }

  private loadUserSecurityQuestion() {
    const user = this.authService.getCurrentUser();
    if (user?.security_question) {
      const questionKey = `auth.security_question_${user.security_question}`;
      this.translate.get(questionKey).subscribe(translatedText => {
        this.userSecurityQuestion = translatedText;
      });
    }
  }

  // Navigation methods
  showChangePassword() {
    this.currentView = 'change-password';
    this.clearForm();
  }

  showDeleteAccount() {
    this.currentView = 'delete-account';
    this.clearForm();
  }

  backToMain() {
    this.currentView = 'main';
    this.clearForm();
  }

  // Password visibility toggles
  toggleCurrentPassword() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  toggleDeletePassword() {
    this.showDeletePassword = !this.showDeletePassword;
  }

  // Change Password functionality
  async changePassword() {
    if (!this.validatePasswordForm()) {
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      // TODO: Implement password change API call
      // await this.authService.changePassword({
      //   currentPassword: this.currentPassword,
      //   newPassword: this.newPassword
      // });

      this.showSuccess('auth.password_changed');
      setTimeout(() => this.close(true), 1500);
    } catch (error) {
      this.showError('auth.errors.password_change_failed');
    } finally {
      this.loading = false;
    }
  }

  private validatePasswordForm(): boolean {
    if (!this.currentPassword || !this.newPassword || !this.confirmNewPassword) {
      this.showError('auth.errors.required_fields');
      return false;
    }

    if (this.newPassword.length < 6) {
      this.showError('auth.errors.password_too_short');
      return false;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.showError('auth.errors.password_mismatch');
      return false;
    }

    return true;
  }

  // Delete Account functionality
  async confirmDeleteAccount() {
    const alert = await this.alertController.create({
      header: await this.translate.get('auth.delete_account').toPromise(),
      message: await this.translate.get('auth.delete_account_warning').toPromise(),
      buttons: [
        {
          text: await this.translate.get('auth.cancel').toPromise(),
          role: 'cancel'
        },
        {
          text: await this.translate.get('auth.delete_account').toPromise(),
          role: 'destructive',
          handler: () => {
            this.deleteAccount();
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteAccount() {
    if (!this.validateDeleteForm()) {
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      // TODO: Implement account deletion API call
      // await this.authService.deleteAccount({
      //   securityAnswer: this.securityAnswer,
      //   password: this.deleteConfirmPassword
      // });

      this.showSuccess('auth.account_deleted');
      setTimeout(() => {
        this.authService.logout();
        this.close(true);
      }, 1500);
    } catch (error) {
      this.showError('auth.errors.delete_account_failed');
    } finally {
      this.loading = false;
    }
  }

  private validateDeleteForm(): boolean {
    if (!this.securityAnswer || !this.deleteConfirmPassword) {
      this.showError('auth.errors.required_fields');
      return false;
    }

    return true;
  }

  // Utility methods
  private clearForm() {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmNewPassword = '';
    this.securityAnswer = '';
    this.deleteConfirmPassword = '';
    this.error = '';
    this.success = '';
    this.loading = false;
  }

  private showError(messageKey: string) {
    this.translate.get(messageKey).subscribe(message => {
      this.error = message;
      setTimeout(() => this.error = '', 5000);
    });
  }

  private showSuccess(messageKey: string) {
    this.translate.get(messageKey).subscribe(message => {
      this.success = message;
    });
  }

  close(success = false) {
    this.modalController.dismiss({ success });
  }
}
