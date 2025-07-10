import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rotas que requerem autenticação
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    console.log('[AuthGuard] Verificando autenticação para rota:', state.url);
    
    if (this.authService.isAuthenticated()) {
      console.log('[AuthGuard] Usuário autenticado, permitindo acesso');
      return true;
    }

    console.log('[AuthGuard] Usuário não autenticado, redirecionando para login');
    
    // Salva a URL de destino para redirecionar após login
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    
    return false;
  }
}
