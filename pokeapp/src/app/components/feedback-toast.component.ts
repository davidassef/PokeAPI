// 🎯 Feedback Toast Component
// Sistema de feedback visual avançado com animações e design moderno

import { Component, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { HapticFeedbackService } from '../services/haptic-feedback.service';

export interface ToastConfig {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'pokemon';
  duration?: number;
  position?: 'top' | 'middle' | 'bottom';
  showCloseButton?: boolean;
  icon?: string;
  hapticFeedback?: boolean;
  actionButton?: {
    text: string;
    handler: () => void;
  };
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackToastService {

  constructor(
    private toastController: ToastController,
    private hapticService: HapticFeedbackService,
  ) {}

  /**
   * Exibe toast de sucesso com feedback háptico
   */
  async showSuccess(message: string, actionButton?: ToastConfig['actionButton']): Promise<void> {
    await this.showToast({
      message,
      type: 'success',
      duration: 3000,
      position: 'top',
      icon: 'checkmark-circle',
      hapticFeedback: true,
      actionButton,
    });
  }

  /**
   * Exibe toast de erro com feedback háptico
   */
  async showError(message: string): Promise<void> {
    await this.showToast({
      message,
      type: 'error',
      duration: 4000,
      position: 'top',
      showCloseButton: true,
      icon: 'alert-circle',
      hapticFeedback: true,
    });
  }

  /**
   * Exibe toast de aviso
   */
  async showWarning(message: string): Promise<void> {
    await this.showToast({
      message,
      type: 'warning',
      duration: 3500,
      position: 'top',
      icon: 'warning',
      hapticFeedback: true,
    });
  }

  /**
   * Exibe toast de informação
   */
  async showInfo(message: string): Promise<void> {
    await this.showToast({
      message,
      type: 'info',
      duration: 3000,
      position: 'top',
      icon: 'information-circle',
    });
  }

  /**
   * Exibe toast temático Pokémon
   */
  async showPokemonToast(message: string, actionButton?: ToastConfig['actionButton']): Promise<void> {
    await this.showToast({
      message,
      type: 'pokemon',
      duration: 3500,
      position: 'top',
      icon: 'heart',
      hapticFeedback: true,
      actionButton,
    });
  }

  /**
   * Exibe toast de loading com spinner
   */
  async showLoading(message: string = 'Carregando...'): Promise<HTMLIonToastElement> {
    const toast = await this.toastController.create({
      message,
      duration: 0, // Não desaparece automaticamente
      position: 'top',
      cssClass: 'toast-loading',
      translucent: true,
      animated: true,
      buttons: [
        {
          icon: 'refresh',
          side: 'start',
          handler: () => false, // Não fecha o toast
        },
      ],
    });

    await toast.present();
    return toast;
  }

  /**
   * Exibe toast personalizado com animações avançadas
   */
  private async showToast(config: ToastConfig): Promise<void> {
    // Feedback háptico se habilitado
    if (config.hapticFeedback) {
      switch (config.type) {
        case 'success':
          await this.hapticService.success();
          break;
        case 'error':
          await this.hapticService.error();
          break;
        case 'warning':
          await this.hapticService.warning();
          break;
        default:
          await this.hapticService.light();
      }
    }

    // Botões do toast
    const buttons: any[] = [];

    if (config.actionButton) {
      buttons.push({
        text: config.actionButton.text,
        handler: config.actionButton.handler,
      });
    }

    if (config.showCloseButton) {
      buttons.push({
        icon: 'close',
        side: 'end',
        role: 'cancel',
        handler: () => true,
      });
    }

    const toast = await this.toastController.create({
      message: this.formatMessage(config.message, config.icon),
      duration: config.duration || 3000,
      position: config.position || 'top',
      cssClass: [
        `toast-${config.type}`,
        'toast-modern',
        config.hapticFeedback ? 'toast-haptic' : '',
      ].filter(Boolean),
      buttons: buttons.length > 0 ? buttons : undefined,
      translucent: true,
      animated: true,
      mode: 'ios', // Design mais moderno
      swipeGesture: 'vertical',
    });

    await toast.present();

    // Auto-dismiss após animação se não for um toast persistente
    if (config.duration && config.duration > 0) {
      setTimeout(() => {
        toast.dismiss();
      }, config.duration);
    }
  }

  /**
   * Formata mensagem com ícone
   */
  private formatMessage(message: string, icon?: string): string {
    if (!icon) return message;

    const iconMap: Record<string, string> = {
      'checkmark-circle': '✅',
      'alert-circle': '❌',
      'warning': '⚠️',
      'information-circle': 'ℹ️',
      'heart': '❤️',
    };

    const emoji = iconMap[icon] || '';
    return emoji ? `${emoji} ${message}` : message;
  }

  /**
   * Fecha todos os toasts ativos
   */
  async dismissAll(): Promise<void> {
    try {
      let activeToast = await this.toastController.getTop();
      while (activeToast) {
        await activeToast.dismiss();
        activeToast = await this.toastController.getTop();
      }
    } catch (error) {
      console.log('Erro ao fechar toasts:', error);
    }
  }

  /**
   * Exibe toast de atualização da app
   */
  async showUpdateAvailable(): Promise<void> {
    await this.showToast({
      message: 'Nova versão disponível!',
      type: 'info',
      duration: 0, // Persistente
      position: 'bottom',
      showCloseButton: true,
      actionButton: {
        text: 'Atualizar',
        handler: () => {
          window.location.reload();
        },
      },
    });
  }

  /**
   * Exibe toast de conectividade
   */
  async showOfflineStatus(isOnline: boolean): Promise<void> {
    await this.showToast({
      message: isOnline ? 'Conexão restaurada' : 'Sem conexão com a internet',
      type: isOnline ? 'success' : 'warning',
      duration: isOnline ? 2000 : 0,
      position: 'bottom',
      icon: isOnline ? 'wifi' : 'wifi-off',
      showCloseButton: !isOnline,
    });
  }
}
