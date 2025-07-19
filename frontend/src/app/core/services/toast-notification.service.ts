import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastConfig {
  message: string;
  messageKey?: string;
  messageParams?: any;
  type: 'success' | 'error' | 'warning' | 'info' | 'primary';
  duration?: number;
  position?: 'top' | 'bottom' | 'middle';
  showCloseButton?: boolean;
  icon?: string;
  translucent?: boolean;
  animated?: boolean;
  cssClass?: string;
}

export interface ToastStats {
  totalShown: number;
  byType: { [key: string]: number };
  averageDuration: number;
  lastShown: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class ToastNotificationService {
  private stats: ToastStats = {
    totalShown: 0,
    byType: {},
    averageDuration: 0,
    lastShown: null
  };

  private activeToasts: HTMLIonToastElement[] = [];
  private toastQueue: ToastConfig[] = [];
  private isProcessingQueue = false;
  private maxConcurrentToasts = 3;

  // Subject para estatísticas
  private statsSubject = new BehaviorSubject<ToastStats>(this.stats);
  public stats$ = this.statsSubject.asObservable();

  constructor(
    private toastController: ToastController,
    private translate: TranslateService
  ) {
    // ✅ CLEANUP: Log de inicialização removido - serviço estável
    // console.log('🍞 ToastNotificationService inicializado');
  }

  /**
   * Exibe um toast de sucesso
   */
  async showSuccess(messageKey: string, messageParams?: any, duration: number = 3000): Promise<void> {
    await this.showToast({
      messageKey,
      messageParams,
      message: '',
      type: 'success',
      duration,
      icon: 'checkmark-circle-outline'
    });
  }

  /**
   * Exibe um toast de erro
   */
  async showError(messageKey: string, messageParams?: any, duration: number = 4000): Promise<void> {
    await this.showToast({
      messageKey,
      messageParams,
      message: '',
      type: 'error',
      duration,
      icon: 'alert-circle-outline'
    });
  }

  /**
   * Exibe um toast de aviso
   */
  async showWarning(messageKey: string, messageParams?: any, duration: number = 3500): Promise<void> {
    await this.showToast({
      messageKey,
      messageParams,
      message: '',
      type: 'warning',
      duration,
      icon: 'warning-outline'
    });
  }

  /**
   * Exibe um toast informativo
   */
  async showInfo(messageKey: string, messageParams?: any, duration: number = 3000): Promise<void> {
    await this.showToast({
      messageKey,
      messageParams,
      message: '',
      type: 'info',
      duration,
      icon: 'information-circle-outline'
    });
  }

  /**
   * Exibe um toast de captura de Pokémon
   */
  async showPokemonCaptured(pokemonName: string): Promise<void> {
    await this.showToast({
      messageKey: 'pokemon.captured_success',
      messageParams: { name: pokemonName },
      message: '',
      type: 'success',
      duration: 3500,
      icon: 'radio-button-on', // Ícone de pokébola fechada
      cssClass: 'pokemon-capture-toast success-toast'
    });
  }

  /**
   * Exibe um toast de liberação de Pokémon
   */
  async showPokemonReleased(pokemonName: string): Promise<void> {
    await this.showToast({
      messageKey: 'pokemon.released_success',
      messageParams: { name: pokemonName },
      message: '',
      type: 'info',
      duration: 3500,
      icon: 'radio-button-off', // Ícone de pokébola aberta
      cssClass: 'pokemon-release-toast info-toast'
    });
  }

  /**
   * Exibe um toast de autenticação
   */
  async showAuthSuccess(messageKey: string): Promise<void> {
    await this.showToast({
      messageKey,
      message: '',
      type: 'success',
      duration: 2500,
      icon: 'person-circle-outline',
      cssClass: 'auth-toast'
    });
  }

  /**
   * Exibe um toast personalizado
   */
  async showCustom(config: ToastConfig): Promise<void> {
    await this.showToast(config);
  }

  /**
   * Método principal para exibir toasts
   */
  private async showToast(config: ToastConfig): Promise<void> {
    // Adicionar à fila se há muitos toasts ativos
    if (this.activeToasts.length >= this.maxConcurrentToasts) {
      this.toastQueue.push(config);
      console.log(`🍞 Toast adicionado à fila. Fila atual: ${this.toastQueue.length}`);
      return;
    }

    try {
      // Obter mensagem traduzida
      let message = config.message;
      if (config.messageKey) {
        message = await this.translate.get(config.messageKey, config.messageParams).toPromise();
      }

      // Configurações padrão
      const defaultConfig = {
        duration: 3000,
        position: 'top' as const,
        showCloseButton: true,
        translucent: false,
        animated: true
      };

      const finalConfig = { ...defaultConfig, ...config };

      // Criar toast
      const toast = await this.toastController.create({
        message,
        duration: finalConfig.duration,
        position: finalConfig.position,
        color: this.getToastColor(finalConfig.type),
        translucent: finalConfig.translucent,
        animated: finalConfig.animated,
        cssClass: this.buildCssClass(finalConfig),
        buttons: finalConfig.showCloseButton ? [
          {
            icon: 'close',
            role: 'cancel',
            handler: () => {
              console.log('🍞 Toast fechado pelo usuário');
            }
          }
        ] : undefined
      });

      // Adicionar à lista de toasts ativos
      this.activeToasts.push(toast);

      // Configurar remoção automática
      toast.onDidDismiss().then(() => {
        this.removeFromActiveToasts(toast);
        this.processQueue();
      });

      // Apresentar toast
      await toast.present();

      // Atualizar estatísticas
      this.updateStats(finalConfig.type, finalConfig.duration || 3000);

      // ✅ CLEANUP: Log de toast removido - funcionalidade estável
      // console.log(`🍞 Toast exibido: ${finalConfig.type} - "${message}"`);

    } catch (error) {
      console.error('🍞 Erro ao exibir toast:', error);
    }
  }

  /**
   * Processa a fila de toasts
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.toastQueue.length === 0) {
      return;
    }

    if (this.activeToasts.length < this.maxConcurrentToasts) {
      this.isProcessingQueue = true;
      const nextToast = this.toastQueue.shift();

      if (nextToast) {
        // ✅ CLEANUP: Log de fila removido - funcionalidade estável
        // console.log(`🍞 Processando toast da fila. Restantes: ${this.toastQueue.length}`);
        await this.showToast(nextToast);
      }

      this.isProcessingQueue = false;
    }
  }

  /**
   * Remove toast da lista de ativos
   */
  private removeFromActiveToasts(toast: HTMLIonToastElement): void {
    const index = this.activeToasts.indexOf(toast);
    if (index > -1) {
      this.activeToasts.splice(index, 1);
      console.log(`🍞 Toast removido. Ativos: ${this.activeToasts.length}`);
    }
  }

  /**
   * Obtém a cor do toast baseada no tipo
   */
  private getToastColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      success: 'success',
      error: 'danger',
      warning: 'warning',
      info: 'primary',
      primary: 'primary'
    };
    return colorMap[type] || 'primary';
  }

  /**
   * Constrói classes CSS para o toast
   */
  private buildCssClass(config: ToastConfig): string {
    const classes = ['smart-toast', `toast-${config.type}`];

    if (config.icon) {
      classes.push('toast-with-icon');
    }

    if (config.cssClass) {
      classes.push(config.cssClass);
    }

    return classes.join(' ');
  }

  /**
   * Atualiza estatísticas
   */
  private updateStats(type: string, duration: number): void {
    this.stats.totalShown++;
    this.stats.byType[type] = (this.stats.byType[type] || 0) + 1;
    this.stats.lastShown = new Date();

    // Calcular duração média
    const totalDuration = (this.stats.averageDuration * (this.stats.totalShown - 1)) + duration;
    this.stats.averageDuration = Math.round(totalDuration / this.stats.totalShown);

    this.statsSubject.next({ ...this.stats });
  }

  /**
   * Fecha todos os toasts ativos
   */
  async dismissAll(): Promise<void> {
    console.log(`🍞 Fechando ${this.activeToasts.length} toasts ativos`);

    const dismissPromises = this.activeToasts.map(toast => toast.dismiss());
    await Promise.all(dismissPromises);

    this.activeToasts = [];
    this.toastQueue = [];
  }

  /**
   * Obtém estatísticas atuais
   */
  getStats(): ToastStats {
    return { ...this.stats };
  }

  /**
   * Limpa estatísticas
   */
  clearStats(): void {
    this.stats = {
      totalShown: 0,
      byType: {},
      averageDuration: 0,
      lastShown: null
    };
    this.statsSubject.next({ ...this.stats });
    console.log('🍞 Estatísticas de toast limpas');
  }

  /**
   * Obtém número de toasts na fila
   */
  getQueueLength(): number {
    return this.toastQueue.length;
  }

  /**
   * Obtém número de toasts ativos
   */
  getActiveCount(): number {
    return this.activeToasts.length;
  }
}
