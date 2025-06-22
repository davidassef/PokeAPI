import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { Pokemon, FavoritePokemon } from '../../models/pokemon.model';
import { FavoritesService } from '../../core/services/favorites.service';
import { PokeApiService } from '../../core/services/pokeapi.service';
import { AudioService } from '../../core/services/audio.service';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
})
export class FavoritesPage implements OnInit, OnDestroy {
  favoritesPokemon: Pokemon[] = [];
  filteredFavorites: Pokemon[] = [];
  favoritesData: FavoritePokemon[] = [];
  searchTerm = '';
  sortBy: 'id' | 'name' = 'id';
  sortOrder: 'asc' | 'desc' = 'asc';
  loading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private favoritesService: FavoritesService,
    private pokeApiService: PokeApiService,
    private audioService: AudioService,
    private alertController: AlertController,
    private toastController: ToastController,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadFavorites();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadFavorites() {
    this.loading = true;
    try {
      this.favoritesService.favorites$
        .pipe(takeUntil(this.destroy$))
        .subscribe(async (favorites) => {
          this.favoritesData = favorites;

          // Buscar dados completos de cada Pokémon favorito
          const pokemonPromises = favorites.map(fav =>
            this.pokeApiService.getPokemon(fav.pokemon_id).toPromise()
          );

          const pokemonData = await Promise.all(pokemonPromises);
          this.favoritesPokemon = pokemonData.filter(p => p !== undefined) as Pokemon[];
          this.applyFilters();
          this.loading = false;
        });
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      this.loading = false;
    }
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value.toLowerCase().trim();
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.favoritesPokemon];

    // Filtro por nome
    if (this.searchTerm) {
      filtered = filtered.filter(pokemon =>
        pokemon.name.toLowerCase().includes(this.searchTerm)
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;

      if (this.sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison = a.id - b.id;
      }

      return this.sortOrder === 'desc' ? -comparison : comparison;
    });

    this.filteredFavorites = filtered;
  }

  async removeFavorite(pokemon: Pokemon, event: Event) {
    event.stopPropagation();

    const alert = await this.alertController.create({
      header: await this.translate.get('CONFIRM_REMOVAL').toPromise(),
      message: await this.translate.get('CONFIRM_REMOVE_FAVORITE', { name: pokemon.name }).toPromise(),
      buttons: [
        {
          text: await this.translate.get('CANCEL').toPromise(),
          role: 'cancel'
        },
        {
          text: await this.translate.get('REMOVE').toPromise(),
          handler: async () => {            try {
              await this.favoritesService.removeFromFavorites(pokemon.id);
              await this.audioService.playSound('/assets/audio/remove.wav');
              await this.showToast('REMOVED_FROM_FAVORITES', pokemon.name);
            } catch (error) {
              console.error('Erro ao remover favorito:', error);
              await this.showErrorToast('ERROR_REMOVE_FAVORITE');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async clearAllFavorites() {
    if (this.favoritesPokemon.length === 0) {
      return;
    }

    const alert = await this.alertController.create({
      header: await this.translate.get('CONFIRM_CLEAR_ALL').toPromise(),
      message: await this.translate.get('CONFIRM_CLEAR_ALL_FAVORITES').toPromise(),
      buttons: [
        {
          text: await this.translate.get('CANCEL').toPromise(),
          role: 'cancel'
        },
        {
          text: await this.translate.get('CLEAR_ALL').toPromise(),
          handler: async () => {            try {
              await this.favoritesService.clearAllFavorites();
              await this.audioService.playSound('/assets/audio/clear.wav');
              await this.showToast('CLEARED_ALL_FAVORITES');
            } catch (error) {
              console.error('Erro ao limpar favoritos:', error);
              await this.showErrorToast('ERROR_CLEAR_FAVORITES');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async exportFavorites() {
    try {
      const exported = await this.favoritesService.exportFavorites();

      // Criar um link para download
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exported);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "pokemon-favorites.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      await this.showToast('FAVORITES_EXPORTED');
    } catch (error) {
      console.error('Erro ao exportar favoritos:', error);
      await this.showErrorToast('ERROR_EXPORT_FAVORITES');
    }
  }

  async importFavorites(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        await this.favoritesService.importFavorites(content);
        await this.showToast('FAVORITES_IMPORTED');
        event.target.value = ''; // Reset file input
      } catch (error) {
        console.error('Erro ao importar favoritos:', error);
        await this.showErrorToast('ERROR_IMPORT_FAVORITES');
      }
    };
    reader.readAsText(file);
  }

  async onRefresh(event: any) {
    await this.loadFavorites();
    event.target.complete();
  }

  getStatsTotal(pokemon: Pokemon): number {
    return pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);
  }

  getUniqueTypes(): string[] {
    const types = new Set<string>();
    this.favoritesPokemon.forEach(pokemon => {
      pokemon.types.forEach(type => types.add(type.type.name));
    });
    return Array.from(types);
  }

  getAverageStats(): number {
    if (this.favoritesPokemon.length === 0) return 0;

    const totalStats = this.favoritesPokemon.reduce((sum, pokemon) => {
      return sum + this.getStatsTotal(pokemon);
    }, 0);

    return Math.round(totalStats / this.favoritesPokemon.length);
  }

  private async showToast(messageKey: string, pokemonName?: string) {
    const message = await this.translate.get(messageKey, { name: pokemonName }).toPromise();
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  private async showErrorToast(messageKey: string) {
    const message = await this.translate.get(messageKey).toPromise();
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
