import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.scss']
})
export class AuthModalComponent {
  @Output() closed = new EventEmitter<void>();
  modo: 'login' | 'register' = 'login';
  email = '';
  senha = '';
  nome = '';
  erro = '';
  loading = false;

  constructor(private authService: AuthService) {}

  alternarModo() {
    this.modo = this.modo === 'login' ? 'register' : 'login';
    this.erro = '';
  }

  fechar() {
    this.closed.emit();
  }

  login() {
    this.loading = true;
    this.erro = '';
    this.authService.login(this.email, this.senha).subscribe({
      next: () => {
        this.loading = false;
        this.fechar();
      },
      error: (err) => {
        this.loading = false;
        this.erro = err.error?.detail || 'Erro ao fazer login';
      }
    });
  }

  registrar() {
    this.loading = true;
    this.erro = '';
    this.authService.register({ email: this.email, password: this.senha, name: this.nome }).subscribe({
      next: () => {
        this.loading = false;
        this.modo = 'login';
        this.erro = 'Conta criada! Faça login.';
      },
      error: (err) => {
        this.loading = false;
        this.erro = err.error?.detail || 'Erro ao registrar';
      }
    });
  }

  loginGoogle() {
    // Aqui você pode chamar o método de login social do AuthService
    this.authService.loginWithGoogle().subscribe({
      next: () => this.fechar(),
      error: (err) => {
        this.erro = err.error?.detail || 'Erro ao autenticar com Google';
      }
    });
  }
} 