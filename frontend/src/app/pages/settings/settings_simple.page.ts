import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActionSheetController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { AppSettings } from '../../models/app.model';
import { SettingsService } from '../../core/services/settings.service';

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

  private destroy$ = new Subject<void>();

  constructor(
    private settingsService: SettingsService,
    private translate: TranslateService,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController
  ) {}

  ngOnInit() {
    this.loadSettings();
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
