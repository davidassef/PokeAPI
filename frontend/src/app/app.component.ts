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

      // Obter configurações salvas
      const settings = this.settingsService.getCurrentSettings();
      const savedLanguage = settings.language;

      // Configurar idioma
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

      // Aplicar tema salvo
      this.applyInitialTheme(settings);

      console.log('🚀 App initialized with settings:', {
        language: settings.language,
        theme: settings.theme,
        darkMode: settings.darkMode
      });
    });
  }

  /**
   * Aplica o tema inicial baseado nas configurações salvas
   */
  private applyInitialTheme(settings: any) {
    const body = document.body;

    // Remover classes de tema existentes
    body.classList.remove('dark-theme', 'light-theme');

    // Aplicar tema baseado nas configurações
    if (settings.theme === 'auto') {
      // Detectar preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
      console.log(`🌙 Auto theme applied: ${prefersDark ? 'dark' : 'light'}`);
    } else if (settings.darkMode || settings.theme === 'dark') {
      body.classList.add('dark-theme');
      console.log('🌙 Dark theme applied');
    } else {
      body.classList.add('light-theme');
      console.log('☀️ Light theme applied');
    }
  }
}

const usuarioTeste: User = {
  id: '1',
  name: 'Teste',
  email: 'teste@teste.com',
  role: 'user' as any // Temporary fix for test user
};
