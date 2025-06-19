// 📳 Haptic Feedback Service
// Serviço para feedback tátil em dispositivos móveis

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HapticFeedbackService {

  constructor() {}

  /**
   * Verifica se feedback háptico está disponível
   */
  private isAvailable(): boolean {
    return !!(navigator as any).vibrate || !!(window as any).Capacitor;
  }

  /**
   * Vibração leve para interações gerais
   */
  async light(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      // Capacitor Haptics (se disponível)
      if ((window as any).Capacitor) {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Light });
        return;
      }

      // Web Vibration API (fallback)
      if ((navigator as any).vibrate) {
        (navigator as any).vibrate(25);
      }
    } catch (error) {
      console.log('Haptic feedback não disponível:', error);
    }
  }

  /**
   * Vibração média para confirmações
   */
  async medium(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      if ((window as any).Capacitor) {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Medium });
        return;
      }

      if ((navigator as any).vibrate) {
        (navigator as any).vibrate(50);
      }
    } catch (error) {
      console.log('Haptic feedback não disponível:', error);
    }
  }

  /**
   * Vibração forte para ações importantes
   */
  async heavy(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      if ((window as any).Capacitor) {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Heavy });
        return;
      }

      if ((navigator as any).vibrate) {
        (navigator as any).vibrate(100);
      }
    } catch (error) {
      console.log('Haptic feedback não disponível:', error);
    }
  }

  /**
   * Vibração para sucesso
   */
  async success(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      if ((window as any).Capacitor) {
        const { Haptics, NotificationType } = await import('@capacitor/haptics');
        await Haptics.notification({ type: NotificationType.Success });
        return;
      }

      // Padrão de vibração para sucesso: curto-pausa-curto
      if ((navigator as any).vibrate) {
        (navigator as any).vibrate([50, 50, 50]);
      }
    } catch (error) {
      console.log('Haptic feedback não disponível:', error);
    }
  }

  /**
   * Vibração para erro
   */
  async error(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      if ((window as any).Capacitor) {
        const { Haptics, NotificationType } = await import('@capacitor/haptics');
        await Haptics.notification({ type: NotificationType.Error });
        return;
      }

      // Padrão de vibração para erro: longo-pausa-longo
      if ((navigator as any).vibrate) {
        (navigator as any).vibrate([100, 50, 100]);
      }
    } catch (error) {
      console.log('Haptic feedback não disponível:', error);
    }
  }

  /**
   * Vibração para aviso
   */
  async warning(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      if ((window as any).Capacitor) {
        const { Haptics, NotificationType } = await import('@capacitor/haptics');
        await Haptics.notification({ type: NotificationType.Warning });
        return;
      }

      // Padrão de vibração para aviso: médio-pausa-médio-pausa-médio
      if ((navigator as any).vibrate) {
        (navigator as any).vibrate([75, 25, 75, 25, 75]);
      }
    } catch (error) {
      console.log('Haptic feedback não disponível:', error);
    }
  }

  /**
   * Vibração customizada
   */
  async custom(pattern: number[]): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      if ((navigator as any).vibrate) {
        (navigator as any).vibrate(pattern);
      }
    } catch (error) {
      console.log('Haptic feedback não disponível:', error);
    }
  }

  /**
   * Seleção - vibração para navegação/seleção
   */
  async selection(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      if ((window as any).Capacitor) {
        const { Haptics } = await import('@capacitor/haptics');
        await Haptics.selectionStart();
        setTimeout(async () => {
          await Haptics.selectionEnd();
        }, 10);
        return;
      }

      if ((navigator as any).vibrate) {
        (navigator as any).vibrate(15);
      }
    } catch (error) {
      console.log('Haptic feedback não disponível:', error);
    }
  }

  /**
   * Para interações com Pokémon (pattern temático)
   */
  async pokemonCapture(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      // Padrão temático: simulando uma pokeball sendo arremessada
      // curto-pausa-curto-pausa-longo (arremesso-bounce-captura)
      if ((navigator as any).vibrate) {
        (navigator as any).vibrate([30, 100, 30, 100, 150]);
      }
    } catch (error) {
      console.log('Haptic feedback não disponível:', error);
    }
  }

  /**
   * Para favoritar Pokémon
   */
  async pokemonFavorite(): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      // Padrão suave para favoritar
      if ((navigator as any).vibrate) {
        (navigator as any).vibrate([25, 25, 50]);
      }
    } catch (error) {
      console.log('Haptic feedback não disponível:', error);
    }
  }
}
