import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, LoadingController, ToastController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, firstValueFrom, takeUntil, timeout } from 'rxjs';
import { AudioService } from '../../../core/services/audio.service';
import { CapturedService } from '../../../core/services/captured.service';
import { PokeApiService } from '../../../core/services/pokeapi.service';
import { SyncService } from '../../../core/services/sync.service';
import { Pokemon } from '../../../models/pokemon.model';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { User } from 'src/app/models/user.model';
import { AuthModalNewComponent } from '../../../shared/components/auth-modal-new/auth-modal-new.component';

interface PokemonRanking {
  pokemon: Pokemon;
  favoriteCount: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  updatedAt?: string; // Adiciona a propriedade updatedAt como opcional
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
  debounceTimer: any = null;
  toggleDebounceTimer: { [key: number]: any } = {};

  // Métodos auxiliares para ranking - Implementações mantidas no final da classe

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

  /**
   * Cria um Pokémon de placeholder com um ID específico
   * @param id ID do Pokémon
   */
  private getPlaceholderPokemon(id: number): Pokemon {
    return {
      ...RankingPage.PLACEHOLDER_POKEMON,
      id,
      name: `Pokémon #${id}`,
      sprites: {
        ...RankingPage.PLACEHOLDER_POKEMON.sprites,
        other: {
          'official-artwork': {
            front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
          },
          home: {
            front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`,
            front_shiny: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/${id}.png`
          }
        }
      }
    };
  }

  /**
   * Obtém um valor seguro para a tendência do ranking
   * @param trend Valor da tendência que pode ser nulo ou indefinido
   * @returns Valor numérico da tendência ou 0 se for nulo/indefinido
   */
  private getSafeTrend(trend: 'up' | 'down' | 'stable' | null | undefined): 'up' | 'down' | 'stable' {
    return trend || 'stable';
  }

  /**
   * Atualiza o estado de captura dos Pokémons no ranking
   * @param ranking Lista de itens do ranking
   */
  private async updateCapturedStates(ranking: PokemonRanking[]): Promise<PokemonRanking[]> {
    if (!ranking || ranking.length === 0) return [];

    try {
      // Verifica se o usuário está autenticado
      if (!this.authService.isAuthenticated()) {
        return ranking;
      }

      // Obtém os estados de captura em lote para melhor desempenho
      const pokemonIds = ranking.map(item => item.pokemon.id);
      const capturedStates = await this.capturedService.getCapturedStates(pokemonIds);

      // Atualiza o cache local de estados de captura
      Object.entries(capturedStates).forEach(([pokemonId, isCaptured]) => {
        const id = parseInt(pokemonId, 10);
        if (!isNaN(id)) {
          this.capturedStates.set(id, isCaptured);
        }
      });

      // Atualiza os itens do ranking com o estado de captura
      return ranking.map(item => ({
        ...item,
        pokemon: {
          ...item.pokemon,
          isCaptured: this.capturedStates.get(item.pokemon.id) || false
        }
      }));
    } catch (error) {
      console.error('Erro ao atualizar estados de captura:', error);
      return ranking; // Retorna o ranking sem alterações em caso de erro
    }
  }

  /**
   * Atualiza o ranking atual com os estados de captura mais recentes
   */
  private updateCurrentRankingWithCapturedStates(): void {
    if (!this.currentRanking) {
      return;
    }

    this.currentRanking = this.currentRanking.map(item => ({
      ...item,
      pokemon: {
        ...item.pokemon,
        isCaptured: this.capturedStates.get(item.pokemon.id) || false
      }
    }));

    this.cdRef.detectChanges();
  }

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

  isAuthenticated = false;
  user: User | null = null;
  showUserMenu = false;

  abrirLogin = async () => {
    const modal = await this.modalController.create({
      component: AuthModalNewComponent,
      cssClass: 'auth-modal-fixed'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.success) {
        // Login bem-sucedido, atualizar estado
        this.isAuthenticated = this.authService.isAuthenticated();
        if (this.isAuthenticated) {
          this.user = this.authService.getCurrentUser();
        }
      }
    });

    return await modal.present();
  };

  abrirPerfil = () => {
    // TODO: Implementar modal de perfil
    console.log('Abrir perfil');
  };

  logout = () => {
    this.authService.logout();
    this.isAuthenticated = false;
    this.user = null;
  };

  toggleUserMenu = () => {
    this.showUserMenu = !this.showUserMenu;
  };

  constructor(
    private pokeApiService: PokeApiService,
    private capturedService: CapturedService,
    private audioService: AudioService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private translate: TranslateService,
    private syncService: SyncService,
    private authService: AuthService,
    private cdRef: ChangeDetectorRef,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      this.user = this.authService.getCurrentUser();
    }
    this.loadRanking();
    this.loadLocalRanking('default-region');
    this.loadCapturedStates();
  }

  ionViewWillEnter() {
    document.body.classList.add('ranking-page-active');
  }

  ionViewWillLeave() {
    document.body.classList.remove('ranking-page-active');
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

  // Carrega o ranking global ou local com cache e otimizações
  async loadRanking() {
    // Mostra o indicador de carregamento apenas se não estiver em atualização rápida
    const isQuickUpdate = this.globalRanking.length > 0;
    let loading: HTMLIonLoadingElement | null = null;

    if (!isQuickUpdate) {
      this.loading = true;
      loading = await this.loadingController.create({
        message: await this.translate.get('ranking_page.loading_ranking').toPromise(),
        duration: 30000, // Timeout de 30 segundos
        spinner: 'crescent'
      });
      await loading.present().catch(console.error);
    }

    try {
      console.log('🚀 Iniciando carregamento do ranking...');

      // Usa cache local para dados recentes se disponível
      const cacheKey = `ranking_${this.viewMode}_${new Date().toISOString().split('T')[0]}`;
      const cachedData = localStorage.getItem(cacheKey);

      let backendRanking: BackendRankingItem[] = [];

      if (cachedData && !isQuickUpdate) {
        console.log('📦 Usando dados em cache para ranking');
        backendRanking = JSON.parse(cachedData);
      } else {
        console.log('🌐 Buscando dados atualizados do ranking no backend...');
        backendRanking = await this.retryWithBackoff(async () => {
          const data = await firstValueFrom(
            this.pokeApiService.getGlobalRankingFromBackend(15).pipe(timeout(30000))
          );
          // Atualiza o cache local
          localStorage.setItem(cacheKey, JSON.stringify(data));
          return data;
        }, 3, 2000); // 3 tentativas, começando com 2s de delay
      }

      if (!backendRanking || backendRanking.length === 0) {
        console.warn('⚠️ Backend retornou dados vazios');
        this.globalRanking = [];
        this.currentRanking = [];
        return;
      }

      console.log(`✅ Backend retornou ${backendRanking.length} itens de ranking`);

      // Mapeamento snake_case -> camelCase com tratamento de erros
      const mappedRanking = backendRanking
        .filter(item => item && item.pokemon_id)
        .map((item: BackendRankingItem, idx: number) => {
          // Garante que o trend seja um dos valores válidos
          const validTrends = ['up', 'down', 'stable'] as const;
          const trend = validTrends.includes(item.trend as any)
            ? item.trend as 'up' | 'down' | 'stable'
            : 'stable';

          return {
            pokemonId: item.pokemon_id,
            favoriteCount: item.favorite_count || 0,
            rank: idx + 1,
            trend: trend,
            // Adiciona timestamp para controle de atualização
            updatedAt: new Date().toISOString()
          };
        });

      // Busca os detalhes dos Pokémons com cache local
      console.log('📋 Buscando detalhes dos Pokémons...');

      const pokemonPromises = mappedRanking.map(async (item: any) => {
        try {
          // Tenta obter do cache primeiro
          const cacheKey = `pokemon_${item.pokemonId}`;
          const cachedPokemon = localStorage.getItem(cacheKey);

          let pokemon: Pokemon;

          if (cachedPokemon) {
            pokemon = JSON.parse(cachedPokemon);
            console.log(`🔄 Usando Pokémon ${item.pokemonId} do cache`);
          } else {
            pokemon = await firstValueFrom(this.pokeApiService.getPokemon(item.pokemonId));
            // Armazena no cache por 1 dia
            localStorage.setItem(cacheKey, JSON.stringify(pokemon));
          }

          return {
            pokemon: pokemon || this.getPlaceholderPokemon(item.pokemonId),
            favoriteCount: item.favoriteCount,
            rank: item.rank,
            trend: item.trend,
            updatedAt: item.updatedAt
          };
        } catch (error) {
          console.error(`❌ Erro ao carregar Pokémon ${item.pokemonId}:`, error);
          return {
            pokemon: this.getPlaceholderPokemon(item.pokemonId),
            favoriteCount: item.favoriteCount,
            rank: item.rank,
            trend: 'stable' as const, // Garante que o tipo seja literal 'stable'
            updatedAt: item.updatedAt,
            error: true
          } as PokemonRanking & { error: boolean }; // Tipo explícito para o objeto retornado
        }
      });

      // Atualiza o ranking com os novos dados
      const newRanking = await Promise.all(pokemonPromises);

      // Filtra itens inválidos e mapeia para o tipo correto
      const validRanking: PokemonRanking[] = [];

      for (const item of newRanking) {
        // Pula itens com erro ou sem dados obrigatórios
        if ('error' in item || !item.pokemon || item.favoriteCount === undefined || item.rank === undefined) {
          continue;
        }

        // Cria o item do ranking com a tipagem correta
        const rankingItem: PokemonRanking = {
          pokemon: item.pokemon,
          favoriteCount: item.favoriteCount,
          rank: item.rank,
          trend: this.getSafeTrend(item.trend)
        };

        // Adiciona updatedAt se existir
        if ('updatedAt' in item) {
          rankingItem.updatedAt = item.updatedAt as string;
        }

        validRanking.push(rankingItem);
      }

      // Mantém o estado de captura dos Pokémons
      const updatedRanking = await this.updateCapturedStates(validRanking);

      // Atualiza as propriedades reativas
      this.globalRanking = updatedRanking;
      this.currentRanking = updatedRanking.filter(item => item.pokemon && item.pokemon.id > 0);

      console.log(`🎯 Ranking atualizado: ${this.currentRanking.length} Pokémons carregados`);
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
      if (loading) {
        await loading.dismiss().catch(console.error);
      }
    }
  }

  /**
   * Carrega o ranking local para uma região específica
   * @param region Região para carregar o ranking
   */
  private async loadLocalRanking(region: string): Promise<void> {
    try {
      const response: LocalRankingItem[] = await firstValueFrom(
        this.pokeApiService.getLocalRanking(region).pipe(timeout(30000))
      );

      if (!response) {
        throw new Error('Resposta indefinida ao buscar ranking local');
      }

      const pokemonPromises = response.map(async (item: LocalRankingItem) => {
        try {
          const pokemon = await firstValueFrom(
            this.pokeApiService.getPokemon(item.pokemonId).pipe(timeout(30000))
          );

          return {
            pokemon: pokemon!,
            favoriteCount: item.favoriteCount,
            rank: item.rank,
            trend: item.trend || 'stable', // Valor padrão para trend
            updatedAt: new Date().toISOString()
          } as PokemonRanking;
        } catch (error) {
          console.error(`Erro ao carregar Pokémon ${item.pokemonId}:`, error);
          return {
            pokemon: this.getPlaceholderPokemon(item.pokemonId),
            favoriteCount: item.favoriteCount,
            rank: item.rank,
            trend: 'stable' as const,
            updatedAt: new Date().toISOString(),
            error: true
          } as PokemonRanking & { error: boolean };
        }
      });

      // Atualiza o ranking local com os novos dados
      const newRanking = await Promise.all(pokemonPromises);
      this.localRanking = newRanking.filter((item): item is PokemonRanking => !('error' in item));

      // Se estiver na visualização local, atualiza o ranking atual
      if (this.viewMode === 'local') {
        this.currentRanking = [...this.localRanking];
        await this.updateCapturedStates(this.currentRanking);
        this.updateCurrentRankingWithCapturedStates();
        this.cdRef.detectChanges();
      }

    } catch (error) {
      console.error('Erro ao carregar ranking local:', error);
      this.showErrorToast('ERROR_LOADING_LOCAL_RANKING');
      this.localRanking = [];
    }
  }

  /**
   * Alterna entre as visualizações global e local
   * @param mode Modo de visualização ('global' ou 'local')
   */
  async switchView(mode: 'global' | 'local'): Promise<void> {
    if (this.viewMode === mode) {
      return; // Já está na visualização solicitada
    }

    this.viewMode = mode;

    try {
      // Aplica o debounce de 300ms
      await new Promise<void>((resolve) => {
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(async () => {
          try {
            // Atualiza o ranking atual com base na visualização selecionada
            this.currentRanking = mode === 'global' ? [...this.globalRanking] : [...this.localRanking];

            // Atualiza os estados de captura para o ranking atual
            if (this.currentRanking.length > 0) {
              console.log(`[Ranking] Atualizando estados de captura para ${this.currentRanking.length} itens`);
              await this.updateCapturedStates(this.currentRanking);
              this.updateCurrentRankingWithCapturedStates();
            } else {
              console.log(`[Ranking] Ranking ${mode} vazio, carregando dados...`);
              // Se o ranking estiver vazio, força o recarregamento
              if (mode === 'global') {
                await this.loadRanking();
              } else {
                // Se for o ranking local, carrega uma região padrão
                await this.loadLocalRanking('kanto'); // Você pode querer tornar isso configurável
              }
            }

            this.cdRef.detectChanges();
            resolve();
          } catch (error) {
            console.error(`[Ranking] Erro ao alternar para visualização ${mode}:`, error);
            this.showErrorToast('ERROR_SWITCHING_VIEW');
            resolve(); // Garante que a promise seja resolvida mesmo em caso de erro
          }
        }, 300); // Debounce de 300ms
      });
    } catch (error) {
      console.error(`[Ranking] Erro no debounce da troca de visualização:`, error);
      this.showErrorToast('ERROR_SWITCHING_VIEW');
    }
  }

  getCurrentRanking(): PokemonRanking[] {
    return this.currentRanking;
  }

  // Implementações dos métodos auxiliares para ranking
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

  /**
   * Carrega os estados de captura dos Pokémons
   */
  private async loadCapturedStates(): Promise<void> {
    try {
      const capturedPokemons = await firstValueFrom(this.capturedService.getCaptured());
      this.capturedCache.clear();
      this.capturedStates.clear();

      capturedPokemons.forEach(pokemon => {
        this.capturedCache.set(pokemon.pokemon_id, true);
        this.capturedStates.set(pokemon.pokemon_id, true);
      });

      this.cdRef.detectChanges();
    } catch (error) {
      console.error('[Ranking] Erro ao carregar estados de captura:', error);
      throw error; // Propaga o erro para ser tratado pelo chamador
    }
  }

  /**
   * Exibe uma mensagem de sucesso
   */
  private async showToast(message: string, params?: any): Promise<void> {
    try {
      const translatedMessage = await this.translate.get(message, params).toPromise();
      const toast = await this.toastController.create({
        message: translatedMessage,
        duration: 3000,
        position: 'bottom',
        color: 'success',
        buttons: [{
          icon: 'close',
          role: 'cancel'
        }]
      });
      await toast.present();
    } catch (error) {
      console.error('[Ranking] Erro ao exibir toast:', error);
    }
  }

  /**
   * Exibe uma mensagem de erro
   */
  private async showErrorToast(message: string, params?: any): Promise<void> {
    const toast = await this.toastController.create({
      message: await this.translate.get(message, params).toPromise(),
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  /**
   * Manipulador de evento para quando um Pokémon é capturado ou liberado
   * @param event Objeto com o Pokémon e o estado de captura
   */
  /**
   * Manipulador para alternar o estado de captura de um Pokémon
   * @param event Objeto contendo o Pokémon e o novo estado de captura
   */
  /**
   * Manipulador para alternar o estado de captura de um Pokémon
   * @param event Objeto contendo o Pokémon e o novo estado de captura
   */
  async onCaptureToggle(event: { pokemon: Pokemon, isCaptured: boolean }): Promise<void> {
    if (!event?.pokemon) {
      console.error('[Ranking] Evento de captura inválido:', event);
      return;
    }

    const { pokemon, isCaptured } = event;
    const pokemonId = pokemon.id;
    const action = isCaptured ? 'capturado' : 'liberado';

    // Se já existe um debounce em andamento para este Pokémon, ignora o novo evento
    if (this.toggleDebounceTimer[pokemonId]) {
      console.log(`[Ranking] Ignorando clique rápido para o Pokémon ${pokemonId}`);
      return;
    }

    // Configura o debounce
    this.toggleDebounceTimer[pokemonId] = window.setTimeout(() => {
      delete this.toggleDebounceTimer[pokemonId];
    }, 1000);

    const loadingMessage = isCaptured ? 'capturing_pokemon' : 'releasing_pokemon';
    console.log(`[Ranking] Iniciando processo para ${action} o Pokémon ${pokemon.name} (ID: ${pokemonId})`);

    let loading: HTMLIonLoadingElement | null = null;

    try {
      // Mostra feedback visual imediato
      const translatedMessage = await firstValueFrom(this.translate.get(loadingMessage));
      loading = await this.loadingController.create({
        message: translatedMessage,
        duration: 5000,
        spinner: 'crescent',
        backdropDismiss: false
      });

      await loading.present();

      // Atualização otimista da UI
      this.capturedCache.set(pokemonId, isCaptured);
      this.capturedStates.set(pokemonId, isCaptured);
      this.cdRef.detectChanges();

      // Executa a ação de captura/liberação
      console.log(`[Ranking] Executando ação de ${action} no servidor...`);

      // Executa a ação de forma assíncrona
      await this.capturedService.toggleCaptured(pokemon);

      // Atualiza os estados de captura e ranking
      console.log('[Ranking] Atualizando estados de captura e ranking...');
      await Promise.all([
        this.loadCapturedStates(),
        this.loadRanking()
      ]);

      // Feedback visual de sucesso
      const successMessage = isCaptured ? 'pokemon_captured' : 'pokemon_released';
      await this.showToast(successMessage, { name: pokemon.name });

    } catch (error: unknown) {
      console.error(`[Ranking] Erro ao ${action} o Pokémon:`, error);

      // Reverte a atualização otimista em caso de erro
      this.capturedCache.set(pokemonId, !isCaptured);
      this.capturedStates.set(pokemonId, !isCaptured);
      this.cdRef.detectChanges();

      // Tratamento de erros específicos
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          await this.showErrorToast('network_timeout');
          return;
        }

        // Verifica se é um erro HTTP
        const httpError = error as { status?: number };
        if (httpError.status === 401) {
          await this.showErrorToast('auth_required');
          return;
        }
      }

      // Erro genérico
      const errorMessage = isCaptured ? 'capture_error' : 'release_error';
      await this.showErrorToast(errorMessage, { name: pokemon.name });

    } finally {
      // Limpa o loading se ainda estiver aberto
      if (loading) {
        try {
          await loading.dismiss();
        } catch (e) {
          console.error('[Ranking] Erro ao fechar loading:', e);
        }
      }

      // Remove o debounce após a conclusão
      if (this.toggleDebounceTimer[pokemonId]) {
        clearTimeout(this.toggleDebounceTimer[pokemonId]);
        delete this.toggleDebounceTimer[pokemonId];
      }

      // Força uma nova verificação de rede
      try {
        await this.syncService.forceSyncNow();
      } catch (e) {
        console.error('[Ranking] Erro ao sincronizar:', e);
      }
    }

    console.log(`[Ranking] Processo de ${action} concluído para o Pokémon ${pokemon.name}`);
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
