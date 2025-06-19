import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular';

import { PokemonFavoritesService } from '../services/pokemon-favorites.service';
import { LocalizationService } from '../services/localization.service';
import { PokemonCardComponent } from '../components/pokemon-card.component';
import { SharedHeaderComponent } from '../components/shared-header.component';
import { TranslatePipe } from '../pipes/translate.pipe';
import { FavoritePokemon, Pokemon } from '../models/pokemon.model';
import { AppPages } from '../enums/app.enums';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, PokemonCardComponent, SharedHeaderComponent, TranslatePipe]
})
export class Tab2Page implements OnInit {
  // 📱 Enums para templates
  readonly appPages = AppPages;

  /**
   * Injeta o serviço de favoritos dedicado
   */
  constructor(
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private localizationService: LocalizationService,
    private pokemonFavoritesService: PokemonFavoritesService
  ) {}

  /**
   * Remove um Pokémon dos favoritos (por ID)
   */
  removeFavorite(pokemonId: number): void {
    this.pokemonFavoritesService.toggleFavorite(pokemonId);
  }

  /**
   * Limpa todos os favoritos
   */
  clearFavorites(): void {
    this.pokemonFavoritesService.clearFavorites();
  }

  /**
   * Observable de IDs dos favoritos
   */
  favorites$ = this.pokemonFavoritesService.favorites$;

  favorites: FavoritePokemon[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.loadFavorites();
  }

  ionViewWillEnter(): void {
    this.loadFavorites();
  }

  /**
   * Carrega lista de favoritos
   */
  private loadFavorites(): void {
    this.isLoading = true;

    this.pokemonFavoritesService.getFavorites().subscribe(favorites => {
      this.favorites = favorites.sort((a, b) =>
        new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      );
      this.isLoading = false;
    });
  }

  /**
   * Navega para detalhes do Pokémon
   */
  goToDetails(favorite: FavoritePokemon): void {
    // Converte FavoritePokemon para Pokemon para compatibilidade
    const pokemon: Pokemon = {
      id: favorite.id,
      name: favorite.name,
      url: '',
      sprites: {
        front_default: favorite.imageUrl,
        front_shiny: '',
        back_default: '',
        back_shiny: '',
        other: {
          'official-artwork': {
            front_default: favorite.imageUrl,
            front_shiny: ''
          },
          dream_world: {
            front_default: favorite.imageUrl
          },
          home: {
            front_default: favorite.imageUrl,
            front_shiny: ''
          }
        }
      }
    };

    this.router.navigate(['/pokemon', favorite.id]);
  }

  /**
   * Remove dos favoritos com confirmação
   */
  async removeFavorite(favorite: FavoritePokemon): Promise<void> {
    const alert = await this.alertController.create({
      header: this.localizationService.translate('favorites.confirmRemove'),
      message: this.localizationService.translate('favorites.confirmRemoveMessage').replace('{name}', this.formatName(favorite.name)),
      buttons: [
        {
          text: this.localizationService.translate('common.cancel'),
          role: 'cancel'
        },
        {
          text: this.localizationService.translate('favorites.removeButtonText'),
    await alert.present();
  }

  /**
   * Limpa todos os favoritos com confirmação
   */
  async clearAllFavorites(): Promise<void> {
    if (this.favorites.length === 0) {
      await this.showErrorToast(this.localizationService.translate('error.noFavoritesToRemove'));
      return;
    }

    const alert = await this.alertController.create({
      header: this.localizationService.translate('favorites.confirmClearAll'),
      message: this.localizationService.translate('favorites.confirmClearAllMessage').replace('{count}', this.favorites.length.toString()),
      buttons: [
        {
          text: this.localizationService.translate('common.cancel'),
          role: 'cancel'
        },
        {
          text: this.localizationService.translate('favorites.clearAllButtonText'),
          role: 'destructive',
          handler: async () => {
            await this.pokemonFavoritesService.clearAllFavorites();
            await this.showSuccessToast('Todos os favoritos foram removidos!');
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Converte FavoritePokemon para Pokemon (compatibilidade com PokemonCard)
   */
  convertToPokemon(favorite: FavoritePokemon): Pokemon {
    return {
      id: favorite.id,
      name: favorite.name,
      url: '',
      sprites: {
        front_default: favorite.imageUrl,
        front_shiny: '',
        back_default: '',
        back_shiny: '',
        other: {
          'official-artwork': {
            front_default: favorite.imageUrl,
            front_shiny: ''
          },
          dream_world: {
            front_default: favorite.imageUrl
          },
          home: {
            front_default: favorite.imageUrl,
            front_shiny: ''
          }
        }
      }
    };
  }

  /**
   * Retorna se o Pokémon está nos favoritos
   */
  isFavorite(pokemonId: number): boolean {
    return this.pokemonFavoritesService.isFavorite(pokemonId);
  }

  /**
   * Retorna a contagem de favoritos
   */
  getFavoritesCount(): number {
    return this.pokemonFavoritesService.getFavorites().length;
  }

  /**
   * Formata nome do Pokémon
   */
  private formatName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /**
   * Formata data de adição
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Exibe toast de sucesso
   */
  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
  }

  /**
   * Exibe toast de erro
   */
  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  }

  /**
   * TrackBy function para otimizar renderização
   */
  trackByFavoriteId(index: number, favorite: FavoritePokemon): number {
    return favorite.id;
  }
}
