import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map, switchMap, timeout, retryWhen, delay, take, retry } from 'rxjs/operators';
import { User } from '../../models/user.model';
import { UserRole, getDefaultRole, isValidRole } from '../../models/user-role.enum';
import { environment } from '../../../environments/environment';

/** Interface para resposta de autenticação */
interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
  refresh_token?: string;
}

/** Interface para dados de autenticação internos */
interface AuthData {
  token: string;
  user?: User;
  expiresIn?: number;
  refreshToken?: string;
}

/** Interface para erros de autenticação */
interface AuthError {
  status: number;
  message: string;
  details?: any;
  code?: string;
  timestamp?: string;
  path?: string;
}

/** Interface para token decodificado */
interface DecodedToken {
  sub: string;
  id?: string;
  name?: string;
  firstName?: string;
  email?: string;
  role?: string;
  level?: number;
  roles?: string[];
  iat?: number;
  exp: number;
  avatar?: string;
  security_question?: string;
  [key: string]: unknown;
}

/**
 * Interface para configuração de autenticação
 */
interface AuthConfig {
  tokenKey: string;
  refreshTokenKey: string;
  enableLogging: boolean;
  apiUrl: string;
  requestTimeout: number;
}

/**
 * Gerenciador interno de tokens JWT
 * Centraliza toda lógica relacionada a tokens
 */
class TokenManager {
  constructor(private config: AuthConfig) {}

  /**
   * Verifica se existe um token válido
   */
  hasValidToken(): boolean {
    const token = this.getToken();
    return token ? this.isTokenValid(token) : false;
  }

  /**
   * Obtém o token atual do localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.config.tokenKey);
  }

  /**
   * Obtém o refresh token do localStorage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.config.refreshTokenKey);
  }

  /**
   * Salva tokens no localStorage
   */
  setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem(this.config.tokenKey, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.config.refreshTokenKey, refreshToken);
    }
  }

  /**
   * Remove todos os tokens do localStorage
   */
  clearTokens(): void {
    localStorage.removeItem(this.config.tokenKey);
    localStorage.removeItem(this.config.refreshTokenKey);
  }

  /**
   * Decodifica token JWT e extrai dados do usuário
   */
  decodeToken(token: string): User | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      return {
        id: payload.user_id || payload.sub,
        email: payload.email || '',
        name: payload.name || '',
        role: isValidRole(payload.role) ? payload.role : getDefaultRole()
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Verifica se o token é válido (não expirado)
   */
  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }
}

/**
 * Gerenciador interno de estado de autenticação
 * Centraliza o estado reativo da autenticação
 */
class AuthStateManager {
  private authState = new BehaviorSubject<boolean>(false);
  private currentUser = new BehaviorSubject<User | null>(null);

  public authState$ = this.authState.asObservable();
  public currentUser$ = this.currentUser.asObservable();

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return this.authState.value;
  }

  /**
   * Obtém o usuário atual
   */
  getCurrentUser(): User | null {
    return this.currentUser.value;
  }

  /**
   * Define usuário autenticado e atualiza estado
   */
  setAuthenticatedUser(user: User): void {
    this.currentUser.next(user);
    this.authState.next(true);
  }

  /**
   * Limpa autenticação e reseta estado
   */
  clearAuthentication(): void {
    this.currentUser.next(null);
    this.authState.next(false);
  }

  /**
   * Sincroniza estado com token válido
   */
  syncWithToken(user: User | null): void {
    if (user) {
      this.setAuthenticatedUser(user);
    } else {
      this.clearAuthentication();
    }
  }
}

/**
 * Serviço de autenticação JWT refatorado
 * Gerencia autenticação com responsabilidades bem definidas
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Configuração do serviço */
  private config: AuthConfig = {
    tokenKey: 'jwt_token',
    refreshTokenKey: 'refresh_token',
    enableLogging: !environment.production,
    apiUrl: `${environment.apiUrl}/api/v1`,
    requestTimeout: 30000
  };

  /** Gerenciadores internos */
  private tokenManager = new TokenManager(this.config);
  private stateManager = new AuthStateManager();

  /** Timer para renovação automática do token */
  private refreshTokenTimer: any = null;

  /** Observables públicos */
  public authState$ = this.stateManager.authState$;
  public currentUser$ = this.stateManager.currentUser$;

  constructor(private http: HttpClient) {
    this.initializeAuthState();
  }

  /**
   * Inicializa o estado de autenticação verificando o token armazenado
   */
  public initializeAuthState(): Promise<void> {
    if (this.tokenManager.hasValidToken()) {
      const token = this.tokenManager.getToken()!;
      const user = this.tokenManager.decodeToken(token);

      if (user) {
        this.stateManager.setAuthenticatedUser(user);
        this.setupTokenRefresh(token);
        this.logIfEnabled('Auth state initialized for user:', user.email);
      } else {
        this.clearAuthState();
      }
    } else {
      this.clearAuthState();
    }

    return Promise.resolve();
  }

  /**
   * Configura a renovação automática do token antes de expirar
   * @param token Token JWT atual
   */
  private setupTokenRefresh(token: string): void {
    // Limpa qualquer timer existente
    if (this.refreshTokenTimer) {
      clearTimeout(this.refreshTokenTimer);
    }

    const decoded = this.tokenManager.decodeToken(token);
    if (!decoded) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expTime = payload.exp || Math.floor(Date.now() / 1000) + 3600;

      // Calcula o tempo restante até a expiração (em ms)
      const expiresIn = (expTime * 1000) - Date.now();

      // Renova o token 1 minuto antes de expirar (ou imediatamente se faltar menos de 1 minuto)
      const refreshIn = Math.max(0, expiresIn - 60000);

      if (refreshIn > 0) {
        this.refreshTokenTimer = setTimeout(() => {
          this.refreshToken().subscribe({
            next: () => this.logIfEnabled('Token renovado com sucesso'),
            error: (err) => {
              this.logIfEnabled('Falha ao renovar token:', err);
              this.logout();
            }
          });
        }, refreshIn);
      }
    } catch (error) {
      this.logIfEnabled('Erro ao configurar renovação de token:', error);
    }
  }

  /**
   * Realiza login do usuário.
   * @param email Email do usuário
   * @param senha Senha do usuário
   */
  /**
   * Realiza o login do usuário com email e senha
   * @param email Email do usuário
   * @param senha Senha do usuário
   * @returns Observable com os dados do usuário e token
   */
  login(email: string, senha: string): Observable<{ token: string; user: User }> {
    this.logIfEnabled('Iniciando login para:', email);

    return this.performLogin(email, senha).pipe(
      tap(response => this.handleLoginSuccess(response)),
      map(() => ({
        token: this.tokenManager.getToken() || '',
        user: this.stateManager.getCurrentUser() as User
      })),
      catchError(error => this.handleLoginError(error))
    );
  }

  /**
   * Executa a requisição de login
   */
  private performLogin(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.config.apiUrl}/auth/login`, { email, password }).pipe(
      timeout(this.config.requestTimeout)
    );
  }

  /**
   * Trata sucesso do login
   */
  private handleLoginSuccess(response: AuthResponse): void {
    if (!response?.access_token) {
      throw new Error('Resposta de login inválida - Token não encontrado');
    }

    this.tokenManager.setTokens(response.access_token, response.refresh_token);
    this.stateManager.setAuthenticatedUser(response.user);
    this.setupTokenRefresh(response.access_token);

    this.logIfEnabled('Login realizado com sucesso para:', response.user.email);
  }

  /**
   * Trata erro do login
   */
  private handleLoginError(error: any): Observable<never> {
    this.logIfEnabled('Erro no login:', error);
    this.stateManager.clearAuthentication();
    return throwError(() => error);
  }

  /**
   * Log condicional (apenas em desenvolvimento)
   */
  private logIfEnabled(message: string, ...args: any[]): void {
    if (this.config.enableLogging) {
      console.log(`[AuthService] ${message}`, ...args);
    }
  }

  /**
   * Atualiza os dados de autenticação no armazenamento local
   * @param authData Dados de autenticação
   */
  private setAuthData(authData: AuthData): void {
    this.tokenManager.setTokens(authData.token, authData.refreshToken);
  }

  /**
   * Realiza logout do usuário.
   * @param notifyServer Se true, notifica o servidor sobre o logout
   */
  logout(notifyServer: boolean = true): void {
    if (notifyServer) {
      const token = this.tokenManager.getToken();
      if (token) {
        // Tenta notificar o servidor sobre o logout, mas não bloqueia o processo
        this.http.post(`${this.config.apiUrl}/auth/logout`, {}, {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'text'
        }).pipe(
          catchError(error => {
            this.logIfEnabled('Erro ao notificar logout no servidor:', error);
            return of(null);
          })
        ).subscribe();
      }
    }

    this.clearAuthState();
  }

  /**
   * Limpa todos os dados de autenticação
   */
  private clearAuthState(): void {
    // Limpa os tokens usando o manager
    this.tokenManager.clearTokens();

    // Limpa o timer de renovação
    if (this.refreshTokenTimer) {
      clearTimeout(this.refreshTokenTimer);
      this.refreshTokenTimer = null;
    }

    // Atualiza o estado usando o manager
    this.stateManager.clearAuthentication();
  }

  /**
   * Registra novo usuário e realiza login automático.
   * @param dados Dados de registro (nome, email, senha, contato)
   */
  register(dados: {
    name: string;
    email: string;
    password: string;
    contact?: string;
    security_question: string;
    security_answer: string;
  }): Observable<{token: string; user: User}> {
    console.log('[AuthService] Iniciando registro de usuário:', { email: dados.email, name: dados.name });

    // Garantir que os dados estão no formato correto
    const dadosLimpos = {
      email: dados.email.trim().toLowerCase(),
      password: dados.password,
      name: dados.name.trim(),
      contact: dados.contact?.trim() || null,
      security_question: dados.security_question,
      security_answer: dados.security_answer.trim().toLowerCase()
    };

    console.log('[AuthService] Dados formatados para envio:', {
      email: dadosLimpos.email,
      name: dadosLimpos.name,
      security_question: dadosLimpos.security_question,
      hasContact: !!dadosLimpos.contact
    });

    return this.http.post<User>(`${this.config.apiUrl}/auth/register`, dadosLimpos, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(
      timeout(30000), // Timeout aumentado para 30 segundos
      // Retry logic: tenta até 3 vezes com delay crescente
      retryWhen(errors =>
        errors.pipe(
          tap(error => {
            console.warn('[AuthService] Tentativa de registro falhou, tentando novamente...', error);
          }),
          delay(2000), // Aguarda 2 segundos antes de tentar novamente
          take(2) // Máximo 2 tentativas adicionais (3 total)
        )
      ),
      tap((user) => {
        console.log('[AuthService] Usuário registrado com sucesso:', user);
      }),
      switchMap((user) => {
        console.log('[AuthService] Fazendo login automático após registro...');
        // Após registro bem-sucedido, fazer login automático
        return this.login(dadosLimpos.email, dados.password).pipe(
          timeout(15000), // Timeout menor para login
          retry(1) // Uma tentativa adicional para login
        );
      }),
      tap((result) => {
        console.log('[AuthService] Login automático após registro bem-sucedido:', result);
      }),
      catchError(error => {
        console.error('[AuthService] Erro durante registro:', error);
        console.error('[AuthService] Detalhes do erro:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error,
          name: error.name
        });

        // Tratamento específico para diferentes tipos de erro
        if (error.name === 'TimeoutError') {
          console.error('[AuthService] TIMEOUT: Operação demorou mais que o esperado');
          return throwError(() => ({
            ...error,
            userMessage: 'A operação está demorando mais que o esperado. Tente novamente.'
          }));
        }

        return this.handleError('registro')(error);
      })
    );
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    const hasValidToken = this.tokenManager.hasValidToken();
    const isStateAuthenticated = this.stateManager.isAuthenticated();

    // Se há inconsistência, sincronizar estado
    if (hasValidToken && !isStateAuthenticated) {
      const token = this.tokenManager.getToken()!;
      const user = this.tokenManager.decodeToken(token);

      if (user) {
        this.stateManager.setAuthenticatedUser(user);
        this.setupTokenRefresh(token);
        this.logIfEnabled('Estado sincronizado - token válido encontrado');
        return true;
      }
    }

    // Se não há token válido mas estado está autenticado, limpar
    if (!hasValidToken && isStateAuthenticated) {
      this.logIfEnabled('Token inválido - limpando estado');
      this.clearAuthState();
      return false;
    }

    return hasValidToken && isStateAuthenticated;
  }

  /**
   * Observable para mudanças de autenticação.
   */
  getAuthState(): Observable<boolean> {
    return this.stateManager.authState$;
  }



  /**
   * Método público para obter o observable do usuário atual
   * (para compatibilidade com RbacService)
   */
  getCurrentUser$(): Observable<User | null> {
    return this.currentUser$;
  }

  /**
   * Retorna o token JWT atual.
   */
  getToken(): string | null {
    return this.tokenManager.getToken();
  }

  /**
   * Retorna o refresh token atual.
   */
  getRefreshToken(): string | null {
    return this.tokenManager.getRefreshToken();
  }

  /**
   * Decodifica o token JWT para obter as informações do usuário.
   * @param token Token JWT
   */


  /**
   * Verifica se há token salvo.
   */
  private hasToken(): boolean {
    return !!this.tokenManager.getToken();
  }

  /**
   * Retorna os dados do usuário autenticado a partir do JWT.
   * Se o token for inválido ou expirado, limpa o estado de autenticação.
   * @param forceRefresh Se true, força a renovação do token antes de retornar o usuário
   * @returns Dados do usuário ou null se não estiver autenticado
   */
  getCurrentUser(forceRefresh: boolean = false): User | null {
    // Se forçado a atualizar e tivermos um refresh token, tenta renovar
    if (forceRefresh && this.tokenManager.getRefreshToken()) {
      this.refreshToken().subscribe({
        next: () => this.logIfEnabled('Token renovado com sucesso'),
        error: (err) => {
          this.logIfEnabled('Falha ao renovar token:', err);
          this.logout();
        }
      });
    }

    // Verificar se há token válido e sincronizar estado se necessário
    if (this.tokenManager.hasValidToken()) {
      const token = this.tokenManager.getToken()!;
      const user = this.tokenManager.decodeToken(token);

      if (user) {
        // Sincronizar estado se necessário
        const currentUser = this.stateManager.getCurrentUser();
        if (!currentUser || JSON.stringify(currentUser) !== JSON.stringify(user)) {
          this.stateManager.setAuthenticatedUser(user);
        }
        return user;
      }
    }

    // Se não há token válido mas há refresh token, tentar renovar
    if (!this.tokenManager.hasValidToken() && this.tokenManager.getRefreshToken()) {
      this.refreshToken().subscribe({
        next: () => this.logIfEnabled('Token renovado automaticamente'),
        error: (err) => {
          this.logIfEnabled('Falha na renovação automática:', err);
          this.logout();
        }
      });
      return this.stateManager.getCurrentUser(); // Retorna usuário atual enquanto renova
    }

    return this.stateManager.getCurrentUser();
  }

  /**
   * Renova o token usando o refresh token
   * @returns Observable com o novo token
   */
  refreshToken(): Observable<{ token: string; user: User }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Nenhum refresh token disponível'));
    }

    return this.http.post<AuthResponse>('/api/v1/auth/refresh', {
      refresh_token: refreshToken
    }).pipe(
      tap(response => {
        if (response?.access_token) {
          this.setAuthData({
            token: response.access_token,
            user: response.user,
            expiresIn: response.expires_in,
            refreshToken: response.refresh_token
          });

          this.stateManager.setAuthenticatedUser(response.user);
          this.setupTokenRefresh(response.access_token);
        } else {
          throw new Error('Resposta de renovação de token inválida');
        }
      }),
      map(() => ({
        token: this.getToken() || '',
        user: this.getCurrentUser() as User
      })),
      catchError(error => {
        console.error('Erro ao renovar token:', error);
        this.clearAuthState();
        return throwError(() => error);
      })
    );
  }



  /**
   * Verifica se o token está próximo do vencimento
   * @param token Token JWT para verificar
   * @param toleranceMinutes Tolerância em minutos (padrão: 5)
   */
  isTokenExpiringSoon(token?: string, toleranceMinutes: number = 5): boolean {
    const currentToken = token || this.getToken();
    if (!currentToken) return true;

    try {
      const payload = JSON.parse(atob(currentToken.split('.')[1]));
      const expTime = payload.exp;
      if (!expTime) return true;

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expTime - now;
      const toleranceSeconds = toleranceMinutes * 60;

      return timeUntilExpiry <= toleranceSeconds;
    } catch (error) {
      console.error('Erro ao verificar expiração do token:', error);
      return true;
    }
  }


  /**
   * Autenticação social com Google.
   */
  /**
   * Realiza o login usando a autenticação do Google
   * @returns Observable com os dados do usuário e token
   */
  loginWithGoogle(): Observable<{ token: string; user: User }> {
    return this.http.get<{ token: string }>('/api/v1/auth/google').pipe(
      tap((res) => {
        if (res?.token) {
          this.tokenManager.setTokens(res.token);
          const user = this.tokenManager.decodeToken(res.token);
          if (user) {
            this.stateManager.setAuthenticatedUser(user);
          } else {
            this.logIfEnabled('Falha ao decodificar token JWT do Google');
            this.clearAuthState();
            throw new Error('Token JWT inválido do Google');
          }
        } else {
          throw new Error('Falha na autenticação com Google');
        }
      }),
      map((res) => ({
        token: res.token,
        user: this.getCurrentUser() as User
      })),
      catchError(error => this.handleError('loginWithGoogle')(error))
    );
  }

  /**
   * Solicita recuperação de senha - retorna pergunta de segurança.
   * @param email Email do usuário
   */
  requestPasswordReset(email: string): Observable<{ email: string; security_question: string }> {
    return this.http.post<{ email: string; security_question: string }>('/api/v1/auth/password-reset/request', { email }).pipe(
      catchError(error => this.handleError('solicitação de recuperação de senha')(error))
    );
  }

  /**
   * Verifica resposta de segurança.
   * @param email Email do usuário
   * @param securityAnswer Resposta da pergunta de segurança
   */
  verifySecurityAnswer(email: string, securityAnswer: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/v1/auth/password-reset/verify', {
      email,
      security_answer: securityAnswer
    }).pipe(
      catchError(error => this.handleError('verificação de resposta de segurança')(error))
    );
  }

  /**
   * Completa a redefinição de senha.
   * @param email Email do usuário
   * @param securityAnswer Resposta da pergunta de segurança
   * @param newPassword Nova senha
   */
  completePasswordReset(email: string, securityAnswer: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/v1/auth/password-reset/complete', {
      email,
      security_answer: securityAnswer,
      new_password: newPassword
    }).pipe(
      catchError(error => this.handleError('redefinição de senha')(error))
    );
  }

  /**
   * Atualiza perfil do usuário autenticado.
   */
  /**
   * Atualiza o perfil do usuário autenticado
   * @param dados Dados do perfil a serem atualizados
   * @returns Observable com os dados atualizados do usuário e token
   */
  updateProfile(dados: { nome: string; email: string }): Observable<{ token: string; user: User }> {
    return this.http.put<{ token: string }>('/api/v1/auth/me', dados).pipe(
      tap((res) => {
        if (res?.token) {
          this.tokenManager.setTokens(res.token);
          const user = this.tokenManager.decodeToken(res.token);
          if (user) {
            this.stateManager.setAuthenticatedUser(user);
          } else {
            this.logIfEnabled('Falha ao decodificar token JWT após atualização');
            this.clearAuthState();
            throw new Error('Token JWT inválido após atualização');
          }
        } else {
          throw new Error('Resposta de atualização de perfil inválida');
        }
      }),
      map((res) => ({
        token: res.token,
        user: this.getCurrentUser() as User
      })),
      catchError(error => this.handleError('updateProfile')(error))
    );
  }

  /**
   * Tratamento de erros HTTP
   * @param operation Nome da operação que falhou
   */
  private handleError(operation = 'operação') {
    return (error: any): Observable<never> => {
      console.error(`${operation} falhou:`, error);

      let errorMessage = 'Ocorreu um erro inesperado';

      // Tratamento de erros HTTP
      if (error instanceof HttpErrorResponse) {
        // Erro da resposta HTTP (4xx, 5xx)
        const serverError = error.error as { message?: string; detail?: string } | undefined;
        const serverMessage = serverError?.message || serverError?.detail;

        if (serverMessage) {
          errorMessage = serverMessage;
        } else if (error.status === 0) {
          errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
        } else if (error.status === 401) {
          errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
          this.clearAuthState();
        } else if (error.status === 403) {
          errorMessage = 'Acesso negado. Você não tem permissão para acessar este recurso.';
        } else if (error.status === 404) {
          errorMessage = 'Recurso não encontrado.';
        } else if (error.status >= 500) {
          errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
        } else {
          errorMessage = `Erro ${error.status}: ${error.message || 'Erro desconhecido'}`;
        }
      } else if (error.error instanceof ErrorEvent) {
        // Erro do lado do cliente
        errorMessage = `Erro: ${error.error.message}`;
      } else if (error.message) {
        // Outros erros com mensagem
        errorMessage = error.message;
      }

      console.error(`[${operation}] ${errorMessage}`, error);

      // Retorna um erro observável com uma mensagem amigável
      return throwError(() => ({
        message: errorMessage,
        originalError: error,
        operation
      }));
    };
  }
}