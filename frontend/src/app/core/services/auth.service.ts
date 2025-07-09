import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { User } from '../../models/user.model';

/** Interface para resposta de autenticação */
interface AuthResponse {
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
  level?: number;
  roles?: string[];
  iat?: number;
  exp: number;
  avatar?: string;
  [key: string]: unknown;
}

/**
 * Serviço de autenticação JWT para login, logout e registro de usuários.
 * Gerencia o token JWT no localStorage e fornece métodos para verificar autenticação.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Chave usada para armazenar o token JWT no localStorage */
  private readonly TOKEN_KEY = 'jwt_token';
  
  /** Chave usada para armazenar o refresh token no localStorage */
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  
  /** Estado de autenticação atual */
  private authState = new BehaviorSubject<boolean>(false);
  
  /** Usuário atualmente autenticado */
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  
  /** Timer para renovação automática do token */
  private refreshTokenTimer: any = null;
  
  /** Tempo de tolerância para expiração do token (em segundos) */
  private readonly TOKEN_EXPIRATION_TOLERANCE = 60; // 1 minuto
  
  /** Headers padrão para requisições autenticadas */
  private get authHeaders(): { [header: string]: string } {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  constructor(private http: HttpClient) {
    this.initializeAuthState();
  }

  /**
   * Inicializa o estado de autenticação verificando o token armazenado
   * e configura a renovação automática do token se necessário
   * @returns Promise que resolve quando a inicialização for concluída
   */
  public initializeAuthState(): Promise<void> {
    const token = this.getToken();
    if (token && this.isTokenValid(token)) {
      try {
        const user = this.decodeToken(token);
        if (user) {
          this.currentUserSubject.next(user);
          this.authState.next(true);
          this.setupTokenRefresh(token);
          return Promise.resolve();
        }
      } catch (error) {
        console.error('Erro ao decodificar token:', error);
      }
    }
    // Se chegou aqui, limpa o estado de autenticação
    this.clearAuthState();
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
    
    const decoded = this.decodeToken(token);
    if (!decoded) return;
    
    // Usa o tempo de expiração do token ou um valor padrão (1 hora)
    const expTime = (decoded as unknown as { exp?: number }).exp || Math.floor(Date.now() / 1000) + 3600;
    
    // Calcula o tempo restante até a expiração (em ms)
    const expiresIn = (expTime * 1000) - Date.now();
    
    // Renova o token 1 minuto antes de expirar (ou imediatamente se faltar menos de 1 minuto)
    const refreshIn = Math.max(0, expiresIn - 60000);
    
    if (refreshIn > 0) {
      this.refreshTokenTimer = setTimeout(() => {
        this.refreshToken().subscribe({
          next: () => console.log('Token renovado com sucesso'),
          error: (err) => {
            console.error('Falha ao renovar token:', err);
            this.logout();
          }
        });
      }, refreshIn);
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
    console.log('[AuthService] Iniciando processo de login para:', email);
    return this.http.post<AuthResponse>('/api/v1/auth/login', { email, senha }).pipe(
      tap((response) => {
        console.log('[AuthService] Resposta do servidor:', response);
        if (response?.token) {
          console.log('[AuthService] Token recebido, configurando dados de autenticação...');
          this.setAuthData(response);
          const user = this.decodeToken(response.token);
          
          if (user) {
            console.log('[AuthService] Usuário decodificado com sucesso:', user);
            this.currentUserSubject.next(user);
            this.authState.next(true);
            this.setupTokenRefresh(response.token);
            
            // Verificar se o token foi salvo corretamente
            const savedToken = localStorage.getItem(this.TOKEN_KEY);
            console.log('[AuthService] Token salvo no localStorage:', savedToken ? 'Sim' : 'Não');
          } else {
            console.error('[AuthService] Falha ao decodificar token JWT');
            this.clearAuthState();
            throw new Error('Token JWT inválido');
          }
          
          // Atualiza o usuário com dados adicionais da resposta, se disponíveis
          if (response.user) {
            console.log('[AuthService] Atualizando dados adicionais do usuário:', response.user);
            this.currentUserSubject.next({ ...user, ...response.user });
          }
        } else {
          console.error('[AuthService] Resposta de login inválida - Token não encontrado');
          throw new Error('Resposta de login inválida');
        }
      }),
      map(() => ({
        token: this.getToken() || '',
        user: this.getCurrentUser() as User
      })),
      catchError(error => this.handleError('login')(error))
    );
  }
  
  /**
   * Atualiza os dados de autenticação no armazenamento local
   * @param authData Dados de autenticação
   */
  private setAuthData(authData: AuthResponse): void {
    if (authData.token) {
      localStorage.setItem(this.TOKEN_KEY, authData.token);
    }
    
    if (authData.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, authData.refreshToken);
    }
  }

  /**
   * Realiza logout do usuário.
   * @param notifyServer Se true, notifica o servidor sobre o logout
   */
  logout(notifyServer: boolean = true): void {
    if (notifyServer) {
      // Tenta notificar o servidor sobre o logout, mas não bloqueia o processo
      this.http.post('/api/auth/logout', {}, { 
        headers: { ...this.authHeaders },
        responseType: 'text'
      }).pipe(
        catchError(error => {
          console.error('Erro ao notificar logout no servidor:', error);
          return of(null);
        })
      ).subscribe();
    }
    
    this.clearAuthState();
  }

  /**
   * Limpa todos os dados de autenticação
   */
  private clearAuthState(): void {
    // Limpa os tokens
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    
    // Limpa o timer de renovação
    if (this.refreshTokenTimer) {
      clearTimeout(this.refreshTokenTimer);
      this.refreshTokenTimer = null;
    }
    
    // Atualiza o estado
    this.currentUserSubject.next(null);
    this.authState.next(false);
  }

  /**
   * Registra novo usuário e realiza login automático.
   * @param dados Dados de registro (nome, email, senha, contato)
   */
  register(dados: { name: string; email: string; password: string; contact?: string }): Observable<{token: string; user: User}> {
    return this.http.post<{token: string}>('/api/auth/register', dados).pipe(
      tap((res) => {
        if (res?.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          const user = this.decodeToken(res.token);
          if (user) {
            this.currentUserSubject.next(user);
            this.authState.next(true);
          } else {
            console.error('Falha ao decodificar token JWT após registro');
            this.clearAuthState();
            throw new Error('Token JWT inválido após registro');
          }
        } else {
          throw new Error('Resposta de registro inválida');
        }
      }),
      map((res: { token: string }) => ({
        token: res.token,
        user: this.getCurrentUser() as User
      })),
      catchError(error => this.handleError('registro')(error))
    );
  }

  /**
   * Verifica se o usuário está autenticado.
   */
  isAuthenticated(): boolean {
    return this.hasToken();
  }

  /**
   * Observable para mudanças de autenticação.
   */
  getAuthState(): Observable<boolean> {
    return this.authState.asObservable();
  }

  /**
   * Observable para o usuário atual
   */
  get currentUser$(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  /**
   * Retorna o token JWT atual.
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Decodifica o token JWT para obter as informações do usuário.
   * @param token Token JWT
   */
  /**
   * Verifica se um token JWT é válido
   * @param token Token JWT a ser validado
   * @returns true se o token for válido, false caso contrário
   */
  private isTokenValid(token: string): boolean {
    if (!token) return false;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Token JWT inválido: formato incorreto');
        return false;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Verifica se o token expirou (com tolerância)
      if (payload.exp && payload.exp < (currentTime - this.TOKEN_EXPIRATION_TOLERANCE)) {
        console.warn('Token JWT expirado');
        return false;
      }
      
      // Verifica se o token contém um ID de usuário
      if (!payload.sub && !payload.id) {
        console.error('Token JWT inválido: sem ID de usuário');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao validar token JWT:', error);
      return false;
    }
  }

  /**
   * Decodifica um token JWT e retorna as informações do usuário
   * @param token Token JWT a ser decodificado
   * @returns Objeto User ou null se o token for inválido
   */
  private decodeToken(token: string): User | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Token JWT inválido: formato incorreto');
        return null;
      }

      const payload: DecodedToken = JSON.parse(atob(parts[1]));
      
      // Validações do payload
      if (!payload || typeof payload !== 'object') {
        console.error('Token JWT inválido: payload inválido');
        return null;
      }
      
      // Valida campos obrigatórios
      if (!payload.sub && !payload.id) {
        console.error('Token JWT inválido: ID do usuário não encontrado');
        return null;
      }
      
      // Cria o objeto de usuário com valores padrão seguros
      const user: User = {
        id: payload.sub || payload.id || '',
        name: payload.name || 'Usuário',
        firstName: payload.firstName || payload.name?.split(' ')[0] || 'Usuário',
        email: payload.email || '',
        level: typeof payload.level === 'number' ? Math.max(1, payload.level) : 1,
        // Adiciona propriedades adicionais do payload, se existirem
        ...(payload['avatar'] && { avatar: String(payload['avatar']) }),
        roles: Array.isArray(payload['roles']) ? payload['roles'] : []
      };
      
      return user;
      
    } catch (error) {
      console.error('Erro ao decodificar token JWT:', error);
      return null;
    }
  }

  /**
   * Verifica se há token salvo.
   */
  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Retorna os dados do usuário autenticado a partir do JWT.
   * Se o token for inválido ou expirado, limpa o estado de autenticação.
   * @param forceRefresh Se true, força a renovação do token antes de retornar o usuário
   * @returns Dados do usuário ou null se não estiver autenticado
   */
  getCurrentUser(forceRefresh: boolean = false): User | null {
    // Se forçado a atualizar e tivermos um refresh token, tenta renovar
    if (forceRefresh && this.getRefreshToken()) {
      this.refreshToken().subscribe({
        next: () => console.log('Token renovado com sucesso'),
        error: (err) => {
          console.error('Falha ao renovar token:', err);
          this.logout();
        }
      });
    }
    
    const token = this.getToken();
    if (!token) {
      return null;
    }
    
    // Se o token estiver inválido, tenta renovar se possível
    if (!this.isTokenValid(token) && this.getRefreshToken()) {
      this.refreshToken().subscribe({
        next: () => console.log('Token renovado com sucesso'),
        error: (err) => {
          console.error('Falha ao renovar token:', err);
          this.logout();
        }
      });
      return this.currentUserSubject.value; // Retorna o usuário atual enquanto renova
    }
    
    try {
      const user = this.decodeToken(token);
      if (user) {
        // Atualiza o usuário atual se for diferente
        const currentUser = this.currentUserSubject.value;
        if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
          this.currentUserSubject.next(user);
        }
        return user;
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      this.clearAuthState();
      return null;
    }
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
    
    return this.http.post<AuthResponse>('/api/auth/refresh-token', { 
      refreshToken 
    }).pipe(
      tap(response => {
        if (response?.token) {
          this.setAuthData(response);
          const user = this.decodeToken(response.token);
          
          if (user) {
            this.currentUserSubject.next(user);
            this.authState.next(true);
            this.setupTokenRefresh(response.token);
          } else {
            throw new Error('Token JWT inválido após renovação');
          }
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
   * Obtém o refresh token armazenado
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }


  /**
   * Autenticação social com Google.
   */
  /**
   * Realiza o login usando a autenticação do Google
   * @returns Observable com os dados do usuário e token
   */
  loginWithGoogle(): Observable<{ token: string; user: User }> {
    return this.http.get<{ token: string }>('/api/auth/google').pipe(
      tap((res) => {
        if (res?.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          const user = this.decodeToken(res.token);
          if (user) {
            this.currentUserSubject.next(user);
            this.authState.next(true);
          } else {
            console.error('Falha ao decodificar token JWT do Google');
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
   * Atualiza perfil do usuário autenticado.
   */
  /**
   * Atualiza o perfil do usuário autenticado
   * @param dados Dados do perfil a serem atualizados
   * @returns Observable com os dados atualizados do usuário e token
   */
  updateProfile(dados: { nome: string; email: string }): Observable<{ token: string; user: User }> {
    return this.http.put<{ token: string }>('/api/auth/profile', dados).pipe(
      tap((res) => {
        if (res?.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          const user = this.decodeToken(res.token);
          if (user) {
            this.currentUserSubject.next(user);
            this.authState.next(true);
          } else {
            console.error('Falha ao decodificar token JWT após atualização');
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