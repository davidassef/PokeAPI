import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rotas que só devem ser acessadas por usuários não autenticados
 * (como login e registro)
 */
@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    console.log('[NoAuthGuard] Verificando se usuário não está autenticado para rota:', state.url);
    
    if (!this.authService.isAuthenticated()) {
      console.log('[NoAuthGuard] Usuário não autenticado, permitindo acesso');
      return true;
    }

    console.log('[NoAuthGuard] Usuário já autenticado, redirecionando para home');
    
    // Se já está autenticado, redireciona para home
    this.router.navigate(['/tabs/home']);
    
    return false;
  }
}
