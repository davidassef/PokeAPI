import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage-angular';

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
    private storage: Storage
  ) {
    this.initializeApp();
  }

  async ngOnInit() {
    await this.storage.create();
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
    });
  }
}
