import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { PokeUiFavoritesService } from '../poke-ui/poke-ui-favorites.service';
import { TranslatePipe } from '../pipes/translate.pipe';

/**
 * Página de favoritos do aplicativo Pokémon.
 * Exibe a lista de Pokémons favoritos do usuário.
 */
@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    TranslatePipe,
  ],
})
export class Tab2Page implements OnInit, OnDestroy {

  /**
   * Lista de Pokémons favoritos.
   */
  favorites: any[] = [];

  /**
   * Indica se está carregando dados.
   */
  isLoading = false;

  /**
   * Subscription para gerenciar observables.
   */
  private subscription = new Subscription();

  /**
   * Construtor da página de favoritos.
   */
  constructor(
    private router: Router,
    private favoritesService: PokeUiFavoritesService
  ) {}

  /**
   * Inicialização do componente.
   */
  ngOnInit(): void {
    this.loadFavorites();
  }

  /**
   * Cleanup ao destruir o componente.
   */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  /**
   * Carrega lista de favoritos.
   */
  private loadFavorites(): void {
    this.isLoading = true;
    
    try {
      const favoriteIds = this.favoritesService.getFavorites();
      // Por enquanto, usar IDs simulados como dados básicos
      this.favorites = favoriteIds.map(id => ({
        id: id,
        name: `Pokemon #${id}`,
        imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
      }));
      this.isLoading = false;
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      this.favorites = [];
      this.isLoading = false;
    }
  }
  /**
   * Remove um Pokémon dos favoritos.
   */
  removeFavorite(pokemon: any): void {
    this.favoritesService.removeFavorite(pokemon.id);
    this.loadFavorites(); // Recarrega a lista
  }

  /**
   * Navega para detalhes do Pokémon.
   */
  viewDetails(pokemon: any): void {
    this.router.navigate(['/pokemon', pokemon.id]);
  }
}
