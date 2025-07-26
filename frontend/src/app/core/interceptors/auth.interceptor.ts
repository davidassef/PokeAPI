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
import { LoggerService } from '../services/logger.service';

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
    private router: Router,
    private logger: LoggerService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // ✅ OTIMIZAÇÃO: Log apenas em debug mode
    this.logger.debug('auth', `Interceptando requisição: ${request.method} ${request.url}`);

    // Lista de rotas públicas que não precisam de autenticação
    const publicRoutes = ['/auth/login', '/auth/register', '/auth/reset-password', '/health'];
    const isPublicRoute = publicRoutes.some(route => request.url.includes(route));

    // Verificar se é uma URL da PokeAPI (externa) que não precisa de JWT
    const isPokeAPIRoute = request.url.includes('pokeapi.co') || request.url.includes('assets/data/');
    const isExternalPublicRoute = isPublicRoute || isPokeAPIRoute;

    console.log(`[AuthInterceptor] URL: ${request.url}, É rota pública: ${isExternalPublicRoute} (Backend: ${isPublicRoute}, PokeAPI: ${isPokeAPIRoute})`);

    // Obtém o token do serviço de autenticação
    const token = this.authService.getToken();

    // Clona a requisição e adiciona o token de autorização, se disponível e não for rota pública
    if (token && !isExternalPublicRoute) {
      this.logger.debug('auth', 'Token JWT encontrado, adicionando ao cabeçalho');
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      // ✅ OTIMIZAÇÃO: Log de header apenas em debug
      this.logger.debug('auth', `Cabeçalho de autorização: ${request.headers.get('Authorization')?.substring(0, 30)}...`);
    } else if (isExternalPublicRoute) {
      this.logger.debug('auth', `Rota pública detectada: ${request.url}`);
    } else {
      this.logger.warn('auth', `Nenhum token JWT encontrado para: ${request.url}`);
    }

    // Encaminha a requisição e trata erros de autenticação
    this.logger.debug('auth', `Enviando requisição para: ${request.url}`);
    return next.handle(request).pipe(
      tap((event: HttpEvent<any>) => {
        // ✅ OTIMIZAÇÃO: Log de resposta apenas em debug
        if (event.type === HttpEventType.Response) {
          this.logger.debug('auth', `Resposta recebida de ${request.url}`, {
            status: event.status,
            statusText: event.statusText
          });
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // ✅ CORREÇÃO CRÍTICA: Tratamento específico para erro 405 (CORS preflight)
        if (error.status === 405 && request.method === 'POST' && request.url.includes('/api/v1/favorites/')) {
          this.logger.warn('auth', `Erro 405 detectado - possível problema de CORS preflight. URL: ${request.url}`);

          // Log detalhado para debug
          console.warn('[AuthInterceptor] Erro 405 - Method Not Allowed detectado');
          console.warn('[AuthInterceptor] Isso indica problema de CORS preflight no backend');
          console.warn('[AuthInterceptor] Aguardando correção no backend ou redeploy');

          // Retornar erro original para que o usuário veja a mensagem
          return throwError(() => error);
        }

        // ✅ OTIMIZAÇÃO: Logs de erro mantidos mas organizados
        this.logger.error('auth', `Erro na requisição ${request.method} ${request.url}`, {
          status: error.status,
          statusText: error.statusText,
          error: error.error
        });

        // Se o erro for de autenticação (401) e não for uma rota de login/registro
        if (error.status === 401 && !request.url.includes('/auth/')) {
          this.logger.warn('auth', 'Erro 401 - Tentando renovar token automaticamente');
          return this.handle401Error(request, next);
        } else if (error.status === 403) {
          this.logger.error('auth', 'Erro 403 - Acesso negado (Forbidden)', {
            url: request.url,
            method: request.method,
            error: error.error
          });
        } else if (error.status === 0) {
          this.logger.error('auth', 'Erro de conectividade - Backend pode estar offline');
        } else if (error.status >= 500) {
          this.logger.error('auth', 'Erro interno do servidor');
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
