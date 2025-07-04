import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, firstValueFrom, timeout } from 'rxjs';
import { AudioService } from '../../../core/services/audio.service';
import { CapturedService } from '../../../core/services/captured.service';
import { PokeApiService } from '../../../core/services/pokeapi.service';
import { SyncService } from '../../../core/services/sync.service';
import { Pokemon } from '../../../models/pokemon.model';
import { environment } from '../../../../environments/environment';

interface PokemonRanking {
  pokemon: Pokemon;
  favoriteCount: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

interface BackendRankingItem {
  pokemon_id: number;
  favorite_count: number;
  trend?: 'up' | 'down' | 'stable';
}

interface LocalRankingItem {
  pokemonId: number;
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
      front_default: 'assets/img/placeholder.png',
      front_shiny: 'assets/img/placeholder.png',
      back_default: 'assets/img/placeholder.png',
      back_shiny: 'assets/img/placeholder.png',
      other: {
        'official-artwork': {
          front_default: 'assets/img/placeholder.png'
        },
        home: {
          front_default: 'assets/img/placeholder.png',
          front_shiny: 'assets/img/placeholder.png'
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

  showDetailsModal = false;
  selectedPokemonId: number | null = null;

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

  // Método para retry com backoff
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.warn(`🔄 Tentativa ${attempt}/${maxRetries} falhou:`, error);

        if (attempt === maxRetries) {
          throw error; // Re-throw on last attempt
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Retry failed'); // This should never be reached
  }

  // Substitui o mock por busca real do backend + detalhes da PokeAPI
  async loadRanking() {
    this.loading = true;
    const loading = await this.loadingController.create({
      message: await firstValueFrom(this.translate.get('ranking_page.loading_ranking'))
    });
    await loading.present();

    try {
      console.log('🚀 Iniciando carregamento do ranking...');
      console.log('🔗 Backend URL:', environment.apiUrl);

      const backendRanking: BackendRankingItem[] = await this.retryWithBackoff(async () => {
        return await firstValueFrom(
          this.pokeApiService.getGlobalRankingFromBackend(10).pipe(timeout(30000))
        );
      }, 3, 2000); // 3 tentativas, começando com 2s de delay

      if (!backendRanking || backendRanking.length === 0) {
        console.warn('⚠️ Backend retornou dados vazios');
        this.globalRanking = [];
        this.currentRanking = [];
        return;
      }

      console.log(`✅ Backend retornou ${backendRanking.length} itens de ranking`);

      // Mapeamento snake_case -> camelCase
      const mappedRanking = backendRanking.map((item: BackendRankingItem, idx: number) => ({
        pokemonId: item.pokemon_id,
        favoriteCount: item.favorite_count,
        rank: idx + 1,
        trend: item.trend ?? 'stable'
      }));

      // BUSCA OS DETALHES DE CADA POKÉMON
      console.log('📋 Buscando detalhes dos Pokémons...');
      const pokemonPromises = mappedRanking.map(async (item: any) => {
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

      console.log(`🎯 Ranking carregado com sucesso: ${this.currentRanking.length} Pokémons`);
    } catch (error) {
      console.error('🚨 Erro detalhado ao carregar ranking:', error);
      console.error('🔗 URL do backend:', `${environment.apiUrl}/api/v1/ranking/`);

      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          console.error('⏰ Timeout após 30 segundos - Backend pode estar lento ou fora do ar');
          await this.showErrorToast('Timeout: Backend não respondeu em 30s. Tente novamente.');
        } else if (error.message.includes('ERR_NETWORK')) {
          console.error('🌐 Erro de rede - Possível problema de conectividade');
          await this.showErrorToast('Erro de rede: Verifique sua conexão com a internet.');
        } else if (error.message.includes('CORS')) {
          console.error('🔒 Erro de CORS - Backend não está aceitando requisições do frontend');
          await this.showErrorToast('Erro de CORS: Backend não autorizado.');
        } else {
          console.error('❌ Erro genérico:', error.message);
          await this.showErrorToast(`Erro: ${error.message}`);
        }
      } else {
        console.error('❓ Erro desconhecido:', error);
        await this.showErrorToast('Erro desconhecido ao carregar ranking.');
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
      const response: LocalRankingItem[] = await firstValueFrom(
        this.pokeApiService.getLocalRanking(region).pipe(timeout(30000))
      );
      if (!response) throw new Error('Resposta indefinida ao buscar ranking local');
      const pokemonPromises = response.map(async (item: LocalRankingItem) => {
        const pokemon = await firstValueFrom(
          this.pokeApiService.getPokemon(item.pokemonId).pipe(timeout(30000))
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

      const isCaptured = await this.isCaptured(pokemon.id);
      // Atualiza o cache
      this.capturedCache.set(pokemon.id, isCaptured);
      this.capturedStates.set(pokemon.id, isCaptured);

      const message = isCaptured ? 'ranking_page.added_to_captured' : 'ranking_page.removed_from_captured';
      await this.showToast(message, pokemon.name);

    } catch (error) {
      console.error('Erro ao alternar captura:', error);
      await this.showErrorToast('ranking_page.error_toggle_capture');
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
    return pokemon?.stats?.reduce((total: number, stat: any) => total + stat.base_stat, 0) || 0;
  }

  formatFavoriteCount(count: number): string {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
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
      return 'assets/img/placeholder.png';
    }

    // Verifica cache primeiro
    if (this.pokemonImageCache.has(pokemon.id)) {
      return this.pokemonImageCache.get(pokemon.id)!;
    }

    // Busca imagem oficial
    const imageUrl = pokemon.sprites?.other?.['official-artwork']?.front_default ||
                    pokemon.sprites?.front_default ||
                    'assets/img/placeholder.png';

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
      (capturedPokemons || []).forEach((cap: any) => {
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

  openDetailsModal(pokemonId: number) {
    this.selectedPokemonId = pokemonId;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedPokemonId = null;
  }
}
