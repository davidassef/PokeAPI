import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActionSheetController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { AppSettings } from '../../models/app.model';
import { SettingsService } from '../../core/services/settings.service';
import { CapturedService } from '../../core/services/captured.service';
import { SyncService } from '../../core/services/sync.service';

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

  languages = [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Español (España)', flag: '🇪🇸' }
  ];

  pokemonPerPageOptions = [10, 20, 30, 50, 100];

  private destroy$ = new Subject<void>();
  syncPending = false;

  constructor(
    private settingsService: SettingsService,
    private translate: TranslateService,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private capturedService: CapturedService,
    private syncService: SyncService // Adicionado para status de sincronização
  ) {}

  ngOnInit() {
    this.loadSettings();
    this.checkSyncStatus();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async checkSyncStatus() {
    const pending = await this.syncService.getPendingCount();
    this.syncPending = pending > 0;
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
  async onThemeChange(event: any) {
    try {
      // O toggle envia o novo valor (true/false)
      const darkMode = event.detail ? event.detail.checked : event;
      this.settings.darkMode = darkMode;
      this.settings.theme = darkMode ? 'dark' : 'light';
      await this.settingsService.saveSettings({ darkMode, theme: this.settings.theme });
      // Aplica/remover classe global
      if (darkMode) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
      // Animação de transição suave
      document.body.classList.add('theme-transition');
      setTimeout(() => document.body.classList.remove('theme-transition'), 400);
      this.showToast('settings_page.theme_update');
    } catch (error) {
      console.error('Erro ao alterar tema:', error);
    }
  }

  onSettingChange(setting: keyof AppSettings, value: any) {
    this.settingsService.saveSettings({ [setting]: value });
  }

  exportCaptured() {
    const data = this.capturedService.exportCaptured();
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captured.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async importCaptured() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      await this.capturedService.importCaptured(text);
      this.showToast('CAPTURED.IMPORTED');
    };
    input.click();
  }

  clearAllCaptured() {
    this.capturedService.clearAllCaptured();
    this.showToast('CAPTURED.CLEARED');
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
      position: 'top', // Alterado para exibir o toast no topo
      color: 'success'
    });
    await toast.present();
  }
}
