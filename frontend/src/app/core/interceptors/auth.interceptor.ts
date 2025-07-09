import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpEventType
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor para adicionar o token JWT a todas as requisições HTTP
 * e tratar erros de autenticação
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    console.log(`[AuthInterceptor] Interceptando requisição: ${request.method} ${request.url}`);
    
    // Obtém o token do serviço de autenticação
    const token = this.authService.getToken();
    
    // Clona a requisição e adiciona o token de autorização, se disponível
    if (token) {
      console.log('[AuthInterceptor] Token JWT encontrado, adicionando ao cabeçalho');
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Log do header de autorização (apenas para depuração - remover em produção)
      console.log('[AuthInterceptor] Cabeçalho de autorização:', request.headers.get('Authorization')?.substring(0, 30) + '...');
    } else {
      console.warn('[AuthInterceptor] Nenhum token JWT encontrado para a requisição:', request.url);
    }

    // Encaminha a requisição e trata erros de autenticação
    console.log(`[AuthInterceptor] Enviando requisição para: ${request.url}`);
    return next.handle(request).pipe(
      tap((event: HttpEvent<any>) => {
        // Log de resposta bem-sucedida (apenas para respostas HTTP completas)
        if (event.type === HttpEventType.Response) {
          console.log(`[AuthInterceptor] Resposta recebida de ${request.url}`, {
            status: event.status,
            statusText: event.statusText,
            headers: event.headers
          });
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`[AuthInterceptor] Erro na requisição ${request.method} ${request.url}:`, error);
        
        // Se o erro for de autenticação (401) e não for uma rota de login/registro
        if (error.status === 401 && !request.url.includes('/auth/')) {
          console.warn('[AuthInterceptor] Erro 401 - Não autorizado, redirecionando para login');
          
          // Limpa o estado de autenticação
          this.authService.logout(false);
          
          // Redireciona para a página de login
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: this.router.routerState.snapshot.url }
          });
        } else if (error.status === 403) {
          console.error('[AuthInterceptor] Erro 403 - Acesso negado (Forbidden)');
          console.error('Detalhes do erro:', {
            url: request.url,
            method: request.method,
            headers: request.headers,
            error: error.error
          });
        }
        
        // Repassa o erro para o serviço que fez a requisição
        return throwError(() => error);
      })
    );
  }
}
