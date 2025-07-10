import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage-angular';
import { SettingsService } from './core/services/settings.service';
import { User } from 'src/app/models/user.model';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  mostrarPerfilModal = false;
  user: User | null = null;

  abrirPerfil = () => {
    this.mostrarPerfilModal = true;
  };
  fecharPerfilModal = () => {
    this.mostrarPerfilModal = false;
  };

  logout = () => {
    this.authService.logout();
    this.fecharPerfilModal();
  };

  constructor(
    private platform: Platform,
    private translate: TranslateService,
    private storage: Storage,
    private settingsService: SettingsService, // injetar serviço de configurações
    private authService: AuthService // injetar serviço de autenticação
  ) {
    this.initializeApp();
  }

  async ngOnInit() {
    await this.storage.create();
    // As configurações já são carregadas no initializeApp

    // Inscrever para atualizações do usuário autenticado
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
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
        const supportedLangs = ['pt-BR', 'en-US', 'es-ES', 'ja-JP'];
        const langToUse = supportedLangs.includes(browserLang || '') ? browserLang : 'pt-BR';
        this.translate.use(langToUse || 'pt-BR');

        // Salvar o idioma detectado nas configurações
        const detectedLanguage = (langToUse || 'pt-BR') as 'pt-BR' | 'en-US' | 'es-ES' | 'ja-JP';
        await this.settingsService.saveSettings({ language: detectedLanguage });
      }
    });
  }
}

const usuarioTeste: User = {
  id: '1',
  name: 'Teste',
  email: 'teste@teste.com'
};
