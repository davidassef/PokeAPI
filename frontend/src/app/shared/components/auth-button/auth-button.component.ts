import { Component, Input } from '@angular/core';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-auth-button',
  templateUrl: './auth-button.component.html',
  styleUrls: ['./auth-button.component.scss']
})
export class AuthButtonComponent {
  @Input() isAuthenticated: boolean = false;
  @Input() user: User | null = null;
  @Input() color: string = 'primary';
  @Input() showUserMenu: boolean = false;
  @Input() abrirLogin!: () => void;
  @Input() abrirPerfil!: () => void;
  @Input() logout!: () => void;
  @Input() toggleUserMenu!: () => void;
} 