import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from '../../../core/services/settings.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { AudioService } from '../../../core/services/audio.service';

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
      title: 'menu.favorites',
      url: '/tabs/favorites',
      icon: 'heart-outline',
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
    {
      title: 'menu.random_pokemon',
      url: '',
      icon: 'shuffle-outline',
      color: 'success'
    },
    {
      title: 'menu.type_chart',
      url: '',
      icon: 'grid-outline',
      color: 'tertiary'
    },
    {
      title: 'menu.stats',
      url: '',
      icon: 'stats-chart-outline',
      color: 'secondary'
    }
  ];

  userStats = {
    favoritesCount: 0,
    seenCount: 0,
    caughtCount: 0
  };

  currentLanguage = 'pt-BR';
  availableLanguages = [
    { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private menuController: MenuController,
    private translate: TranslateService,
    private settingsService: SettingsService,
    private favoritesService: FavoritesService,
    private audioService: AudioService
  ) {}

  ngOnInit() {
    this.loadUserStats();
    this.loadSettings();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserStats() {
    this.favoritesService.getFavorites()
      .pipe(takeUntil(this.destroy$))
      .subscribe(favorites => {
        this.userStats.favoritesCount = favorites.length;
        this.updateFavoritesBadge();
      });

    // Mock data for seen/caught - in real app this would come from a service
    this.userStats.seenCount = 145;
    this.userStats.caughtCount = 89;
  }

  private loadSettings() {
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.currentLanguage = settings.language;
      });
  }

  private updateFavoritesBadge() {
    const favoritesItem = this.menuItems.find(item => item.url === '/tabs/favorites');
    if (favoritesItem) {
      favoritesItem.badge = this.userStats.favoritesCount;
    }
  }

  async onMenuItemClick(item: MenuItem) {
    this.audioService.playSound('/assets/audio/menu-click.mp3');

    if (item.url) {
      await this.router.navigate([item.url]);
      await this.menuController.close();
    } else {
      // Handle special actions
      await this.handleSpecialAction(item);
    }
  }

  private async handleSpecialAction(item: MenuItem) {
    switch (item.title) {
      case 'menu.random_pokemon':
        await this.goToRandomPokemon();
        break;
      case 'menu.type_chart':
        // TODO: Implement type chart modal
        console.log('Type chart not implemented yet');
        break;
      case 'menu.stats':
        // TODO: Implement stats modal
        console.log('Stats modal not implemented yet');
        break;
    }
    await this.menuController.close();
  }

  private async goToRandomPokemon() {
    const randomId = Math.floor(Math.random() * 1000) + 1;
    await this.router.navigate(['/tabs/details', randomId]);
  }
  async changeLanguage(languageCode: string) {
    this.audioService.playSound('/assets/audio/menu-click.mp3');
    const validLanguage = languageCode as 'pt-BR' | 'en-US' | 'es-ES';
    await this.settingsService.saveSettings({ language: validLanguage });
    this.translate.use(languageCode);
    this.currentLanguage = languageCode;
  }

  getCompletionPercentage(): number {
    const totalPokemon = 1000; // Approximate total
    return Math.round((this.userStats.seenCount / totalPokemon) * 100);
  }

  getCaptureRate(): number {
    if (this.userStats.seenCount === 0) return 0;
    return Math.round((this.userStats.caughtCount / this.userStats.seenCount) * 100);
  }

  async closeMenu() {
    await this.menuController.close();
  }
}
