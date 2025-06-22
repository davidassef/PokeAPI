import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController, ToastController, ActionSheetController } from '@ionic/angular';
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
  settings: AppSettings = {
    language: 'pt-BR',
    theme: 'light',
    musicEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    pokemonPerPage: 20,
    showShinyChance: true,
    autoPlayMusic: false,
    favoriteType: 'all'
  };

  audioState: AudioState = {
    isPlaying: false,
    currentTrack: null,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isLoading: false
  };

  availableTracks: any[] = [];
  languages = [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Español (España)', flag: '🇪🇸' }
  ];

  themes = [
    { value: 'light', name: 'THEME_LIGHT', icon: 'sunny' },
    { value: 'dark', name: 'THEME_DARK', icon: 'moon' },
    { value: 'auto', name: 'THEME_AUTO', icon: 'contrast' }
  ];

  pokemonPerPageOptions = [10, 20, 30, 50];

  private destroy$ = new Subject<void>();

  constructor(
    private settingsService: SettingsService,
    private audioService: AudioService,
    private favoritesService: FavoritesService,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadSettings();
    this.loadAudioState();
    this.loadAvailableTracks();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSettings() {
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.settings = { ...settings };
      });
  }

  private loadAudioState() {
    this.audioService.audioState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.audioState = { ...state };
      });
  }

  private loadAvailableTracks() {
    this.availableTracks = this.audioService.getAvailableTracks();
  }

  async onLanguageChange() {
    try {
      await this.settingsService.updateLanguage(this.settings.language);
      await this.showToast('LANGUAGE_UPDATED');
    } catch (error) {
      console.error('Erro ao atualizar idioma:', error);
      await this.showErrorToast('ERROR_UPDATING_LANGUAGE');
    }
  }

  async onThemeChange() {
    try {
      await this.settingsService.updateTheme(this.settings.theme);
      await this.showToast('THEME_UPDATED');
    } catch (error) {
      console.error('Erro ao atualizar tema:', error);
      await this.showErrorToast('ERROR_UPDATING_THEME');
    }
  }

  async onSettingChange(key: keyof AppSettings, value: any) {
    try {
      const update = { [key]: value } as Partial<AppSettings>;
      await this.settingsService.saveSettings(update);

      if (key === 'musicEnabled' && !value) {
        this.audioService.pause();
      }

      await this.showToast('SETTINGS_UPDATED');
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      await this.showErrorToast('ERROR_UPDATING_SETTINGS');
    }
  }

  // Controles de áudio
  async togglePlayPause() {
    try {
      await this.audioService.togglePlayPause();
    } catch (error) {
      console.error('Erro no player de áudio:', error);
    }
  }

  onVolumeChange(event: any) {
    const volume = event.detail.value / 100;
    this.audioService.setVolume(volume);
  }

  async selectTrack() {
    const buttons = this.availableTracks.map(track => ({
      text: track.name,
      handler: async () => {
        try {
          await this.audioService.loadTrack(track.id);
          await this.showToast('TRACK_CHANGED', track.name);
        } catch (error) {
          console.error('Erro ao trocar música:', error);
          await this.showErrorToast('ERROR_CHANGING_TRACK');
        }
      }
    }));    buttons.push({
      text: await this.translate.get('CANCEL').toPromise(),
      handler: async () => {}
    });

    const actionSheet = await this.actionSheetController.create({
      header: await this.translate.get('SELECT_MUSIC').toPromise(),
      buttons
    });

    await actionSheet.present();
  }

  // Gerenciamento de favoritos
  async exportFavorites() {
    try {
      const exported = await this.favoritesService.exportFavorites();

      // Criar link para download
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exported);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "pokemon-favorites.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      await this.showToast('FAVORITES_EXPORTED');
    } catch (error) {
      console.error('Erro ao exportar favoritos:', error);
      await this.showErrorToast('ERROR_EXPORT_FAVORITES');
    }
  }

  async importFavorites() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          await this.favoritesService.importFavorites(content);
          await this.showToast('FAVORITES_IMPORTED');
        } catch (error) {
          console.error('Erro ao importar favoritos:', error);
          await this.showErrorToast('ERROR_IMPORT_FAVORITES');
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }

  async clearAllFavorites() {
    const alert = await this.alertController.create({
      header: await this.translate.get('CONFIRM_CLEAR_ALL').toPromise(),
      message: await this.translate.get('CONFIRM_CLEAR_ALL_FAVORITES').toPromise(),
      buttons: [
        {
          text: await this.translate.get('CANCEL').toPromise(),
          role: 'cancel'
        },
        {
          text: await this.translate.get('CLEAR_ALL').toPromise(),
          handler: async () => {
            try {
              await this.favoritesService.clearAllFavorites();
              await this.showToast('CLEARED_ALL_FAVORITES');
            } catch (error) {
              console.error('Erro ao limpar favoritos:', error);
              await this.showErrorToast('ERROR_CLEAR_FAVORITES');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Configurações avançadas
  async exportSettings() {
    try {
      const exported = await this.settingsService.exportSettings();

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exported);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "pokemon-app-settings.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      await this.showToast('SETTINGS_EXPORTED');
    } catch (error) {
      console.error('Erro ao exportar configurações:', error);
      await this.showErrorToast('ERROR_EXPORT_SETTINGS');
    }
  }

  async importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          await this.settingsService.importSettings(content);
          await this.showToast('SETTINGS_IMPORTED');
        } catch (error) {
          console.error('Erro ao importar configurações:', error);
          await this.showErrorToast('ERROR_IMPORT_SETTINGS');
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }

  async resetSettings() {
    const alert = await this.alertController.create({
      header: await this.translate.get('CONFIRM_RESET').toPromise(),
      message: await this.translate.get('CONFIRM_RESET_SETTINGS').toPromise(),
      buttons: [
        {
          text: await this.translate.get('CANCEL').toPromise(),
          role: 'cancel'
        },
        {
          text: await this.translate.get('RESET').toPromise(),
          handler: async () => {
            try {
              await this.settingsService.resetSettings();
              await this.showToast('SETTINGS_RESET');
            } catch (error) {
              console.error('Erro ao resetar configurações:', error);
              await this.showErrorToast('ERROR_RESET_SETTINGS');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Informações do app
  async showAbout() {
    const alert = await this.alertController.create({
      header: await this.translate.get('ABOUT_APP').toPromise(),
      message: await this.translate.get('ABOUT_MESSAGE').toPromise(),
      buttons: [{
        text: await this.translate.get('OK').toPromise(),
        role: 'cancel'
      }]
    });

    await alert.present();
  }

  getLanguageName(code: string): string {
    const lang = this.languages.find(l => l.code === code);
    return lang ? lang.name : code;
  }

  getThemeName(theme: string): string {
    const themeObj = this.themes.find(t => t.value === theme);
    return themeObj ? themeObj.name : theme;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private async showToast(messageKey: string, extra?: string) {
    const message = await this.translate.get(messageKey, { extra }).toPromise();
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  private async showErrorToast(messageKey: string) {
    const message = await this.translate.get(messageKey).toPromise();
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
