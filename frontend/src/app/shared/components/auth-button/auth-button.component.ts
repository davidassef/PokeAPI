import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { User } from 'src/app/models/user.model';
import { UserRole, UserRoleLabels } from 'src/app/models/user-role.enum';
import { RbacService } from 'src/app/core/services/rbac.service';

@Component({
  selector: 'app-auth-button',
  templateUrl: './auth-button.component.html',
  styleUrls: ['./auth-button.component.scss']
})
export class AuthButtonComponent implements OnInit, OnDestroy {
  @Input() isAuthenticated: boolean = false;
  @Input() user: User | null = null;
  @Input() color: string = 'primary';
  @Input() showUserMenu: boolean = false;
  @Input() abrirLogin!: () => void;
  @Input() abrirPerfil!: () => void;
  @Input() openAccountSettings!: () => void;
  @Input() openTrainerLevel!: () => void;
  @Input() logout!: () => void;
  @Input() toggleUserMenu!: () => void;

  isAdmin = false;
  userRoleLabel = '';
  private rbacSub?: Subscription;
  private translateSub?: Subscription;

  constructor(
    private rbacService: RbacService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    // Verifica se o usuário é administrador
    this.rbacSub = this.rbacService.isAdmin().subscribe(isAdmin => {
      this.isAdmin = isAdmin;
    });

    // Atualiza o label do role quando o usuário muda
    this.updateUserRoleLabel();
  }

  ngOnDestroy() {
    this.rbacSub?.unsubscribe();
    this.translateSub?.unsubscribe();
  }

  private updateUserRoleLabel() {
    if (this.user?.role) {
      const roleKey = UserRoleLabels[this.user.role];
      this.translateSub = this.translate.get(roleKey).subscribe(translatedLabel => {
        this.userRoleLabel = translatedLabel;
      });
    } else {
      this.userRoleLabel = '';
    }
  }

  // Getter para verificar se deve mostrar badge de admin
  get shouldShowAdminBadge(): boolean {
    return this.isAuthenticated && this.isAdmin;
  }

  // Getter para obter a cor do badge baseada no role
  get roleBadgeColor(): string {
    if (!this.user?.role) return 'medium';

    switch (this.user.role) {
      case UserRole.ADMINISTRATOR:
        return 'danger';
      case UserRole.USER:
        return 'primary';
      case UserRole.VISITOR:
        return 'medium';
      default:
        return 'medium';
    }
  }
}