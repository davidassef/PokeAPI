import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-profile-modal',
  templateUrl: './profile-modal.component.html',
  styleUrls: ['./profile-modal.component.scss']
})
export class ProfileModalComponent implements OnInit {
  // Form fields
  firstName = '';
  lastName = '';
  email = '';
  securityQuestion = '';
  securityAnswer = '';
  currentPassword = '';

  // UI states
  loading = false;
  showCurrentPassword = false;
  error = '';
  success = '';

  // Security questions
  securityQuestions = [
    { key: 'pet', value: 'auth.security_questions.pet' },
    { key: 'city', value: 'auth.security_questions.city' },
    { key: 'school', value: 'auth.security_questions.school' },
    { key: 'mother', value: 'auth.security_questions.mother' }
  ];

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  private loadUserData() {
    const user = this.authService.getCurrentUser();
    if (user) {
      // Parse the name field to extract first and last name
      const nameParts = user.name?.split(' ') || [];
      this.firstName = nameParts[0] || '';
      this.lastName = nameParts.slice(1).join(' ') || '';
      this.email = user.email || '';
      // Note: Security question and answer would need to be loaded from backend
    }
  }

  toggleCurrentPassword() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  async saveChanges() {
    if (!this.validateForm()) {
      return;
    }

    if (!this.currentPassword) {
      this.showError('auth.verify_current_password');
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      // Combine first and last name
      const fullName = `${this.firstName.trim()} ${this.lastName.trim()}`.trim();
      
      const updateData = {
        name: fullName,
        email: this.email,
        securityQuestion: this.securityQuestion,
        securityAnswer: this.securityAnswer,
        currentPassword: this.currentPassword
      };

      // TODO: Implement profile update API call
      // await this.authService.updateProfile(updateData);
      
      this.showSuccess('auth.profile_updated');
      setTimeout(() => this.close(true), 1500);
    } catch (error) {
      this.showError('auth.errors.update_failed');
    } finally {
      this.loading = false;
    }
  }

  private validateForm(): boolean {
    if (!this.firstName.trim()) {
      this.showError('auth.errors.required_fields');
      return false;
    }

    if (!this.email.trim()) {
      this.showError('auth.errors.required_fields');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.showError('auth.errors.invalid_email');
      return false;
    }

    return true;
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
