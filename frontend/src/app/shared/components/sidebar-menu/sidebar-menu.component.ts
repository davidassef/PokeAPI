import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MenuController, ModalController, PopoverController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from '../../../core/services/settings.service';
import { CapturedService } from '../../../core/services/captured.service';
import { AudioService } from '../../../core/services/audio.service';
import { AuthService } from '../../../core/services/auth.service';
import { ViewedPokemonService } from '../../../core/services/viewed-pokemon.service';
import { TrainerLevelService, TrainerStats } from '../../../core/services/trainer-level.service';
import { AuthModalNewComponent } from '../auth-modal-new/auth-modal-new.component';
import { UserProfileModalComponent } from '../user-profile-modal/user-profile-modal.component';
import { AccountSettingsModalComponent } from '../account-settings-modal/account-settings-modal.component';
import { User } from 'src/app/models/user.model';

export interface MenuItem {
  title: string;
  url: string;
  icon: string;
  badge?: number;
  color?: string;
}

@Component({
  selector: 'app-sidebar-menu',
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.scss']
})
export class SidebarMenuComponent implements OnInit, OnDestroy {
  menuItems: MenuItem[] = [
    {
      title: 'menu.home',
      url: '/tabs/home',
      icon: 'home-outline',
      color: 'primary'
    },
    {
      title: 'menu.captured',
      url: '/tabs/captured',
      icon: 'cube-outline',
      color: 'danger'
    },
    {
      title: 'menu.ranking',
      url: '/tabs/ranking',
      icon: 'trophy-outline',
      color: 'warning'
    },
    {
      title: 'menu.settings',
      url: '/tabs/settings',
      icon: 'settings-outline',
      color: 'medium'
    }
  ];

  additionalItems: MenuItem[] = [
    // Removido: Estatísticas, Tabela de Tipos e Pokémon Aleatório
  ];

  userStats = {
    capturedCount: 0,
    viewedCount: 0,
    completionPercentage: 0
  };

  trainerStats: TrainerStats = {
    viewedCount: 0,
    capturedCount: 0,
    totalXP: 0,
    level: {
      level: 1,
      title: 'Novato',
      currentXP: 0,
      requiredXP: 100,
      progressPercentage: 0,
      nextLevelXP: 100
    }
  };

  currentLanguage = 'pt-BR';
  availableLanguages = [
    { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
    { code: 'ja-JP', name: '日本語', flag: '🇯🇵' }
  ];

  private destroy$ = new Subject<void>();
  isAuthenticated = false;
  user: User | null = null;
  isMobile = false;
  isMobileRoute = false;
  showUserProfileMenu = false;

  constructor(
    private router: Router,
    private menuController: MenuController,
    private modalController: ModalController,
    private popoverController: PopoverController,
    private translate: TranslateService,
    private settingsService: SettingsService,
    private capturedService: CapturedService,
    private audioService: AudioService,
    private authService: AuthService,
    private viewedPokemonService: ViewedPokemonService,
    private trainerLevelService: TrainerLevelService
  ) {}

  ngOnInit() {
    this.loadSettings();
    this.setupAuthStateSubscription();
    this.setupViewedPokemonSubscription();
    this.setupTrainerStatsSubscription();
    this.loadUserStats();
    this.detectMobile();
    this.setupRouteListener();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAuthStateSubscription() {
    this.authService.getAuthState()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAuthenticated: boolean) => {
        this.isAuthenticated = isAuthenticated;
        if (isAuthenticated) {
          this.user = this.authService.getCurrentUser();
        } else {
          this.user = null;
        }
      });
  }

  private setupViewedPokemonSubscription() {
    this.viewedPokemonService.viewedPokemon$
      .pipe(takeUntil(this.destroy$))
      .subscribe(viewedData => {
        this.userStats.viewedCount = viewedData.viewedPokemonIds.size;
        this.userStats.completionPercentage = this.viewedPokemonService.getCompletionPercentage();
      });
  }

  private setupTrainerStatsSubscription() {
    this.trainerLevelService.trainerStats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.trainerStats = stats;
      });
  }

  private loadUserStats() {
    // Load captured Pokemon count
    this.capturedService.getCaptured()
      .pipe(takeUntil(this.destroy$))
      .subscribe(captured => {
        this.userStats.capturedCount = captured.length;
        this.updateCapturedBadge();
      });
  }

  private loadSettings() {
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.currentLanguage = settings.language;
      });
  }

  private updateCapturedBadge() {
    const capturedItem = this.menuItems.find(item => item.url === '/tabs/captured');
    if (capturedItem) {
      capturedItem.badge = this.userStats.capturedCount;
    }
  }

  // TODO: Método getCaptureRate temporariamente comentado - aguardando implementação de lógica adequada
  /*
  getCaptureRate(): number {
    if (this.userStats.viewedCount === 0) return 0;
    return Math.round((this.userStats.capturedCount / this.userStats.viewedCount) * 100);
  }
  */

  async onMenuItemClick(item: MenuItem) {
    if (item.url) {
      await this.router.navigate([item.url]);
      await this.menuController.close();
    } else {
      // Handle special actions
      await this.handleSpecialAction(item);
    }
  }

  async openAuthModal() {
    const modal = await this.modalController.create({
      component: AuthModalNewComponent,
      cssClass: 'auth-modal-fixed',
      backdropDismiss: true,
      showBackdrop: true
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.success) {
        // Authentication successful
        // Stats will be updated automatically via subscriptions
      }
    });

    await modal.present();
    await this.menuController.close();
  }

  private async handleSpecialAction(item: MenuItem) {
    switch (item.title) {
      case 'menu.random_pokemon':
        await this.goToRandomPokemon();
        break;
      case 'menu.type_chart':
        // TODO: Implement type chart modal
        // Type chart not implemented yet
        break;
      case 'menu.stats':
        // TODO: Implement stats modal
        // Stats modal not implemented yet
        break;
    }
    await this.menuController.close();
  }

  private async goToRandomPokemon() {
    const randomId = Math.floor(Math.random() * 1000) + 1;
    await this.router.navigate(['/tabs/details', randomId]);
  }
  async changeLanguage(languageCode: string) {
    const validLanguage = languageCode as 'pt-BR' | 'en-US' | 'es-ES' | 'ja-JP';
    await this.settingsService.updateLanguage(validLanguage);
    this.currentLanguage = languageCode;
  }

  // These methods are now handled by the ViewedPokemonService subscription
  // getCompletionPercentage and getCaptureRate are already defined above

  async closeMenu() {
    await this.menuController.close();
  }

  abrirLogin() {
    // TODO: Open login modal
  }

  toggleUserProfileMenu() {
    this.showUserProfileMenu = !this.showUserProfileMenu;
  }

  async openUserProfile() {
    this.showUserProfileMenu = false;
    await this.menuController.close();

    const modal = await this.modalController.create({
      component: UserProfileModalComponent,
      cssClass: 'user-profile-modal',
      backdropDismiss: true
    });

    await modal.present();
  }

  async openAccountSettings() {
    this.showUserProfileMenu = false;
    await this.menuController.close();

    const modal = await this.modalController.create({
      component: AccountSettingsModalComponent,
      cssClass: 'account-settings-modal',
      backdropDismiss: true
    });

    await modal.present();
  }

  async confirmLogout() {
    console.log('[SidebarMenu] Confirmando logout');
    this.showUserProfileMenu = false;

    // ✅ CORREÇÃO CRÍTICA: Logout sem reload para preservar dados
    this.authService.logout();
    await this.menuController.close();

    // ✅ CORREÇÃO: Navegar para home em vez de reload
    this.router.navigate(['/home']);

    console.log('[SidebarMenu] ✅ Logout concluído sem perda de dados');
  }

  abrirPerfil() {
    this.openUserProfile();
  }

  logout() {
    this.confirmLogout();
  }

  // ✅ CORREÇÃO: toggleUserMenu removido (dropdown de perfil não está mais no sidemenu)

  private detectMobile() {
    // Detectar se é dispositivo móvel
    this.isMobile = window.innerWidth <= 768;

    // Listener para mudanças de tamanho da tela
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
  }

  private setupRouteListener(): void {
    // Detectar mudanças de rota para identificar se estamos em rotas mobile
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.isMobileRoute = event.url.startsWith('/mobile');
        }
      });

    // Verificar rota inicial
    this.isMobileRoute = this.router.url.startsWith('/mobile');
  }

  async showTrainerLevelInfo(event: Event) {
    event.stopPropagation(); // Previne que o clique abra/feche o dropdown

    const progressionInfo = this.trainerLevelService.getProgressionInfo();
    const pokemonNeeded = this.trainerLevelService.getPokemonNeededForNextLevel();

    // Por enquanto, vamos usar um alert simples até criarmos o componente de popover
    const message = `
${this.trainerStats.level.title} - Nível ${this.trainerStats.level.level}
XP: ${this.trainerStats.level.currentXP}/${this.trainerStats.level.requiredXP}
Progresso: ${this.trainerStats.level.progressPercentage}%

${progressionInfo}

Para o próximo nível você precisa de:
• ${pokemonNeeded.captured} Pokémon capturados OU
• ${pokemonNeeded.viewed} Pokémon visualizados
    `;

    alert(message);
  }
}
