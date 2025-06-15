import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular';

import { FavoritesService } from '../services/favorites.service';
import { LocalizationService } from '../services/localization.service';
import { PokemonCardComponent } from '../components/pokemon-card.component';
import { SharedHeaderComponent } from '../components/shared-header.component';
import { TranslatePipe } from '../pipes/translate.pipe';
import { FavoritePokemon, Pokemon } from '../models/pokemon.model';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, PokemonCardComponent, SharedHeaderComponent, TranslatePipe]
})
export class Tab2Page implements OnInit {
  favorites: FavoritePokemon[] = [];
  isLoading = true;

  constructor(
    private favoritesService: FavoritesService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private localizationService: LocalizationService
  ) {}

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

    this.favoritesService.getFavorites().subscribe(favorites => {
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
          role: 'destructive',
          handler: async () => {
            const success = await this.favoritesService.removeFromFavorites(favorite.id);

            if (success) {
              await this.showSuccessToast(`${this.formatName(favorite.name)} ${this.localizationService.translate('favorites.removed')}`);
            } else {
              await this.showErrorToast(this.localizationService.translate('error.removeFavorite'));
            }
          }
        }
      ]
    });

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
            await this.favoritesService.clearAllFavorites();
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
   * Sempre retorna true pois estamos na página de favoritos
   */
  isFavorite(pokemonId: number): boolean {
    return true;
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
