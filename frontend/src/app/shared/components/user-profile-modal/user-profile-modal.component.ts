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
  securityQuestionText = '';

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
      security_answer: ['', [Validators.required, Validators.minLength(2)]]
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
        security_answer: '' // Campo para nova resposta de segurança
      });

      // Carregar pergunta de segurança traduzida
      this.loadSecurityQuestionText();
    }
  }

  private loadSecurityQuestionText() {
    if (this.user?.email) {
      console.log('[UserProfile] Buscando pergunta de segurança do backend para:', this.user.email);

      // ✅ CORREÇÃO: Usar a mesma abordagem da recuperação de senha
      // Buscar pergunta de segurança diretamente do backend
      this.authService.requestPasswordReset(this.user.email)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('[UserProfile] Resposta do backend:', response);
            if (response.security_question) {
              // Usar a mesma lógica de tradução da recuperação de senha
              const questionKey = `auth.security_questions.${response.security_question}`;
              const translatedText = this.translate.instant(questionKey);

              if (translatedText && translatedText !== questionKey) {
                this.securityQuestionText = translatedText;
                console.log('[UserProfile] Pergunta de segurança carregada:', translatedText);
              } else {
                // Fallback se a tradução não for encontrada
                this.securityQuestionText = this.getSecurityQuestionFallback(response.security_question);
                console.warn('[UserProfile] Usando fallback para:', response.security_question);
              }
            } else {
              this.securityQuestionText = 'Pergunta de segurança não encontrada no backend';
            }
          },
          error: (error) => {
            console.error('[UserProfile] Erro ao buscar pergunta de segurança:', error);
            // Fallback para dados locais se a API falhar
            this.loadSecurityQuestionFromLocalData();
          }
        });
    } else {
      console.warn('[UserProfile] Usuário não possui email definido');
      this.securityQuestionText = 'Email do usuário não disponível';
    }
  }

  /**
   * ✅ NOVO: Fallback para carregar pergunta de segurança dos dados locais
   */
  private loadSecurityQuestionFromLocalData() {
    if (this.user?.security_question) {
      const questionKey = `auth.security_question_${this.user.security_question}`;
      console.log('[UserProfile] Fallback: Carregando pergunta local:', questionKey);

      this.translate.get(questionKey).subscribe(translatedText => {
        if (translatedText && translatedText !== questionKey) {
          this.securityQuestionText = translatedText;
          console.log('[UserProfile] Pergunta local carregada:', translatedText);
        } else {
          const securityQuestion = this.user?.security_question;
          if (securityQuestion) {
            this.securityQuestionText = this.getSecurityQuestionFallback(securityQuestion);
          } else {
            this.securityQuestionText = 'Pergunta de segurança não definida';
          }
        }
      });
    } else {
      this.securityQuestionText = 'Pergunta de segurança não definida nos dados locais';
    }
  }

  /**
   * ✅ NOVO: Fallback para perguntas de segurança quando tradução não é encontrada
   */
  private getSecurityQuestionFallback(questionKey: string): string {
    const fallbackQuestions: { [key: string]: string } = {
      'pet': 'Qual era o nome do seu primeiro animal de estimação?',
      'city': 'Em que cidade você nasceu?',
      'school': 'Qual era o nome da sua primeira escola?',
      'mother': 'Qual é o nome de solteira da sua mãe?'
    };

    return fallbackQuestions[questionKey] || 'Pergunta de segurança não reconhecida';
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
  get securityAnswerControl() { return this.profileForm.get('security_answer'); }
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