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
    // Garante que as configurações (incluindo tema) sejam carregadas e aplicadas
    await this.settingsService.loadSettings();
  }

  async initializeApp() {
    this.platform.ready().then(async () => {
      // Configurar idioma padrão
      this.translate.setDefaultLang('pt-BR');

      // Verificar idioma salvo
      const savedLanguage = await this.storage.get('app-language');
      if (savedLanguage) {
        this.translate.use(savedLanguage);
      } else {
        // Usar idioma do dispositivo ou pt-BR como padrão
        const browserLang = this.translate.getBrowserLang();
        const supportedLangs = ['pt-BR', 'en-US', 'es-ES'];
        const langToUse = supportedLangs.includes(browserLang || '') ? browserLang : 'pt-BR';
        this.translate.use(langToUse || 'pt-BR');
      }
      // O tema será aplicado pelo settingsService.loadSettings() em ngOnInit
    });
  }
}
