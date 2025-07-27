import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './auth.service';
import { Subscription } from 'rxjs';
import { filter, distinctUntilChanged, pairwise, startWith } from 'rxjs/operators';

/**
 * Serviço global para gerenciar atualização automática única após autenticação
 * 
 * Funcionalidades:
 * - Detecta mudança de estado de autenticação (não autenticado → autenticado)
 * - Executa refresh automático UMA VEZ após login/registro
 * - Exibe toast de sucesso de login
 * - Funciona em qualquer página da aplicação
 * - Previne loops de atualização
 */
@Injectable({
  providedIn: 'root'
})
export class PostAuthRefreshService {
  private authStateSubscription?: Subscription;
  private hasRefreshedAfterLogin = false;
  private lastAuthState = false;
  private isInitialized = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private translate: TranslateService
  ) {
    console.log('[PostAuthRefreshService] Serviço inicializado');
  }

  /**
   * Inicializa o monitoramento de mudanças de autenticação
   * Deve ser chamado no AppComponent ou no serviço principal
   */
  initialize(): void {
    if (this.isInitialized) {
      console.log('[PostAuthRefreshService] Já inicializado, ignorando');
      return;
    }

    console.log('[PostAuthRefreshService] Iniciando monitoramento de autenticação');
    this.isInitialized = true;

    // Obter estado inicial
    this.lastAuthState = this.authService.isAuthenticated();
    console.log('[PostAuthRefreshService] Estado inicial de autenticação:', this.lastAuthState);

    // Monitorar mudanças de estado de autenticação
    this.authStateSubscription = this.authService.getAuthState().pipe(
      startWith(this.lastAuthState), // Começar com o estado atual
      distinctUntilChanged(), // Só emitir quando o estado realmente mudar
      pairwise() // Obter [estadoAnterior, estadoAtual]
    ).subscribe(([previousState, currentState]) => {
      console.log('[PostAuthRefreshService] Mudança de estado detectada:', {
        anterior: previousState,
        atual: currentState,
        jaAtualizou: this.hasRefreshedAfterLogin
      });

      // Detectar transição de não autenticado para autenticado
      if (!previousState && currentState && !this.hasRefreshedAfterLogin) {
        console.log('[PostAuthRefreshService] 🎯 Login detectado - executando atualização única');
        this.executePostLoginRefresh();
      }

      // Resetar flag quando usuário faz logout
      if (previousState && !currentState) {
        console.log('[PostAuthRefreshService] 🔄 Logout detectado - resetando flag');
        this.resetRefreshFlag();
      }

      this.lastAuthState = currentState;
    });
  }

  /**
   * Executa a atualização automática após login
   */
  private async executePostLoginRefresh(): Promise<void> {
    try {
      console.log('[PostAuthRefreshService] 🚀 Iniciando atualização pós-login');
      
      // Marcar que já foi executado para evitar loops
      this.hasRefreshedAfterLogin = true;

      // 1. Exibir toast de sucesso de login
      await this.showLoginSuccessToast();

      // 2. Aguardar um breve momento para o toast aparecer
      await this.delay(500);

      // 3. Executar refresh discreto da página atual
      await this.performDiscreteRefresh();

      console.log('[PostAuthRefreshService] ✅ Atualização pós-login concluída');

    } catch (error) {
      console.error('[PostAuthRefreshService] ❌ Erro na atualização pós-login:', error);
    }
  }

  /**
   * Exibe toast de sucesso de login
   */
  private async showLoginSuccessToast(): Promise<void> {
    try {
      const message = await this.translate.get('auth.login_success').toPromise() || 'Login realizado com sucesso!';
      
      const toast = await this.toastController.create({
        message,
        duration: 3000,
        position: 'top',
        color: 'success',
        buttons: [{
          icon: 'close',
          role: 'cancel'
        }]
      });

      await toast.present();
      console.log('[PostAuthRefreshService] 📱 Toast de sucesso exibido');

    } catch (error) {
      console.error('[PostAuthRefreshService] ❌ Erro ao exibir toast:', error);
    }
  }

  /**
   * Executa refresh discreto da página atual
   */
  private async performDiscreteRefresh(): Promise<void> {
    try {
      const currentUrl = this.router.url;
      console.log('[PostAuthRefreshService] 🔄 Executando refresh discreto da página:', currentUrl);

      // Opção 1: Usar router para recarregar a rota atual (mais suave)
      await this.router.navigateByUrl('/', { skipLocationChange: true })
        .then(() => this.router.navigate([currentUrl]));

      console.log('[PostAuthRefreshService] ✅ Refresh discreto concluído');

    } catch (error) {
      console.warn('[PostAuthRefreshService] ⚠️ Fallback para window.location.reload()');
      
      // Fallback: Reload completo da página
      window.location.reload();
    }
  }

  /**
   * Reseta a flag de atualização (chamado no logout)
   */
  private resetRefreshFlag(): void {
    this.hasRefreshedAfterLogin = false;
    console.log('[PostAuthRefreshService] 🔄 Flag de atualização resetada');
  }

  /**
   * Utilitário para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Força reset da flag (para casos especiais)
   */
  public forceResetFlag(): void {
    console.log('[PostAuthRefreshService] 🔧 Reset forçado da flag');
    this.resetRefreshFlag();
  }

  /**
   * Verifica se já foi executada a atualização
   */
  public hasAlreadyRefreshed(): boolean {
    return this.hasRefreshedAfterLogin;
  }

  /**
   * Obtém status do serviço para debug
   */
  public getStatus(): {
    initialized: boolean;
    hasRefreshed: boolean;
    lastAuthState: boolean;
    currentAuthState: boolean;
  } {
    return {
      initialized: this.isInitialized,
      hasRefreshed: this.hasRefreshedAfterLogin,
      lastAuthState: this.lastAuthState,
      currentAuthState: this.authService.isAuthenticated()
    };
  }

  /**
   * Limpa recursos quando o serviço é destruído
   */
  destroy(): void {
    if (this.authStateSubscription) {
      this.authStateSubscription.unsubscribe();
      console.log('[PostAuthRefreshService] 🧹 Recursos limpos');
    }
  }
}
