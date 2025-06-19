import { Component, EnvironmentInjector, inject, OnInit, OnDestroy } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslatePipe } from '../pipes/translate.pipe';
import { Subscription } from 'rxjs';
import { FavoritesService } from '../services/favorites.service';
import { PokemonFavoritesService } from '../services/pokemon-favorites.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonBadge,
    IonRouterOutlet,
    TranslatePipe,
    CommonModule,
  ],
})
export class TabsPage implements OnInit, OnDestroy {
  public environmentInjector = inject(EnvironmentInjector);

  // 🔢 Contador de favoritos
  favoritesCount = 0;
  private favoritesSubscription?: Subscription;

  /**
   * Injeta o serviço de favoritos dedicado
   */
  constructor(
    private favoritesService: FavoritesService,
    private pokemonFavoritesService: PokemonFavoritesService,
  ) {
    // Atualiza contagem de favoritos reativamente
    this.pokemonFavoritesService.favorites$.subscribe(favorites => {
      this.favoritesCount = favorites.length;
    });
  }

  ngOnInit() {
    // Observar mudanças no número de favoritos
    this.favoritesSubscription = this.favoritesService.getFavorites().subscribe(
      favorites => {
        this.favoritesCount = favorites.length;
      },
    );
  }

  ngOnDestroy() {
    if (this.favoritesSubscription) {
      this.favoritesSubscription.unsubscribe();
    }
  }
}
