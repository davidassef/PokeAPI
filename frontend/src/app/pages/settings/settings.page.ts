import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActionSheetController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { AppSettings } from '../../models/app.model';
import { SettingsService } from '../../core/services/settings.service';
import { AudioService, AudioState } from '../../core/services/audio.service';
import { FavoritesService } from '../../core/services/favorites.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit, OnDestroy {
  loading = false;
  settings: AppSettings = {
    language: 'pt-BR',
    theme: 'light',
    darkMode: false,
    musicEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    pokemonPerPage: 20,
    showShinyChance: true,
    autoPlayMusic: false
  };

  audioState: AudioState = {
    isPlaying: false,
    currentTrack: null,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isLoading: false
  };

  languages = [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Español (España)', flag: '🇪🇸' }
  ];

  pokemonPerPageOptions = [10, 20, 30, 50, 100];

  private destroy$ = new Subject<void>();

  constructor(
    private settingsService: SettingsService,
    private translate: TranslateService,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private audioService: AudioService,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit() {
    this.loadSettings();
    this.audioService.audioState$.pipe(takeUntil(this.destroy$)).subscribe(state => {
      this.audioState = { ...state };
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carrega configurações salvas
   */
  private loadSettings() {
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.settings = { ...settings };
      });
  }

  /**
   * Obtém nome do idioma atual
   */
  getCurrentLanguageName(): string {
    const lang = this.languages.find(l => l.code === this.settings.language);
    return lang ? `${lang.flag} ${lang.name}` : this.settings.language;
  }

  /**
   * Abre modal para seleção de idioma
   */
  async openLanguageModal() {
    const actionSheet = await this.actionSheetController.create({
      header: await this.translate.get('SETTINGS.SELECT_LANGUAGE').toPromise(),
      buttons: [
        ...this.languages.map(lang => ({
          text: `${lang.flag} ${lang.name}`,
          handler: () => this.changeLanguage(lang.code as any)
        })),
        {
          text: await this.translate.get('CANCEL').toPromise(),
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  /**
   * Altera idioma
   */
  async changeLanguage(language: 'pt-BR' | 'en-US' | 'es-ES') {
    try {
      await this.settingsService.updateLanguage(language);
      this.settings.language = language;
      this.showToast('SETTINGS.LANGUAGE_UPDATED');
    } catch (error) {
      console.error('Erro ao alterar idioma:', error);
    }
  }

  /**
   * Altera tema
   */
  async onThemeChange() {
    try {
      await this.settingsService.updateTheme(this.settings.darkMode ? 'dark' : 'light');
      this.showToast('SETTINGS.THEME_UPDATED');
    } catch (error) {
      console.error('Erro ao alterar tema:', error);
    }
  }

  onSettingChange(setting: keyof AppSettings, value: any) {
    this.settingsService.saveSettings({ [setting]: value });
  }

  selectTrack() {
    // Exemplo: seleciona próxima faixa
    const tracks = this.audioService.getAvailableTracks();
    const current = this.audioState.currentTrack;
    let idx = tracks.findIndex(t => t.id === current?.id);
    idx = (idx + 1) % tracks.length;
    this.audioService.loadTrack(tracks[idx].id);
  }

  togglePlayPause() {
    this.audioService.togglePlayPause();
  }

  onVolumeChange(event: any) {
    const value = event.detail?.value ?? event;
    this.audioService.setVolume(value / 100);
  }

  formatTime(seconds: number): string {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  exportFavorites() {
    const data = this.favoritesService.exportFavorites();
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'favorites.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async importFavorites() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      await this.favoritesService.importFavorites(text);
      this.showToast('FAVORITES.IMPORTED');
    };
    input.click();
  }

  clearAllFavorites() {
    this.favoritesService.clearAllFavorites();
    this.showToast('FAVORITES.CLEARED');
  }

  async exportSettings() {
    const data = await this.settingsService.exportSettings();
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settings.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      await this.settingsService.importSettings(text);
      this.showToast('SETTINGS.IMPORTED');
    };
    input.click();
  }

  async resetSettings() {
    await this.settingsService.resetSettings();
    this.showToast('SETTINGS.RESET');
  }

  showAbout() {
    alert('PokéAPIApp\nDesenvolvido com Angular + Ionic.\nPowered by PokéAPI.');
  }

  /**
   * Exibe toast de confirmação
   */
  private async showToast(messageKey: string) {
    const message = await this.translate.get(messageKey).toPromise();
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }
}
