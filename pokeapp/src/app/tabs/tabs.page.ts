import { Component, EnvironmentInjector, inject, OnInit, OnDestroy } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonBadge,
  IonRouterOutlet,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '../pipes/translate.pipe';
import { CommonModule } from '@angular/common';

/**
 * Página principal de navegação por abas do app.
 * Exibe as abas de Pokédex, Favoritos e Configurações.
 */
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
  /**
   * Injeta o EnvironmentInjector para uso avançado de DI.
   */
  public environmentInjector = inject(EnvironmentInjector);

  /**
   * Contador de Pokémon favoritos para exibição no badge da aba.
   */
  favoritesCount = 0;
  /**
   * Injeta o serviço centralizado de favoritos.
   * Atualiza a contagem de favoritos reativamente.
   */
  constructor() {
    // Obtém contagem inicial de favoritos
    // this.pokemonFavoritesService.favorites$.subscribe(favorites => {
    //   this.favoritesCount = favorites.length;
    // });
  }

  /**
   * Inicializa a contagem de favoritos ao carregar o componente.
   */  ngOnInit() {
    // Inicializa a contagem de favoritos
    this.favoritesCount = 0; // Será implementada corretamente quando integrado
  }

  /**
   * Método de ciclo de vida para limpeza (nenhuma subscription para desfazer).
   */
  ngOnDestroy() {
    // Nenhuma subscription para desfazer
  }
}
