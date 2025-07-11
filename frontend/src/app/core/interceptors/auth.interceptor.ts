import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpEventType
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, switchMap, filter, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor para adicionar o token JWT a todas as requisições HTTP
 * e tratar erros de autenticação
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    console.log(`[AuthInterceptor] Interceptando requisição: ${request.method} ${request.url}`);

    // Lista de rotas públicas que não precisam de autenticação
    const publicRoutes = ['/auth/login', '/auth/register', '/auth/reset-password', '/health'];
    const isPublicRoute = publicRoutes.some(route => request.url.includes(route));

    console.log(`[AuthInterceptor] URL: ${request.url}, É rota pública: ${isPublicRoute}`);

    // Obtém o token do serviço de autenticação
    const token = this.authService.getToken();

    // Clona a requisição e adiciona o token de autorização, se disponível e não for rota pública
    if (token && !isPublicRoute) {
      console.log('[AuthInterceptor] Token JWT encontrado, adicionando ao cabeçalho');
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      // Log do header de autorização (apenas para depuração - remover em produção)
      console.log('[AuthInterceptor] Cabeçalho de autorização:', request.headers.get('Authorization')?.substring(0, 30) + '...');
    } else if (isPublicRoute) {
      console.log('[AuthInterceptor] Rota pública detectada, não adicionando token:', request.url);
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
        console.error(`[AuthInterceptor] Status: ${error.status}, StatusText: ${error.statusText}`);
        console.error(`[AuthInterceptor] Error details:`, error.error);

        // Se o erro for de autenticação (401) e não for uma rota de login/registro
        if (error.status === 401 && !request.url.includes('/auth/')) {
          console.warn('[AuthInterceptor] Erro 401 - Tentando renovar token automaticamente');
          return this.handle401Error(request, next);
        } else if (error.status === 403) {
          console.error('[AuthInterceptor] Erro 403 - Acesso negado (Forbidden)');
          console.error('Detalhes do erro:', {
            url: request.url,
            method: request.method,
            headers: request.headers,
            error: error.error
          });
        } else if (error.status === 0) {
          console.error('[AuthInterceptor] Erro de conectividade - Backend pode estar offline');
        } else if (error.status >= 500) {
          console.error('[AuthInterceptor] Erro interno do servidor');
        }

        // Repassa o erro para o serviço que fez a requisição
        return throwError(() => error);
      })
    );
  }

  /**
   * Trata erros 401 tentando renovar o token automaticamente
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((tokenData: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(tokenData.token);

          // Retry a requisição original com o novo token
          return next.handle(this.addTokenHeader(request, tokenData.token));
        }),
        catchError((err) => {
          this.isRefreshing = false;

          console.warn('[AuthInterceptor] Falha ao renovar token, redirecionando para login');

          // Limpa o estado de autenticação
          this.authService.logout(false);

          // Redireciona para a página de login
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: this.router.routerState.snapshot.url }
          });

          return throwError(() => err);
        })
      );
    }

    // Se já está renovando, aguarda o resultado
    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addTokenHeader(request, token)))
    );
  }

  /**
   * Adiciona o token de autorização ao cabeçalho da requisição
   */
  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
