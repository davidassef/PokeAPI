import { Component } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss']
})
export class RegisterPage {
  name = '';
  email = '';
  contact = '';
  password = '';
  confirmPassword = '';
  securityQuestion = '';
  securityAnswer = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  register() {
    // Validação básica
    if (this.password !== this.confirmPassword) {
      this.error = 'As senhas não conferem';
      return;
    }

    this.loading = true;
    this.error = '';

    const userData = {
      name: this.name,
      email: this.email,
      contact: this.contact || '',
      password: this.password,
      security_question: this.securityQuestion,
      security_answer: this.securityAnswer
    };

    this.authService.register(userData).subscribe({
      next: (response) => {
        this.loading = false;
        // Mostrar mensagem de sucesso e redirecionar para login
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true' }
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || 'Erro ao registrar usuário. Tente novamente.';

        // Tratamento específico para erros de validação
        if (err.status === 422 && err.error?.detail) {
          this.error = 'Dados inválidos: ' + err.error.detail.map((e: any) => e.msg).join(', ');
        } else if (err.status === 400) {
          this.error = 'Dados inválidos. Verifique os campos e tente novamente.';
        } else if (err.status === 409) {
          this.error = 'Este email já está em uso. Tente fazer login ou use outro email.';
        }
      }
    });
  }
}
