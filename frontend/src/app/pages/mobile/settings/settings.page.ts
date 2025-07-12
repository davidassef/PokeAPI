import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { AudioService } from '../../../core/services/audio.service';
import { SettingsService } from '../../../core/services/settings.service';
import { AppSettings } from '../../../models/app.model';

@Component({
  selector: 'app-mobile-settings',
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
    autoPlayMusic: false
  };

  languages = [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Español (España)', flag: '🇪🇸' },
    { code: 'ja-JP', name: '日本語 (Japanese)', flag: '🇯🇵' }
  ];

  pokemonPerPageOptions = [10, 20, 30, 50, 100];

  private destroy$ = new Subject<void>();

  constructor(
    private settingsService: SettingsService,
    private audioService: AudioService,
    private translate: TranslateService,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadSettings();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter() {
    document.body.classList.add('mobile-settings-page-active');
  }

  ionViewWillLeave() {
    document.body.classList.remove('mobile-settings-page-active');
  }

  private loadSettings() {
    this.settingsService.settings$.pipe(takeUntil(this.destroy$)).subscribe(settings => {
      this.settings = { ...settings };
      console.log('⚙️ Settings loaded in mobile:', {
        darkMode: settings.darkMode,
        theme: settings.theme,
        language: settings.language
      });
    });
  }

  getCurrentLanguageName(): string {
    const currentLang = this.languages.find(lang => lang.code === this.settings.language);
    return currentLang ? currentLang.name : 'Português (Brasil)';
  }

  async openLanguageModal() {
    const alert = await this.alertController.create({
      header: await this.translate.get('settings_page.select_language').toPromise(),
      inputs: this.languages.map(lang => ({
        name: 'language',
        type: 'radio',
        label: `${lang.flag} ${lang.name}`,
        value: lang.code,
        checked: lang.code === this.settings.language
      })),
      buttons: [
        {
          text: await this.translate.get('common.cancel').toPromise(),
          role: 'cancel'
        },
        {
          text: await this.translate.get('common.confirm').toPromise(),
          handler: (selectedLanguage) => {
            if (selectedLanguage && selectedLanguage !== this.settings.language) {
              this.changeLanguage(selectedLanguage);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  changeLanguage(languageCode: string) {
    this.translate.use(languageCode);
    this.onSettingChange('language', languageCode);
    this.showToast('settings_page.language_changed');
  }

  /**
   * Altera tema (compatível com versão web)
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

  /**
   * Abre modal de seleção de Pokémon por página
   */
  async openPokemonPerPageModal() {
    const alert = await this.alertController.create({
      header: await this.translate.get('settings_page.pokemon_per_page').toPromise(),
      inputs: [
        { name: 'pokemonPerPage', type: 'radio', label: '10', value: 10, checked: this.settings.pokemonPerPage === 10 },
        { name: 'pokemonPerPage', type: 'radio', label: '20', value: 20, checked: this.settings.pokemonPerPage === 20 },
        { name: 'pokemonPerPage', type: 'radio', label: '30', value: 30, checked: this.settings.pokemonPerPage === 30 },
        { name: 'pokemonPerPage', type: 'radio', label: '50', value: 50, checked: this.settings.pokemonPerPage === 50 }
      ],
      buttons: [
        {
          text: await this.translate.get('CANCEL').toPromise(),
          role: 'cancel'
        },
        {
          text: await this.translate.get('CONFIRM').toPromise(),
          handler: (data) => {
            if (data) {
              this.onSettingChange('pokemonPerPage', data);
              this.showToast('settings_page.pokemon_per_page_updated');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Mostra informações sobre o app
   */
  async showAbout() {
    const alert = await this.alertController.create({
      header: await this.translate.get('settings_page.about_app').toPromise(),
      message: await this.translate.get('settings_page.about_description').toPromise(),
      buttons: [await this.translate.get('OK').toPromise()]
    });
    await alert.present();
  }

  /**
   * Mostra toast de feedback
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
