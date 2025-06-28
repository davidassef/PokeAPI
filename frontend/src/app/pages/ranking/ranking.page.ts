import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, firstValueFrom, timeout } from 'rxjs';
import { AudioService } from '../../core/services/audio.service';
import { CapturedService } from '../../core/services/captured.service';
import { PokeApiService } from '../../core/services/pokeapi.service';
import { SyncService } from '../../core/services/sync.service';
import { Pokemon } from '../../models/pokemon.model';

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
  currentRanking: PokemonRanking[] = [];
  viewMode: 'global' | 'local' = 'global';
  loading = false;

  // Cache para evitar chamadas repetidas
  private capturedCache = new Map<number, boolean>();
  private pokemonImageCache = new Map<number, string>();
  // Propriedade para armazenar capturas de forma síncrona
  capturedStates = new Map<number, boolean>();

  // Objeto placeholder estático para evitar loop infinito
  private static readonly PLACEHOLDER_POKEMON: Pokemon = {
    id: 0,
    name: 'Unknown',
    types: [],
    stats: [],
    height: 0,
    weight: 0,
    base_experience: 0,
    order: 0,
    sprites: {
      front_default: 'assets/images/placeholder.png',
      front_shiny: 'assets/images/placeholder.png',
      back_default: 'assets/images/placeholder.png',
      back_shiny: 'assets/images/placeholder.png',
      other: {
        'official-artwork': {
          front_default: 'assets/images/placeholder.png'
        },
        home: {
          front_default: 'assets/images/placeholder.png',
          front_shiny: 'assets/images/placeholder.png'
        }
      }
    },
    abilities: [],
    species: {
      name: 'Unknown',
      url: ''
    },
    moves: [],
  };

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
    private capturedService: CapturedService,
    private audioService: AudioService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private translate: TranslateService,
    private syncService: SyncService
  ) {}

  ngOnInit() {
    this.loadRanking();
    this.loadLocalRanking('default-region');
    this.loadCapturedStates();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Refatoração: Simplificar métodos de carregamento e validação de dados
  private async loadRankingData(endpoint: 'getGlobalRanking' | 'getLocalRanking', region?: string): Promise<PokemonRanking[]> {
    try {
      const response = endpoint === 'getGlobalRanking'
        ? await this.pokeApiService.getGlobalRanking().toPromise()
        : await this.pokeApiService.getLocalRanking(region!).toPromise();

      if (!response) throw new Error(`Resposta indefinida ao buscar dados de ${endpoint}`);

      const pokemonPromises = response.map(async (item: { pokemonId: number; favoriteCount: number; rank: number; trend: 'up' | 'down' | 'stable'; }) => {
        const pokemon = await this.pokeApiService.getPokemon(item.pokemonId).toPromise();
        return {
          pokemon: pokemon!,
          favoriteCount: item.favoriteCount,
          rank: item.rank,
          trend: item.trend
        };
      });

      return await Promise.all(pokemonPromises);
    } catch (error) {
      console.error(`Erro ao carregar dados de ${endpoint}:`, error);
      await this.showErrorToast(`ERROR_LOADING_${endpoint.toUpperCase()}`);
      return [];
    }
  }

  // Substitui o mock por busca real do backend + detalhes da PokeAPI
  async loadRanking() {
    this.loading = true;
    const loading = await this.loadingController.create({
      message: await firstValueFrom(this.translate.get('ranking_page.loading_ranking'))
    });
    await loading.present();
    try {
      const backendRanking = await firstValueFrom(
        this.pokeApiService.getGlobalRankingFromBackend(10).pipe(timeout(10000))
      );
      if (!backendRanking || backendRanking.length === 0) {
        this.globalRanking = [];
        this.currentRanking = [];
        return;
      }
      // Mapeamento snake_case -> camelCase
      const mappedRanking = backendRanking.map((item: any, idx: number) => ({
        pokemonId: item.pokemon_id,
        favoriteCount: item.favorite_count,
        rank: idx + 1,
        trend: item.trend ?? 'stable'
      }));

      // BUSCA OS DETALHES DE CADA POKÉMON
      const pokemonPromises = mappedRanking.map(async (item) => {
        const pokemon = await this.pokeApiService.getPokemon(item.pokemonId).toPromise();
        return {
          pokemon: pokemon!,
          favoriteCount: item.favoriteCount,
          rank: item.rank,
          trend: item.trend
        };
      });
      this.globalRanking = await Promise.all(pokemonPromises);
      this.currentRanking = this.globalRanking.filter(item => item.pokemon && item.pokemon.id > 0);
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        await this.showErrorToast('Tempo limite ao carregar ranking. Tente novamente.');
      } else {
        await this.showErrorToast('ERROR_LOADING_RANKING');
      }
      this.globalRanking = [];
      this.currentRanking = [];
    } finally {
      this.loading = false;
      await loading.dismiss();
    }
  }

  private async loadLocalRanking(region: string) {
    try {
      const response = await firstValueFrom(
        this.pokeApiService.getLocalRanking(region).pipe(timeout(10000))
      );
      if (!response) throw new Error('Resposta indefinida ao buscar ranking local');
      const pokemonPromises = response.map(async (item) => {
        const pokemon = await firstValueFrom(
          this.pokeApiService.getPokemon(item.pokemonId).pipe(timeout(10000))
        );
        return {
          pokemon: pokemon!,
          favoriteCount: item.favoriteCount,
          rank: item.rank,
          trend: item.trend
        };
      });
      this.localRanking = await Promise.all(pokemonPromises);
    } catch (error) {
      console.error('Erro ao carregar ranking local:', error);
      this.localRanking = [];
    }
  }

  switchView(mode: 'global' | 'local') {
    this.viewMode = mode;
    this.currentRanking = mode === 'global' ? this.globalRanking : this.localRanking;
  }

  getCurrentRanking(): PokemonRanking[] {
    return this.currentRanking;
  }

  getRankBadgeColor(rank: number): string {
    if (rank === 1) return '#FFD700'; // Ouro
    if (rank === 2) return '#C0C0C0'; // Prata
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#6C757D'; // Cinza
  }

  getRankIcon(rank: number): string {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  }

  getTrendColor(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return '#28a745';
      case 'down': return '#dc3545';
      default: return '#6c757d';
    }
  }

  async toggleFavorite(pokemon: Pokemon, event: Event) {
    event.stopPropagation();

    try {
      await this.capturedService.toggleCaptured(pokemon);
      await this.audioService.playSound('/assets/audio/click.wav');

      const isCaptured = await this.isCaptured(pokemon.id);
      // Atualiza o cache
      this.capturedCache.set(pokemon.id, isCaptured);
      this.capturedStates.set(pokemon.id, isCaptured);
      
      const message = isCaptured ? 'ADDED_TO_CAPTURED' : 'REMOVED_FROM_CAPTURED';
      await this.showToast(message, pokemon.name);

    } catch (error) {
      console.error('Erro ao alternar captura:', error);
      await this.showErrorToast('ERROR_TOGGLE_CAPTURE');
    }
  }

  async isCaptured(pokemonId: number): Promise<boolean> {
    // Verifica cache primeiro
    if (this.capturedCache.has(pokemonId)) {
      return this.capturedCache.get(pokemonId)!;
    }
    
    const result = await this.capturedService.isCaptured(pokemonId);
    this.capturedCache.set(pokemonId, result);
    this.capturedStates.set(pokemonId, result);
    return result;
  }

  isCapturedSync(pokemonId: number): boolean {
    return this.capturedStates.get(pokemonId) || false;
  }

  async onRefresh(event: any) {
    try {
      await this.loadRanking();
      await this.loadLocalRanking('default-region');
      await this.loadCapturedStates();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      event.target.complete();
    }
  }

  getStatsTotal(pokemon: Pokemon | null): number {
    return pokemon?.stats?.reduce((total, stat) => total + stat.base_stat, 0) || 0;
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
      await this.audioService.playSound('/assets/audio/click.wav');
    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  }

  private async showToast(messageKey: string, pokemonName?: string) {
    const message = await firstValueFrom(this.translate.get(messageKey));
    const toast = await this.toastController.create({
      message: pokemonName ? `${pokemonName}: ${message}` : message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  private async showErrorToast(messageKey: string) {
    const message = await firstValueFrom(this.translate.get(messageKey));
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  getSafePokemon(pokemon: Pokemon | null): Pokemon {
    return pokemon || RankingPage.PLACEHOLDER_POKEMON;
  }

  getSafePokemonImage(pokemon: Pokemon | null): string {
    if (!pokemon || pokemon.id === 0) {
      return 'assets/images/placeholder.png';
    }
    
    // Verifica cache primeiro
    if (this.pokemonImageCache.has(pokemon.id)) {
      return this.pokemonImageCache.get(pokemon.id)!;
    }
    
    // Busca imagem oficial
    const imageUrl = pokemon.sprites?.other?.['official-artwork']?.front_default ||
                    pokemon.sprites?.front_default ||
                    'assets/images/placeholder.png';
    
    // Cache a URL
    this.pokemonImageCache.set(pokemon.id, imageUrl);
    return imageUrl;
  }

  getSafePokemonName(pokemon: Pokemon | null): string {
    return pokemon?.name || 'Unknown';
  }

  getSafeFavoriteCount(count: number | null): number {
    return count || 0;
  }

  getSafeTypeName(typeName: string | null): string {
    return typeName || 'unknown';
  }

  getSafeTrend(trend: 'up' | 'down' | 'stable' | null): 'up' | 'down' | 'stable' {
    return trend || 'stable';
  }

  trackByPokemonId(index: number, item: PokemonRanking): number {
    return item.pokemon.id;
  }

  private async loadCapturedStates() {
    try {
      const capturedPokemons = await this.capturedService.getCaptured().toPromise();
      (capturedPokemons || []).forEach(cap => {
        this.capturedCache.set(cap.pokemon_id, true);
        this.capturedStates.set(cap.pokemon_id, true);
      });
    } catch (error) {
      console.error('Erro ao carregar estados de captura:', error);
    }
  }

  getRankingBadgeClass(rank: number): string {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'blue';
  }
}
