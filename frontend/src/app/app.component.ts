import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage-angular';
import { Router, NavigationEnd } from '@angular/router';
import { SettingsService } from './core/services/settings.service';
import { User } from 'src/app/models/user.model';
import { AuthService } from './core/services/auth.service';
import { filter } from 'rxjs/operators';
import { CapturedMonitorService } from './core/services/captured-monitor.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  mostrarPerfilModal = false;
  user: User | null = null;
  isMobileRoute = false;

  abrirPerfil = () => {
    this.mostrarPerfilModal = true;
  };
  fecharPerfilModal = () => {
    this.mostrarPerfilModal = false;
  };

  logout = () => {
    console.log('[AppComponent] Realizando logout preservando dados');
    this.authService.logout();
    this.fecharPerfilModal();
    console.log('[AppComponent] ✅ Logout concluído');
  };

  constructor(
    private platform: Platform,
    private translate: TranslateService,
    private storage: Storage,
    private router: Router,
    private settingsService: SettingsService, // injetar serviço de configurações
    private authService: AuthService, // injetar serviço de autenticação
    private capturedMonitor: CapturedMonitorService // ✅ NOVO: Serviço de monitoramento
  ) {
    this.initializeApp();
    this.setupRouteListener();
    this.initializeMonitoring(); // ✅ NOVO: Inicializar monitoramento
  }

  async ngOnInit() {
    await this.storage.create();
    // As configurações já são carregadas no initializeApp

    // Inscrever para atualizações do usuário autenticado
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  /**
   * ✅ NOVO: Inicializa o sistema de monitoramento contínuo
   */
  private initializeMonitoring(): void {
    console.log('[AppComponent] 🔍 Inicializando monitoramento do sistema de capturados...');

    // Habilita debug global em desenvolvimento
    if (!environment.production) {
      this.capturedMonitor.enableGlobalDebug();
      console.log('[AppComponent] 🔧 Debug global habilitado - use window.capturedMonitor.printReport()');
    }

    // Inicia monitoramento automático
    this.capturedMonitor.startPeriodicMonitoring();

    console.log('[AppComponent] ✅ Monitoramento inicializado com sucesso');
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

  private setupRouteListener(): void {
    // Detectar mudanças de rota para identificar se estamos em rotas mobile
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.isMobileRoute = event.url.startsWith('/mobile');
        }
      });

    // Verificar rota inicial
    this.isMobileRoute = this.router.url.startsWith('/mobile');
  }

  isMobile(): boolean {
    // Retorna true se estamos em rotas mobile OU em dispositivos móveis reais
    return this.isMobileRoute || this.platform.is('mobile') || this.platform.is('tablet') || this.platform.is('iphone');
  }
}

const usuarioTeste: User = {
  id: '1',
  name: 'Teste',
  email: 'teste@teste.com',
  role: 'user' as any // Temporary fix for test user
};
