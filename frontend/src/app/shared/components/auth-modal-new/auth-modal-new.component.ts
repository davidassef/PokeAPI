import { Component, EventEmitter, Output, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-modal-new',
  templateUrl: './auth-modal-new.component.html',
  styleUrls: ['./auth-modal-new.component.scss'],
  animations: [
    trigger('modalEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' }))
      ])
    ])
  ]
})
export class AuthModalNewComponent implements OnInit, OnDestroy {
  @Output() closed = new EventEmitter<boolean>();

  // Estados do modal
  modo: 'login' | 'register' | 'forgot' = 'login';
  loading = false;
  erro = '';
  sucesso = '';

  // Campos do formulário
  email = '';
  senha = '';
  nome = '';
  confirmarSenha = '';
  perguntaSeguranca = '';
  respostaSeguranca = '';
  novaSenha = '';
  confirmarNovaSenha = '';

  // Estados de visibilidade de senha
  showPassword = false;
  showConfirmPassword = false;

  // Estados de recuperação de senha
  usuarioEncontrado: any = null;
  podeRedefinirSenha = false;

  constructor(
    private authService: AuthService,
    private modalController: ModalController,
    private toastController: ToastController,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    // Initialization if needed
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  @HostListener('click', ['$event'])
  onHostClick(event: Event) {
    // Close modal if clicked on the host element (backdrop)
    if (event.target === event.currentTarget) {
      this.fechar();
    }
  }

  onClose(event: Event) {
    if (event.target === event.currentTarget) {
      this.fechar();
    }
  }

  fechar(success: boolean = false) {
    this.modalController.dismiss({ success });
  }

  // Métodos de UI - Tema Pokémon
  getHeaderGradient(): string {
    // Usa as mesmas variáveis CSS dos headers para consistência
    return 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 50%, var(--secondary) 100%)';
  }

  getHeaderIcon(): string {
    switch (this.modo) {
      case 'login':
        return 'log-in-outline';
      case 'register':
        return 'person-add-outline';
      case 'forgot':
        return 'key-outline';
      default:
        return 'log-in-outline';
    }
  }

  getTitle(): string {
    switch (this.modo) {
      case 'login':
        return 'auth.welcome_back';
      case 'register':
        return 'auth.create_account';
      case 'forgot':
        return 'auth.reset_password';
      default:
        return 'auth.welcome_back';
    }
  }

  getSubtitle(): string {
    switch (this.modo) {
      case 'login':
        return 'auth.login_subtitle';
      case 'register':
        return 'auth.register_subtitle';
      case 'forgot':
        return 'auth.forgot_subtitle';
      default:
        return 'auth.login_subtitle';
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Métodos de autenticação
  async login() {
    if (!this.email || !this.senha) {
      this.mostrarErro('auth.errors.required_fields');
      return;
    }

    this.loading = true;
    this.erro = '';

    this.authService.login(this.email, this.senha).subscribe({
      next: () => {
        this.loading = false;
        this.mostrarSucesso('auth.success.login_successful');
        setTimeout(() => this.fechar(true), 1500);
      },
      error: (err) => {
        this.loading = false;
        this.mostrarErro('auth.errors.login_failed');
      }
    });
  }

  async registrar() {
    if (!this.nome || !this.email || !this.senha || !this.confirmarSenha || !this.perguntaSeguranca || !this.respostaSeguranca) {
      this.mostrarErro('auth.errors.required_fields');
      return;
    }

    if (this.senha !== this.confirmarSenha) {
      this.mostrarErro('auth.errors.password_mismatch');
      return;
    }

    if (this.senha.length < 6) {
      this.mostrarErro('auth.errors.password_too_short');
      return;
    }

    this.loading = true;
    this.erro = '';

    const dadosRegistro = {
      name: this.nome,
      email: this.email,
      password: this.senha,
      security_question: this.perguntaSeguranca,
      security_answer: this.respostaSeguranca
    };

    this.authService.register(dadosRegistro).subscribe({
      next: () => {
        this.loading = false;
        this.mostrarSucesso('auth.success.account_created');
        setTimeout(() => this.fechar(true), 1500);
      },
      error: (err) => {
        this.loading = false;
        this.mostrarErro('auth.errors.register_failed');
      }
    });
  }

  // Métodos de recuperação de senha
  async buscarUsuario() {
    if (!this.email) {
      this.mostrarErro('auth.errors.required_fields');
      return;
    }

    this.loading = true;
    this.erro = '';

    this.authService.requestPasswordReset(this.email).subscribe({
      next: (response) => {
        this.loading = false;
        this.usuarioEncontrado = response;
        this.mostrarSucesso('auth.success.user_found');
      },
      error: (err) => {
        this.loading = false;
        this.mostrarErro('auth.errors.user_not_found');
      }
    });
  }

  async verificarResposta() {
    if (!this.respostaSeguranca) {
      this.mostrarErro('auth.errors.required_fields');
      return;
    }

    this.loading = true;
    this.erro = '';

    this.authService.verifySecurityAnswer(this.email, this.respostaSeguranca).subscribe({
      next: (response) => {
        this.loading = false;
        this.podeRedefinirSenha = true;
        this.mostrarSucesso('auth.success.answer_correct');
      },
      error: (err) => {
        this.loading = false;
        this.mostrarErro('auth.errors.incorrect_answer');
      }
    });
  }

  async redefinirSenha() {
    if (!this.novaSenha || !this.confirmarNovaSenha) {
      this.mostrarErro('auth.errors.required_fields');
      return;
    }

    if (this.novaSenha !== this.confirmarNovaSenha) {
      this.mostrarErro('auth.errors.password_mismatch');
      return;
    }

    if (this.novaSenha.length < 6) {
      this.mostrarErro('auth.errors.password_too_short');
      return;
    }

    this.loading = true;
    this.erro = '';

    this.authService.completePasswordReset(this.email, this.respostaSeguranca, this.novaSenha).subscribe({
      next: (response) => {
        this.loading = false;
        this.mostrarSucesso('auth.success.password_reset');
        setTimeout(() => {
          this.voltarParaLogin();
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.mostrarErro('auth.errors.reset_failed');
      }
    });
  }

  getPerguntaSegurancaTexto(): string {
    if (!this.usuarioEncontrado) return '';

    const questionKey = `auth.security_questions.${this.usuarioEncontrado.security_question}`;
    return this.translate.instant(questionKey);
  }

  voltarParaLogin() {
    this.modo = 'login';
    this.limparFormularios();
  }

  limparFormularios() {
    this.email = '';
    this.senha = '';
    this.nome = '';
    this.confirmarSenha = '';
    this.perguntaSeguranca = '';
    this.respostaSeguranca = '';
    this.novaSenha = '';
    this.confirmarNovaSenha = '';
    this.erro = '';
    this.sucesso = '';
    this.usuarioEncontrado = null;
    this.podeRedefinirSenha = false;
  }

  private mostrarErro(mensagemKey: string) {
    this.translate.get(mensagemKey).subscribe(mensagem => {
      this.erro = mensagem;
      this.sucesso = '';
    });
  }

  private mostrarSucesso(mensagemKey: string) {
    this.translate.get(mensagemKey).subscribe(mensagem => {
      this.sucesso = mensagem;
      this.erro = '';
    });
  }

  private async mostrarToast(mensagem: string, cor: string = 'danger') {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 3000,
      color: cor,
      position: 'bottom'
    });
    await toast.present();
  }
}
