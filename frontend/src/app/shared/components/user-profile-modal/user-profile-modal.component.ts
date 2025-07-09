import { Component, EventEmitter, Output, Input } from '@angular/core';
import { User } from 'src/app/models/user.model';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-user-profile-modal',
  templateUrl: './user-profile-modal.component.html',
  styleUrls: ['./user-profile-modal.component.scss']
})
export class UserProfileModalComponent {
  @Input() user: User | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  editando = false;
  nome = '';
  email = '';
  erro = '';
  loading = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    if (this.user) {
      this.nome = this.user.name || '';
      this.email = this.user.email || '';
    }
  }

  fechar() {
    this.closed.emit();
  }

  editar() {
    this.editando = true;
  }

  salvar() {
    this.loading = true;
    this.erro = '';
    // Aqui você pode chamar um método do AuthService para atualizar o perfil
    this.authService.updateProfile({ nome: this.nome, email: this.email }).subscribe({
      next: () => {
        this.loading = false;
        this.editando = false;
      },
      error: (err) => {
        this.loading = false;
        this.erro = err.error?.detail || 'Erro ao atualizar perfil';
      }
    });
  }

  sair() {
    this.logout.emit();
    this.fechar();
  }
} 