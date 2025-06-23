import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { Pokemon } from '../../models/pokemon.model';
import { PokeApiService } from '../../core/services/pokeapi.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { AudioService } from '../../core/services/audio.service';

interface PokemonRanking {
  pokemon: Pokemon;
  favoriteCount: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.page.html',
  styleUrls: ['./ranking.page.scss'],
})
export class RankingPage implements OnInit, OnDestroy {
  globalRanking: PokemonRanking[] = [];
  localRanking: PokemonRanking[] = [];
  viewMode: 'global' | 'local' = 'global';
  loading = false;

  // Mock data para demonstração (em um app real, viria do backend)
  private mockGlobalData = [
    { pokemonId: 25, favoriteCount: 15420, rank: 1, trend: 'stable' as const }, // Pikachu
    { pokemonId: 6, favoriteCount: 12350, rank: 2, trend: 'up' as const },     // Charizard
    { pokemonId: 150, favoriteCount: 11200, rank: 3, trend: 'down' as const }, // Mewtwo
    { pokemonId: 144, favoriteCount: 9800, rank: 4, trend: 'up' as const },    // Articuno
    { pokemonId: 1, favoriteCount: 9200, rank: 5, trend: 'stable' as const },  // Bulbasaur
    { pokemonId: 4, favoriteCount: 8900, rank: 6, trend: 'down' as const },    // Charmander
    { pokemonId: 7, favoriteCount: 8500, rank: 7, trend: 'up' as const },     // Squirtle
    { pokemonId: 94, favoriteCount: 7800, rank: 8, trend: 'stable' as const }, // Gengar
    { pokemonId: 130, favoriteCount: 7200, rank: 9, trend: 'up' as const },   // Gyarados
    { pokemonId: 149, favoriteCount: 6900, rank: 10, trend: 'down' as const } // Dragonite
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private pokeApiService: PokeApiService,
    private favoritesService: FavoritesService,
    private audioService: AudioService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadRanking();
    this.loadLocalRanking();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadRanking() {
    this.loading = true;
    const loading = await this.loadingController.create({
      message: await this.translate.get('LOADING_RANKING').toPromise()
    });
    await loading.present();

    try {
      // Simular carregamento do ranking global
      await this.loadGlobalRanking();

    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
      await this.showErrorToast('ERROR_LOADING_RANKING');
    } finally {
      this.loading = false;
      await loading.dismiss();
    }
  }

  private async loadGlobalRanking() {
    // Carregar dados dos Pokémon do ranking
    const pokemonPromises = this.mockGlobalData.map(async (item) => {
      const pokemon = await this.pokeApiService.getPokemon(item.pokemonId).toPromise();
      return {
        pokemon: pokemon!,
        favoriteCount: item.favoriteCount,
        rank: item.rank,
        trend: item.trend
      };
    });

    this.globalRanking = await Promise.all(pokemonPromises);
  }

  private async loadLocalRanking() {
    // Criar ranking local baseado nos favoritos do usuário
    this.favoritesService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (favorites) => {
        if (favorites.length === 0) {
          this.localRanking = [];
          return;
        }

        // Simular contagem de favoritos locais (apenas para demonstração)
        const localPromises = favorites.slice(0, 10).map(async (fav, index) => {
          const pokemon = await this.pokeApiService.getPokemon(fav.pokemon_id).toPromise();
          return {
            pokemon: pokemon!,
            favoriteCount: Math.floor(Math.random() * 100) + 50, // Mock count
            rank: index + 1,
            trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'
          };
        });

        this.localRanking = await Promise.all(localPromises);
      });
  }

  switchView(mode: 'global' | 'local') {
    this.viewMode = mode;
    this.playSound();
  }

  getCurrentRanking(): PokemonRanking[] {
    return this.viewMode === 'global' ? this.globalRanking : this.localRanking;
  }

  get currentRanking(): PokemonRanking[] {
    return this.getCurrentRanking();
  }

  getRankBadgeColor(rank: number): string {
    switch (rank) {
      case 1: return 'warning'; // Ouro
      case 2: return 'medium'; // Prata
      case 3: return 'tertiary'; // Bronze
      default: return 'primary';
    }
  }

  getRankIcon(rank: number): string {
    switch (rank) {
      case 1: return 'trophy';
      case 2: return 'medal';
      case 3: return 'medal';
      default: return 'ribbon';
    }
  }

  getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'stable': return 'remove';
    }
  }

  getTrendColor(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return 'success';
      case 'down': return 'danger';
      case 'stable': return 'medium';
    }
  }

  async toggleFavorite(pokemon: Pokemon, event: Event) {
    event.stopPropagation();

    try {
      await this.favoritesService.toggleFavorite(pokemon);
      await this.audioService.playSound('/assets/audio/click.wav');

      const isFavorite = await this.favoritesService.isFavorite(pokemon.id);
      const message = isFavorite ? 'ADDED_TO_FAVORITES' : 'REMOVED_FROM_FAVORITES';
      await this.showToast(message, pokemon.name);

    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      await this.showErrorToast('ERROR_TOGGLE_FAVORITE');
    }
  }

  async isFavorite(pokemonId: number): Promise<boolean> {
    return await this.favoritesService.isFavorite(pokemonId);
  }

  async onRefresh(event: any) {
    await this.loadRanking();
    await this.loadLocalRanking();
    event.target.complete();
  }

  getStatsTotal(pokemon: Pokemon): number {
    return pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);
  }

  formatFavoriteCount(count: number): string {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  private async playSound() {
    try {
      await this.audioService.playSound('/assets/audio/switch.wav');
    } catch (error) {
      // Ignore sound errors
    }
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
