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

      // Aplicar tema quando as configurações carregam
      this.applyTheme(settings.darkMode);

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

  async toggleDarkMode() {
    const newDarkMode = !this.settings.darkMode;

    // Atualizar configurações locais
    this.settings.darkMode = newDarkMode;
    this.settings.theme = newDarkMode ? 'dark' : 'light';

    try {
      // Salvar no SettingsService
      await this.settingsService.saveSettings({
        darkMode: newDarkMode,
        theme: this.settings.theme
      });

      // Aplicar tema imediatamente
      this.applyTheme(newDarkMode);

      // Mostrar feedback visual
      this.showToast('settings_page.theme_update');

      console.log(`🌙 Tema alterado para: ${newDarkMode ? 'dark' : 'light'}`);
    } catch (error) {
      console.error('❌ Erro ao alterar tema:', error);
      // Reverter mudança local em caso de erro
      this.settings.darkMode = !newDarkMode;
      this.settings.theme = !newDarkMode ? 'dark' : 'light';
    }
  }

  /**
   * Aplica o tema com transição suave
   */
  private applyTheme(darkMode: boolean) {
    const body = document.body;

    // Adicionar classe de transição
    body.classList.add('theme-transition');

    // Aplicar/remover classe de tema
    if (darkMode) {
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
    } else {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
    }

    // Remover classe de transição após animação
    setTimeout(() => {
      body.classList.remove('theme-transition');
    }, 300);
  }

  toggleMusic() {
    const newMusicEnabled = !this.settings.musicEnabled;
    this.onSettingChange('musicEnabled', newMusicEnabled);
  }

  onSettingChange(setting: keyof AppSettings, value: any) {
    this.settingsService.saveSettings({ [setting]: value });
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

  async showAbout() {
    const alert = await this.alertController.create({
      header: await this.translate.get('settings_page.about_app').toPromise(),
      message: `
        <div style="text-align: center; padding: 16px;">
          <h3>${await this.translate.get('app.name').toPromise()}</h3>
          <p><strong>${await this.translate.get('settings_page.version').toPromise()}:</strong> 1.5</p>
          <p><strong>${await this.translate.get('settings_page.platform').toPromise()}:</strong> Mobile</p>
          <p><strong>${await this.translate.get('settings_page.data_source').toPromise()}:</strong> PokéAPI</p>
          <br>
          <p>${await this.translate.get('MADE_WITH_LOVE').toPromise()}</p>
          <p>${await this.translate.get('POWERED_BY_POKEAPI').toPromise()}</p>
        </div>
      `,
      buttons: [
        {
          text: await this.translate.get('common.close').toPromise(),
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  async openPokemonPerPageModal() {
    const alert = await this.alertController.create({
      header: await this.translate.get('settings_page.pokemon_per_page').toPromise(),
      inputs: this.pokemonPerPageOptions.map(option => ({
        name: 'pokemonPerPage',
        type: 'radio',
        label: option.toString(),
        value: option,
        checked: option === this.settings.pokemonPerPage
      })),
      buttons: [
        {
          text: await this.translate.get('common.cancel').toPromise(),
          role: 'cancel'
        },
        {
          text: await this.translate.get('common.confirm').toPromise(),
          handler: (selectedValue) => {
            if (selectedValue && selectedValue !== this.settings.pokemonPerPage) {
              this.onSettingChange('pokemonPerPage', selectedValue);
              this.showToast('settings_page.pokemon_per_page_changed');
            }
          }
        }
      ]
    });

    await alert.present();
  }

}
