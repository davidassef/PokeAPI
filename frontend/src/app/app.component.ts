import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage-angular';
import { SettingsService } from './core/services/settings.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private translate: TranslateService,
    private storage: Storage,
    private settingsService: SettingsService // injetar serviço de configurações
  ) {
    this.initializeApp();
  }

  async ngOnInit() {
    await this.storage.create();
    // As configurações já são carregadas no initializeApp
  }

  async initializeApp() {
    this.platform.ready().then(async () => {
      // Configurar idioma padrão
      this.translate.setDefaultLang('pt-BR');

      // Aguardar o carregamento das configurações
      await this.settingsService.loadSettings();
      
      // Obter idioma das configurações
      const settings = this.settingsService.getCurrentSettings();
      const savedLanguage = settings.language;
      
      if (savedLanguage) {
        this.translate.use(savedLanguage);
      } else {
        // Usar idioma do dispositivo ou pt-BR como padrão
        const browserLang = this.translate.getBrowserLang();
        const supportedLangs = ['pt-BR', 'en-US', 'es-ES'];
        const langToUse = supportedLangs.includes(browserLang || '') ? browserLang : 'pt-BR';
        this.translate.use(langToUse || 'pt-BR');
        
        // Salvar o idioma detectado nas configurações
        const detectedLanguage = (langToUse || 'pt-BR') as 'pt-BR' | 'en-US' | 'es-ES';
        await this.settingsService.saveSettings({ language: detectedLanguage });
      }
    });
  }
}
