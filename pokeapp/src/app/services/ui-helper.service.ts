import { Injectable } from '@angular/core';
import { ToastController, LoadingController } from '@ionic/angular';
import { ToastOptions, LoadingOptions } from '../interfaces/ui.interfaces';
import { TOAST_CONFIG } from '../constants/app.constants';

/**
 * Serviço helper para operações comuns de UI
 * Centraliza lógica repetitiva seguindo DRY principle
 */
@Injectable({
  providedIn: 'root',
})
export class UiHelperService {

  constructor(
    private toastController: ToastController,
    private loadingController: LoadingController,
  ) {}

  /**
   * Exibe toast com configurações padrão
   */
  async showToast(options: ToastOptions): Promise<void> {
    const toast = await this.toastController.create({
      message: options.message,
      duration: options.duration ?? TOAST_CONFIG.DURATION,
      color: options.color ?? TOAST_CONFIG.SUCCESS_COLOR,
      position: options.position ?? TOAST_CONFIG.POSITION,
    });
    await toast.present();
  }

  /**
   * Exibe toast de sucesso
   */
  async showSuccessToast(message: string): Promise<void> {
    await this.showToast({
      message,
      color: 'success',
    });
  }

  /**
   * Exibe toast de erro
   */
  async showErrorToast(message: string): Promise<void> {
    await this.showToast({
      message,
      color: 'danger',
    });
  }

  /**
   * Cria e exibe loading
   */
  async showLoading(options?: LoadingOptions): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({
      message: options?.message ?? 'Carregando...',
      spinner: options?.spinner ?? 'circles',
      duration: options?.duration,
    });
    await loading.present();
    return loading;
  }

  /**
   * Dismisses all active loadings
   */
  async dismissLoading(): Promise<void> {
    try {
      await this.loadingController.dismiss();
    } catch (error) {
      // Ignora erro se não há loading ativo
    }
  }

  /**
   * Formata nome com primeira letra maiúscula
   */
  formatName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /**
   * Extrai ID do Pokémon a partir da URL
   */
  extractPokemonId(url: string): number {
    const matches = url.match(/\/pokemon\/(\d+)\//);
    return matches ? parseInt(matches[1], 10) : 0;
  }

  /**
   * Constrói URL da imagem oficial do Pokémon
   */
  getPokemonImageUrl(id: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }

  /**
   * Debounce function para evitar calls excessivos
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }
}
