/**
 * Componente da página de ranking mobile do PokeAPI_SYNC.
 *
 * Exibe o ranking global dos Pokémons mais favoritados pelos usuários
 * em formato otimizado para dispositivos móveis, incluindo pódio especial
 * para os 3 primeiros colocados e grid responsivo para os demais.
 */

import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, LoadingController, ToastController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, firstValueFrom, takeUntil, timeout, distinctUntilChanged } from 'rxjs';
import { AudioService } from '../../../core/services/audio.service';
import { CapturedService } from '../../../core/services/captured.service';
import { PokeApiService } from '../../../core/services/pokeapi.service';
import { SyncService } from '../../../core/services/sync.service';
import { Pokemon } from '../../../models/pokemon.model';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { User } from 'src/app/models/user.model';
import { AuthModalNewComponent } from '../../../shared/components/auth-modal-new/auth-modal-new.component';

/**
 * Interface para item do ranking com dados completos do Pokémon.
 * Representa um Pokémon no ranking com todas as informações necessárias
 * para exibição na interface mobile.
 */
interface PokemonRanking {
  pokemon: Pokemon;           // Dados completos do Pokémon da PokeAPI
  favoriteCount: number;      // Número de vezes que foi favoritado
  rank: number;              // Posição no ranking (1-25)
  trend: 'up' | 'down' | 'stable';  // Tendência de mudança de posição
  updatedAt?: string;        // Data da última atualização (opcional)
}

/**
 * Interface para dados brutos do ranking vindos do backend.
 * Representa a estrutura de dados recebida da API antes do processamento.
 */
interface BackendRankingItem {
  pokemon_id: number;        // ID do Pokémon na PokeAPI
  favorite_count: number;    // Contagem de favoritos no backend
  trend?: 'up' | 'down' | 'stable';  // Tendência opcional
}



@Component({
  selector: 'app-mobile-ranking',
  templateUrl: './ranking.page.html',
  styleUrls: ['./ranking.page.scss'],
})
export class RankingPage implements OnInit, OnDestroy {

  // ===== PROPRIEDADES PRINCIPAIS =====

  /** Ranking global completo dos Pokémons mais favoritados */
  globalRanking: PokemonRanking[] = [];

  /** Flag de carregamento para exibir indicadores visuais */
  loading = false;

  /** Timer para debounce de operações frequentes */
  debounceTimer: any = null;

  /** Timers individuais para debounce de toggle por Pokémon */
  toggleDebounceTimer: { [key: number]: any } = {};

  // ===== SISTEMA DE CACHE =====

  /** Cache de estados de captura para evitar consultas repetidas */
  private capturedCache = new Map<number, boolean>();

  /** Cache de URLs de imagens dos Pokémons */
  private pokemonImageCache = new Map<number, string>();

  /** Estados atuais de captura dos Pokémons exibidos */
  capturedStates = new Map<number, boolean>();

  // ===== CONFIGURAÇÕES MOBILE =====

  /** Flag indicando que está em modo mobile (sempre true neste componente) */
  isMobile = true;

  /** Flag para exibição compacta dos cards */
  showCompactView = true;

  // ===== SISTEMA DE REFRESH AUTOMÁTICO =====

  /** Flag para habilitar/desabilitar refresh automático do ranking */
  private autoRefreshEnabled = true;

  /** Intervalo de refresh automático em milissegundos (1 minuto) */
  private autoRefreshInterval = 60 * 1000;

  /** Timer do refresh automático */
  private autoRefreshTimer: any = null;

  /** Subject para controle de destruição de observables */
  private destroy$ = new Subject<void>();

  // ===== OBJETO PLACEHOLDER =====

  /**
   * Pokémon placeholder estático usado para evitar loops infinitos
   * e fornecer dados padrão quando um Pokémon não pode ser carregado.
   *
   * Contém estrutura completa com valores seguros para todas as propriedades
   * necessárias pela interface.
   */
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

  // ===== CONTROLE DE MODAIS =====

  /** Flag para controle de exibição do modal de detalhes */
  showDetailsModal = false;

  /** ID do Pokémon selecionado para exibir detalhes */
  selectedPokemonId: number | null = null;

  // ===== AUTENTICAÇÃO =====

  /** Status de autenticação do usuário atual */
  isAuthenticated = false;
  /** Dados do usuário autenticado atual */
  user: User | null = null;

  /** Flag para controle de exibição do menu de usuário */
  showUserMenu = false;

  // ===== SISTEMA DE BUSCA E FILTROS =====

  /** Flag para controle de exibição do sistema de busca */
  showSearch = false;

  /** Opções de filtro atualmente aplicadas */
  currentFilterOptions: any = {};

  // ===== SISTEMA DE LAZY LOADING =====

  /** Rankings atualmente exibidos na interface (subset do globalRanking) */
  displayedRanking: PokemonRanking[] = [];

  /** Número de itens a carregar inicialmente (pódio + primeiros do grid) */
  initialLoadSize = 10;

  /** Número de itens a carregar por vez no scroll infinito */
  loadMoreSize = 5;

  /** Flag para evitar carregamentos duplicados durante scroll infinito */
  isLoadingMore = false;

  /** Indica se há mais dados disponíveis para carregamento */
  hasMoreData = true;

  /**
   * Construtor do componente de ranking mobile.
   *
   * Injeta todas as dependências necessárias para funcionamento do ranking,
   * incluindo serviços de API, captura, sincronização, áudio e autenticação.
   */
  constructor(
    private pokeApiService: PokeApiService,
    private capturedService: CapturedService,
    private syncService: SyncService,
    private audioService: AudioService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    // ✅ CORREÇÃO: Inscrever-se no estado de autenticação reativo com refresh automático
    this.authService.getAuthState()
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged() // Só emite quando o estado realmente muda
      )
      .subscribe(async (isAuthenticated) => {
        console.log('[MobileRanking] Estado de autenticação atualizado:', isAuthenticated);

        const wasAuthenticated = this.isAuthenticated;
        this.isAuthenticated = isAuthenticated;

        if (isAuthenticated) {
          this.user = this.authService.getCurrentUser();
          console.log('[MobileRanking] Usuário carregado:', this.user);

          // ✅ REMOVIDO: Refresh automático agora é gerenciado globalmente pelo PostAuthRefreshService
        } else {
          this.user = null;
          console.log('[MobileRanking] Usuário deslogado');
        }
      });

    // Inscrever-se no usuário atual
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        console.log('[MobileRanking] Usuário atual atualizado:', user);
        this.user = user;
      });

    this.loadRanking();
    this.loadCapturedStates();

    // ✅ NOVO: Observar mudanças de captura em tempo real
    this.setupCapturedSubscription();

    // ✅ NOVO: Inicia auto-refresh após carregamento inicial
    setTimeout(() => {
      this.startAutoRefresh();
    }, 2000); // Aguarda 2 segundos após carregamento inicial
  }

  ionViewWillEnter() {
    document.body.classList.add('mobile-ranking-page-active');
  }

  ionViewWillLeave() {
    document.body.classList.remove('mobile-ranking-page-active');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopAutoRefresh();
  }

  // ✅ NOVO: Métodos para controle de auto-refresh
  private startAutoRefresh() {
    if (!this.autoRefreshEnabled) return;

    this.stopAutoRefresh(); // Para qualquer timer existente

    console.log(`🔄 [MOBILE-Ranking] Auto-refresh iniciado (intervalo: ${this.autoRefreshInterval / 1000}s)`);

    this.autoRefreshTimer = setInterval(async () => {
      if (this.autoRefreshEnabled && !this.loading) {
        console.log('🔄 [MOBILE-Ranking] Auto-refresh executando...');
        await this.loadRanking(false); // Não força refresh, usa cache inteligente
      }
    }, this.autoRefreshInterval);
  }

  private stopAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
      console.log('⏹️ [MOBILE-Ranking] Auto-refresh parado');
    }
  }

  public toggleAutoRefresh() {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;

    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }

    console.log(`🔄 [MOBILE-Ranking] Auto-refresh ${this.autoRefreshEnabled ? 'HABILITADO' : 'DESABILITADO'}`);
  }

  /**
   * Calcula o TTL (Time To Live) restante do cache em minutos
   * @returns Número de minutos restantes até a expiração do cache
   */
  private calculateCacheTTLMinutes(): number {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000); // Adiciona 24 horas
    const remainingMs = tomorrow.getTime() - now.getTime();
    const remainingMinutes = Math.floor(remainingMs / (1000 * 60));

    return Math.max(0, remainingMinutes); // Garante que não seja negativo
  }

  /**
   * Verifica se existe cache válido para o ranking
   * @returns true se existe cache válido, false caso contrário
   */
  private hasCacheData(): boolean {
    const cacheKey = `ranking_global_${new Date().toISOString().split('T')[0]}`;
    const cachedData = localStorage.getItem(cacheKey);
    return cachedData !== null && cachedData !== undefined;
  }

  /**
   * ✅ CORREÇÃO CRÍTICA: Método de debug para atualizar ranking manualmente
   * Permite testes de desenvolvimento e debugging de problemas de sincronização
   * Exibe informações detalhadas sobre o estado do cache e TTL
   */
  async debugRefreshRanking(): Promise<void> {
    console.log('[MOBILE-RANKING] 🔧 DEBUG: Atualizando ranking manualmente...');

    try {
      // Calcula informações do cache antes da limpeza
      const ttlMinutes = this.calculateCacheTTLMinutes();
      const hasCacheData = this.hasCacheData();
      const cacheKey = `ranking_global_${new Date().toISOString().split('T')[0]}`;

      console.log(`[MOBILE-RANKING] 📊 DEBUG: Estado do cache antes da limpeza:`);
      console.log(`  - Cache existe: ${hasCacheData}`);
      console.log(`  - TTL restante: ${ttlMinutes} minutos`);
      console.log(`  - Chave do cache: ${cacheKey}`);

      // Força limpeza do cache
      localStorage.removeItem(cacheKey);
      console.log('[MOBILE-RANKING] 🗑️ DEBUG: Cache limpo');

      // Recarrega estados de captura primeiro
      await this.loadCapturedStates();

      // ✅ CORREÇÃO: Recarrega ranking com dados frescos da API
      await this.loadRanking(true); // forceRefresh = true

      // Mostra feedback de sucesso com informações do TTL
      const cacheStatusMessage = hasCacheData
        ? `Cache anterior expirava em ${ttlMinutes} min`
        : 'Sem cache anterior';

      const successMessage = `Ranking atualizado! (${cacheStatusMessage})`;

      // Cria toast personalizado com duração maior para mensagens com TTL
      try {
        const toast = await this.toastController.create({
          message: successMessage,
          duration: 4000, // Duração maior para ler a informação do TTL
          position: 'top',
          color: 'success',
          buttons: [{
            icon: 'close',
            role: 'cancel'
          }]
        });
        await toast.present();
      } catch (error) {
        console.error('[MOBILE-RANKING] Erro ao exibir toast de debug:', error);
        // Fallback para toast simples
        await this.showToast('Ranking atualizado com sucesso!');
      }

      console.log(`[MOBILE-RANKING] ✅ DEBUG: ${successMessage}`);
    } catch (error) {
      console.error('[MOBILE-RANKING] ❌ DEBUG: Erro ao atualizar ranking:', error);
      await this.showErrorToast('Erro ao atualizar ranking. Tente novamente.');
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
        console.warn(`🔄 [MOBILE-RANKING] Tentativa ${attempt}/${maxRetries} falhou:`, error);

        if (attempt === maxRetries) {
          throw error; // Re-throw on last attempt
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ [MOBILE-RANKING] Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Retry failed'); // This should never be reached
  }

  // ✅ CORREÇÃO: Carrega ranking global com dados em tempo real
  async loadRanking(forceRefresh: boolean = false) {
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
      console.log(`🚀 [MOBILE-RANKING] Iniciando carregamento do ranking... ${forceRefresh ? '(REFRESH FORÇADO)' : ''}`);

      // ✅ CORREÇÃO: Cache local apenas para otimização, não para substituir dados da API
      const cacheKey = `ranking_global_${new Date().toISOString().split('T')[0]}`;
      const cachedData = localStorage.getItem(cacheKey);

      let backendRanking: BackendRankingItem[] = [];

      // ✅ CORREÇÃO: Se forceRefresh ou não há cache, sempre buscar dados frescos da API
      if (forceRefresh || !cachedData || isQuickUpdate) {
        console.log(`🌐 [MOBILE-RANKING] Buscando dados ${forceRefresh ? 'FRESCOS' : 'atualizados'} do ranking na API...`);

        // ✅ CORREÇÃO: Limpa cache local se forceRefresh
        if (forceRefresh) {
          localStorage.removeItem(cacheKey);
          console.log('🗑️ [MOBILE-RANKING] Cache local do ranking limpo');
        }

        backendRanking = await this.retryWithBackoff(async () => {
          const data = await firstValueFrom(
            this.pokeApiService.getGlobalRankingFromBackend(25, forceRefresh).pipe(timeout(30000))
          );

          // ✅ CORREÇÃO: Atualiza cache local apenas para otimização (TTL curto)
          if (!forceRefresh) {
            try {
              localStorage.setItem(cacheKey, JSON.stringify(data));
            } catch (error: any) {
              if (error.name === 'QuotaExceededError') {
                console.warn('🗑️ [MOBILE-RANKING] Quota de storage excedida, limpando cache antigo...');
                this.cleanOldCache();
                // Tenta novamente após limpeza
                try {
                  localStorage.setItem(cacheKey, JSON.stringify(data));
                } catch (retryError) {
                  console.error('❌ [MOBILE-RANKING] Falha ao salvar no cache mesmo após limpeza:', retryError);
                }
              }
            }
          }

          return data;
        }, 3, 2000); // 3 tentativas, começando com 2s de delay
      } else {
        console.log('📦 [MOBILE-RANKING] Usando dados em cache para otimização (dados recentes)');
        backendRanking = JSON.parse(cachedData);
      }

      if (!backendRanking || backendRanking.length === 0) {
        console.warn('⚠️ [MOBILE-RANKING] Backend retornou dados vazios');
        this.globalRanking = [];
        return;
      }

      console.log(`✅ [MOBILE-RANKING] Backend retornou ${backendRanking.length} itens de ranking`);

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
      console.log('📋 [MOBILE-RANKING] Buscando detalhes dos Pokémons...');

      const pokemonPromises = mappedRanking.map(async (item: any) => {
        try {
          // Tenta obter do cache primeiro
          const cacheKey = `pokemon_${item.pokemonId}`;
          const cachedPokemon = localStorage.getItem(cacheKey);

          let pokemon: Pokemon;

          if (cachedPokemon) {
            pokemon = JSON.parse(cachedPokemon);
            console.log(`🔄 [MOBILE-RANKING] Usando Pokémon ${item.pokemonId} do cache`);
          } else {
            pokemon = await firstValueFrom(this.pokeApiService.getPokemon(item.pokemonId));
            // Armazena no cache por 1 dia com tratamento de quota
            try {
              localStorage.setItem(cacheKey, JSON.stringify(pokemon));
            } catch (error: any) {
              if (error.name === 'QuotaExceededError') {
                console.warn('🗑️ [MOBILE-RANKING] Quota excedida ao salvar Pokémon, limpando cache...');
                this.cleanOldCache();
                // Tenta novamente após limpeza
                try {
                  localStorage.setItem(cacheKey, JSON.stringify(pokemon));
                } catch (retryError) {
                  console.error('❌ [MOBILE-RANKING] Falha ao salvar Pokémon no cache:', retryError);
                }
              }
            }
          }

          return {
            pokemon: pokemon || this.getPlaceholderPokemon(item.pokemonId),
            favoriteCount: item.favoriteCount,
            rank: item.rank,
            trend: item.trend,
            updatedAt: item.updatedAt
          };
        } catch (error) {
          console.error(`❌ [MOBILE-RANKING] Erro ao carregar Pokémon ${item.pokemonId}:`, error);
          return {
            pokemon: this.getPlaceholderPokemon(item.pokemonId),
            favoriteCount: item.favoriteCount,
            rank: item.rank,
            trend: 'stable' as const,
            updatedAt: item.updatedAt,
            error: true
          } as PokemonRanking & { error: boolean };
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
      this.globalRanking = updatedRanking.filter(item => item.pokemon && item.pokemon.id > 0);

      // ✅ NOVO: Implementa lazy loading - carrega apenas os primeiros itens inicialmente
      this.initializeLazyLoading();

      console.log(`🎯 [MOBILE-RANKING] Ranking atualizado: ${this.globalRanking.length} Pokémons carregados`);
    } catch (error) {
      console.error('🚨 [MOBILE-RANKING] Erro detalhado ao carregar ranking:', error);
      console.error('🔗 [MOBILE-RANKING] URL do backend:', `${environment.apiUrl}/api/v1/ranking/`);

      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          console.error('⏰ [MOBILE-RANKING] Timeout após 30 segundos - Backend pode estar lento ou fora do ar');
          await this.showErrorToast('Timeout: Backend não respondeu em 30s. Tente novamente.');
        } else if (error.message.includes('ERR_NETWORK')) {
          console.error('🌐 [MOBILE-RANKING] Erro de rede - Possível problema de conectividade');
          await this.showErrorToast('Erro de rede: Verifique sua conexão com a internet.');
        } else if (error.message.includes('CORS')) {
          console.error('🔒 [MOBILE-RANKING] Erro de CORS - Backend não está aceitando requisições do frontend');
          await this.showErrorToast('Erro de CORS: Backend não autorizado.');
        } else {
          console.error('❌ [MOBILE-RANKING] Erro genérico:', error.message);
          await this.showErrorToast(`Erro: ${error.message}`);
        }
      } else {
        console.error('❓ [MOBILE-RANKING] Erro desconhecido:', error);
        await this.showErrorToast('Erro desconhecido ao carregar ranking.');
      }

      this.globalRanking = [];
    } finally {
      this.loading = false;
      if (loading) {
        await loading.dismiss().catch(console.error);
      }
    }
  }

  // ✅ NOVO: Métodos para lazy loading e scroll infinito

  /**
   * Inicializa o lazy loading carregando apenas os primeiros itens
   */
  private initializeLazyLoading() {
    if (this.globalRanking.length === 0) {
      this.displayedRanking = [];
      this.hasMoreData = false;
      return;
    }

    // Carrega os primeiros itens (pódio + alguns do grid)
    const initialItems = Math.min(this.initialLoadSize, this.globalRanking.length);
    this.displayedRanking = this.globalRanking.slice(0, initialItems);
    this.hasMoreData = this.globalRanking.length > initialItems;

    console.log(`📱 [LAZY-LOADING] Inicializado: ${this.displayedRanking.length}/${this.globalRanking.length} itens carregados`);
  }

  /**
   * Carrega mais itens quando o usuário faz scroll
   */
  async loadMoreItems(event?: any) {
    if (this.isLoadingMore || !this.hasMoreData) {
      if (event) event.target.complete();
      return;
    }

    this.isLoadingMore = true;
    console.log(`📱 [LAZY-LOADING] Carregando mais itens...`);

    try {
      // Simula um pequeno delay para melhor UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const currentLength = this.displayedRanking.length;
      const nextBatch = this.globalRanking.slice(
        currentLength,
        currentLength + this.loadMoreSize
      );

      if (nextBatch.length > 0) {
        this.displayedRanking = [...this.displayedRanking, ...nextBatch];
        console.log(`📱 [LAZY-LOADING] +${nextBatch.length} itens carregados. Total: ${this.displayedRanking.length}/${this.globalRanking.length}`);
      }

      // Verifica se há mais dados para carregar
      this.hasMoreData = this.displayedRanking.length < this.globalRanking.length;

      if (!this.hasMoreData) {
        console.log(`📱 [LAZY-LOADING] Todos os itens foram carregados!`);
      }

    } catch (error) {
      console.error('❌ [LAZY-LOADING] Erro ao carregar mais itens:', error);
    } finally {
      this.isLoadingMore = false;
      if (event) {
        event.target.complete();
      }
    }
  }

  /**
   * Retorna apenas os itens do pódio (primeiros 3)
   */
  get podiumRanking(): PokemonRanking[] {
    return this.displayedRanking.slice(0, 3);
  }

  /**
   * Retorna apenas os itens do grid (4º em diante)
   */
  get gridRanking(): PokemonRanking[] {
    return this.displayedRanking.slice(3);
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
      console.error('[MOBILE-RANKING] Erro ao atualizar estados de captura:', error);
      return ranking; // Retorna o ranking sem alterações em caso de erro
    }
  }

  /**
   * Atualiza o ranking global com os estados de captura mais recentes
   */
  private updateGlobalRankingWithCapturedStates(): void {
    if (!this.globalRanking) {
      return;
    }

    this.globalRanking = this.globalRanking.map(item => ({
      ...item,
      pokemon: {
        ...item.pokemon,
        isCaptured: this.capturedStates.get(item.pokemon.id) || false
      }
    }));

    this.cdr.detectChanges();
  }

  /**
   * ✅ NOVO: Configura subscription para sincronização automática de capturas
   */
  private setupCapturedSubscription(): void {
    console.log('[MobileRanking] Configurando subscription para sincronização automática');

    this.capturedService.captured$
      .pipe(takeUntil(this.destroy$))
      .subscribe(captured => {
        console.log(`[MobileRanking] Estado de captura atualizado: ${captured.length} capturas`);

        // Atualizar cache local com novos dados
        this.capturedCache.clear();
        this.capturedStates.clear();

        captured.forEach(pokemon => {
          this.capturedCache.set(pokemon.pokemon_id, true);
          this.capturedStates.set(pokemon.pokemon_id, true);
        });

        // Atualizar ranking atual com novos estados
        this.updateGlobalRankingWithCapturedStates();

        console.log(`[MobileRanking] Cache atualizado: ${this.capturedCache.size} pokémons capturados`);
      });
  }

  /**
   * ✅ CORREÇÃO CRÍTICA: Carrega estados de captura com sincronização inteligente
   */
  private async loadCapturedStates(): Promise<void> {
    try {
      // ✅ CORREÇÃO: Usar sincronização inteligente que preserva dados locais
      const capturedPokemons = await firstValueFrom(this.capturedService.smartSync());

      // ✅ CORREÇÃO: Não limpar cache - apenas atualizar
      console.log(`[MOBILE-RANKING] Atualizando estados de captura: ${capturedPokemons.length} pokémons`);

      capturedPokemons.forEach(pokemon => {
        this.capturedCache.set(pokemon.pokemon_id, true);
        this.capturedStates.set(pokemon.pokemon_id, true);
      });

      // ✅ CORREÇÃO: Remover pokémons que não estão mais capturados
      const capturedIds = new Set(capturedPokemons.map(p => p.pokemon_id));
      for (const [pokemonId] of this.capturedStates) {
        if (!capturedIds.has(pokemonId)) {
          this.capturedStates.delete(pokemonId);
          this.capturedCache.delete(pokemonId);
        }
      }

      this.cdr.detectChanges();
      console.log(`[MOBILE-RANKING] ✅ Estados de captura atualizados: ${this.capturedStates.size} pokémons capturados`);
    } catch (error) {
      console.error('[MOBILE-RANKING] ❌ Erro ao carregar estados de captura:', error);
      // ✅ CORREÇÃO: Não propagar erro - manter funcionamento
      console.warn('[MOBILE-RANKING] Continuando com estados de captura existentes');
    }
  }



  // Verifica se um Pokémon foi capturado
  isCaptured(pokemonId: number): boolean {
    return this.capturedStates.get(pokemonId) || false;
  }

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

  // Abre modal de detalhes (mobile)
  openDetailsModal(pokemonId: number) {
    this.selectedPokemonId = pokemonId;
    this.showDetailsModal = true;
  }

  // Fecha modal de detalhes
  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedPokemonId = null;
  }

  getCurrentRanking(): PokemonRanking[] {
    return this.globalRanking;
  }

  // ✅ REMOVIDO: refreshDataAfterLogin() - agora gerenciado globalmente pelo PostAuthRefreshService

  /**
   * Manipulador para alternar o estado de captura de um Pokémon
   * @param event Objeto contendo o Pokémon e o novo estado de captura
   */
  async onCaptureToggle(event: { pokemon: Pokemon, isCaptured: boolean }): Promise<void> {
    if (!event?.pokemon) {
      console.error('[MOBILE-RANKING] Evento de captura inválido:', event);
      return;
    }

    const { pokemon, isCaptured } = event;
    const pokemonId = pokemon.id;
    const action = isCaptured ? 'capturado' : 'liberado';

    // Se já existe um debounce em andamento para este Pokémon, ignora o novo evento
    if (this.toggleDebounceTimer[pokemonId]) {
      console.log(`[MOBILE-RANKING] Ignorando clique rápido para o Pokémon ${pokemonId}`);
      return;
    }

    // Configura o debounce
    this.toggleDebounceTimer[pokemonId] = window.setTimeout(() => {
      delete this.toggleDebounceTimer[pokemonId];
    }, 1000);

    const loadingMessage = isCaptured ? 'capturing_pokemon' : 'releasing_pokemon';
    console.log(`[MOBILE-RANKING] Iniciando processo para ${action} o Pokémon ${pokemon.name} (ID: ${pokemonId})`);

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
      this.cdr.detectChanges();

      // Executa a ação de captura/liberação
      console.log(`[MOBILE-RANKING] Executando ação de ${action} no servidor...`);

      // Executa a ação de forma assíncrona
      await this.capturedService.toggleCaptured(pokemon);

      // ✅ CORREÇÃO CRÍTICA: Evitar race condition - atualizar apenas estados locais
      console.log('[MOBILE-RANKING] Atualizando estado local de captura...');

      // Atualiza apenas o estado local sem recarregar do backend
      this.capturedCache.set(pokemonId, isCaptured);
      this.capturedStates.set(pokemonId, isCaptured);
      this.updateGlobalRankingWithCapturedStates();

      // ✅ CORREÇÃO: Não recarregar ranking completo - preserva dados de captura
      console.log('[MOBILE-RANKING] Estado local atualizado, evitando recarregamento desnecessário');

      // Feedback visual de sucesso
      const successMessage = isCaptured ? 'pokemon_captured' : 'pokemon_released';
      await this.showToast(successMessage, { name: pokemon.name });

    } catch (error: unknown) {
      console.error(`[MOBILE-RANKING] Erro ao ${action} o Pokémon:`, error);

      // Reverte a atualização otimista em caso de erro
      this.capturedCache.set(pokemonId, !isCaptured);
      this.capturedStates.set(pokemonId, !isCaptured);
      this.cdr.detectChanges();

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
          console.error('[MOBILE-RANKING] Erro ao fechar loading:', e);
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
        console.error('[MOBILE-RANKING] Erro ao sincronizar:', e);
      }
    }

    console.log(`[MOBILE-RANKING] Processo de ${action} concluído para o Pokémon ${pokemon.name}`);
  }

  // Classe CSS para badge de ranking - expandido para top 25
  getRankingBadgeClass(rank: number): string {
    if (rank === 4 || rank === 5) return 'rank-4';
    if (rank >= 6 && rank <= 8) return 'rank-6';
    if (rank >= 9 && rank <= 12) return 'rank-9';
    if (rank >= 13 && rank <= 18) return 'rank-13';
    if (rank >= 19 && rank <= 25) return 'rank-19';
    return 'rank-default'; // Para posições maiores que 25
  }

  // Métodos de autenticação
  abrirLogin = async () => {
    const modal = await this.modalController.create({
      component: AuthModalNewComponent,
      cssClass: 'auth-modal-fixed'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.success) {
        this.isAuthenticated = this.authService.isAuthenticated();
        if (this.isAuthenticated) {
          this.user = this.authService.getCurrentUser();
        }
      }
    });

    return await modal.present();
  };

  abrirPerfil = () => {
    console.log('Abrir perfil');
  };

  /**
   * Exibe uma mensagem de sucesso
   */
  private async showToast(message: string, params?: any): Promise<void> {
    try {
      const translatedMessage = await this.translate.get(message, params).toPromise();
      const toast = await this.toastController.create({
        message: translatedMessage,
        duration: 3000,
        position: 'top',
        color: 'success',
        buttons: [{
          icon: 'close',
          role: 'cancel'
        }]
      });
      await toast.present();
    } catch (error) {
      console.error('[MOBILE-RANKING] Erro ao exibir toast:', error);
    }
  }

  /**
   * Exibe uma mensagem de erro
   */
  private async showErrorToast(message: string, params?: any): Promise<void> {
    const toast = await this.toastController.create({
      message: await this.translate.get(message, params).toPromise(),
      duration: 3000,
      position: 'top',
      color: 'danger'
    });
    await toast.present();
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

  toggleSearch() {
    this.showSearch = !this.showSearch;
  }

  onFiltersChanged(filters: any) {
    this.currentFilterOptions = filters;
    // TODO: aplicar filtro na lista de ranking
  }

  onSearchChanged(search: string) {
    this.currentFilterOptions.search = search;
    // TODO: aplicar busca na lista de ranking
  }

  /**
   * Limpa cache antigo para liberar espaço no localStorage
   */
  private cleanOldCache(): void {
    try {
      const keysToRemove: string[] = [];
      const currentDate = new Date().toISOString().split('T')[0];

      // Identifica chaves antigas para remoção
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          // Remove cache de ranking antigo (mais de 1 dia)
          if (key.startsWith('ranking_') && !key.includes(currentDate)) {
            keysToRemove.push(key);
          }
          // Remove cache de Pokémon muito antigo (mais de 7 dias)
          if (key.startsWith('pokemon_') && Math.random() < 0.1) { // Remove 10% aleatoriamente
            keysToRemove.push(key);
          }
        }
      }

      // Remove as chaves identificadas
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log(`🗑️ [MOBILE-RANKING] Cache limpo: ${keysToRemove.length} itens removidos`);
    } catch (error) {
      console.error('❌ [MOBILE-RANKING] Erro ao limpar cache:', error);
    }
  }
}
