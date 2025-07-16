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
  updatedAt?: string;
}

interface BackendRankingItem {
  pokemon_id: number;
  favorite_count: number;
  trend?: 'up' | 'down' | 'stable';
}



@Component({
  selector: 'app-mobile-ranking',
  templateUrl: './ranking.page.html',
  styleUrls: ['./ranking.page.scss'],
})
export class RankingPage implements OnInit, OnDestroy {
  globalRanking: PokemonRanking[] = [];
  loading = false;
  debounceTimer: any = null;
  toggleDebounceTimer: { [key: number]: any } = {};

  // Cache para evitar chamadas repetidas
  private capturedCache = new Map<number, boolean>();
  private pokemonImageCache = new Map<number, string>();
  capturedStates = new Map<number, boolean>();

  // Mobile specific properties
  isMobile = true;
  showCompactView = true;

  private destroy$ = new Subject<void>();

  showDetailsModal = false;
  selectedPokemonId: number | null = null;

  isAuthenticated = false;
  user: User | null = null;
  showUserMenu = false;

  showSearch = false; // Controle do sistema de busca
  currentFilterOptions: any = {};

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
    // Verificar autenticação
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      this.user = this.authService.getCurrentUser();
    }

    // Inscrever para mudanças de autenticação
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.user = user;
      this.isAuthenticated = !!user;
    });

    this.loadRanking();
    this.loadCapturedStates();
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
  }

  // ✅ CORREÇÃO: Método para carregar dados de ranking com debug melhorado
  private async loadRankingData(endpoint: 'getGlobalRanking' | 'getLocalRanking', region?: string): Promise<PokemonRanking[]> {
    try {
      console.log(`📡 [MOBILE-RANKING] Chamando ${endpoint}${region ? ` para região ${region}` : ''}`);

      const response = endpoint === 'getGlobalRanking'
        ? await this.pokeApiService.getGlobalRanking().toPromise()
        : await this.pokeApiService.getLocalRanking(region!).toPromise();

      console.log(`📥 [MOBILE-RANKING] Resposta recebida do ${endpoint}:`, response);

      if (!response || !Array.isArray(response)) {
        console.warn(`⚠️ [MOBILE-RANKING] Resposta inválida do ${endpoint}:`, response);
        console.warn(`⚠️ [MOBILE-RANKING] Tipo da resposta: ${typeof response}, É array: ${Array.isArray(response)}`);
        return [];
      }

      console.log(`✅ [MOBILE-RANKING] Resposta válida: ${response.length} itens`);

      if (response.length === 0) {
        console.warn(`⚠️ [MOBILE-RANKING] ${endpoint} retornou array vazio`);
        return [];
      }

      // ✅ CORREÇÃO: Mapeamento com melhor validação e debug
      const mappedRanking = response
        .filter(item => {
          const isValid = item && item.pokemon_id && typeof item.pokemon_id === 'number';
          if (!isValid) {
            console.warn(`⚠️ [MOBILE-RANKING] Item inválido filtrado:`, item);
          }
          return isValid;
        })
        .map((item: BackendRankingItem, idx: number) => {
          const validTrends = ['up', 'down', 'stable'] as const;
          const trend = validTrends.includes(item.trend as any)
            ? item.trend as 'up' | 'down' | 'stable'
            : 'stable';

          const mapped = {
            pokemonId: item.pokemon_id,
            favoriteCount: item.favorite_count || 0,
            rank: idx + 1,
            trend: trend,
            updatedAt: new Date().toISOString()
          };

          console.log(`📋 [MOBILE-RANKING] Item ${idx + 1} mapeado:`, mapped);
          return mapped;
        });

      console.log(`🗂️ [MOBILE-RANKING] Total de itens mapeados: ${mappedRanking.length}`);

      // ✅ CORREÇÃO: Carregamento de Pokémon com melhor debug e error handling
      console.log(`🔄 [MOBILE-RANKING] Iniciando carregamento de ${mappedRanking.length} Pokémon...`);

      const pokemonPromises = mappedRanking.map(async (item: any, index: number) => {
        try {
          console.log(`🔍 [MOBILE-RANKING] Carregando Pokémon ${item.pokemonId} (${index + 1}/${mappedRanking.length})`);

          const cacheKey = `pokemon_${item.pokemonId}`;
          const cachedPokemon = localStorage.getItem(cacheKey);

          let pokemon: Pokemon;

          if (cachedPokemon) {
            console.log(`💾 [MOBILE-RANKING] Pokémon ${item.pokemonId} encontrado no cache`);
            pokemon = JSON.parse(cachedPokemon);
          } else {
            console.log(`📡 [MOBILE-RANKING] Buscando Pokémon ${item.pokemonId} da API...`);
            pokemon = await firstValueFrom(this.pokeApiService.getPokemon(item.pokemonId));
            localStorage.setItem(cacheKey, JSON.stringify(pokemon));
            console.log(`✅ [MOBILE-RANKING] Pokémon ${item.pokemonId} carregado e cacheado`);
          }

          const result = {
            pokemon: pokemon || this.getPlaceholderPokemon(item.pokemonId),
            favoriteCount: item.favoriteCount,
            rank: item.rank,
            trend: item.trend,
            updatedAt: item.updatedAt
          };

          console.log(`✅ [MOBILE-RANKING] Resultado para Pokémon ${item.pokemonId}:`, result);
          return result;

        } catch (error) {
          console.error(`❌ [MOBILE-RANKING] Erro ao carregar Pokémon ${item.pokemonId}:`, error);
          const fallbackResult = {
            pokemon: this.getPlaceholderPokemon(item.pokemonId),
            favoriteCount: item.favoriteCount,
            rank: item.rank,
            trend: 'stable' as const,
            updatedAt: item.updatedAt
          };

          console.log(`🔄 [MOBILE-RANKING] Usando placeholder para Pokémon ${item.pokemonId}:`, fallbackResult);
          return fallbackResult;
        }
      });

      console.log(`⏳ [MOBILE-RANKING] Aguardando carregamento de todos os Pokémon...`);
      const results = await Promise.all(pokemonPromises);

      const validResults = results.filter(item => item.pokemon);
      console.log(`🎯 [MOBILE-RANKING] Resultados válidos: ${validResults.length}/${results.length}`);

      return validResults;

    } catch (error) {
      console.error(`❌ [MOBILE-RANKING] Erro crítico ao carregar ${endpoint}:`, error);
      console.error(`❌ [MOBILE-RANKING] Stack trace:`, error);
      return [];
    }
  }

  // ✅ CORREÇÃO: Carrega ranking global com debug melhorado
  async loadRanking() {
    if (this.loading) {
      console.log('⚠️ [MOBILE-RANKING] Já carregando ranking, ignorando chamada duplicada');
      return;
    }

    console.log('🚀 [MOBILE-RANKING] Iniciando carregamento do ranking global');
    this.loading = true;

    try {
      console.log('📡 [MOBILE-RANKING] Chamando loadRankingData...');
      this.globalRanking = await this.loadRankingData('getGlobalRanking');

      console.log(`✅ [MOBILE-RANKING] Ranking global carregado: ${this.globalRanking.length} itens`);
      console.log('📊 [MOBILE-RANKING] Primeiros 3 itens:', this.globalRanking.slice(0, 3));

      // ✅ CORREÇÃO: Verificar se temos dados válidos
      if (this.globalRanking.length === 0) {
        console.warn('⚠️ [MOBILE-RANKING] Ranking vazio - pode ser problema de API ou dados');
      }

    } catch (error) {
      console.error('❌ [MOBILE-RANKING] Erro ao carregar ranking global:', error);
      console.error('🔗 [MOBILE-RANKING] Stack trace:', error);
      this.showErrorToast('ranking_page.error_loading_global');

      // ✅ CORREÇÃO: Garantir que globalRanking seja array vazio em caso de erro
      this.globalRanking = [];
    } finally {
      this.loading = false;
      console.log(`🏁 [MOBILE-RANKING] Carregamento finalizado. Loading: ${this.loading}, Items: ${this.globalRanking.length}`);
      this.cdr.detectChanges();
    }
  }



  // Carrega estados de captura
  private async loadCapturedStates() {
    try {
      const captured = await this.capturedService.getCaptured().toPromise();
      this.capturedStates.clear();

      if (captured && Array.isArray(captured)) {
        captured.forEach(pokemon => {
          if (pokemon && pokemon.id) {
            this.capturedStates.set(pokemon.id, true);
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estados de captura:', error);
    }
  }

  // Verifica se um Pokémon foi capturado
  isCaptured(pokemonId: number): boolean {
    return this.capturedStates.get(pokemonId) || false;
  }

  // Placeholder para Pokémon com erro
  private getPlaceholderPokemon(id: number): Pokemon {
    return {
      id: id,
      name: `pokemon-${id}`,
      order: id,
      species: { name: `pokemon-${id}`, url: '' },
      sprites: {
        front_default: '/assets/images/pokemon-placeholder.png',
        front_shiny: '/assets/images/pokemon-placeholder.png',
        back_default: '/assets/images/pokemon-placeholder.png',
        back_shiny: '/assets/images/pokemon-placeholder.png',
        other: {
          'official-artwork': {
            front_default: '/assets/images/pokemon-placeholder.png'
          },
          home: {
            front_default: '/assets/images/pokemon-placeholder.png',
            front_shiny: '/assets/images/pokemon-placeholder.png'
          }
        }
      },
      types: [{ type: { name: 'unknown', url: '' }, slot: 1 }],
      height: 0,
      weight: 0,
      base_experience: 0,
      abilities: [],
      stats: [],
      moves: []
    } as Pokemon;
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

  // Handle capture toggle
  async onCaptureToggle(event: { pokemon: Pokemon; isCaptured: boolean }) {
    const pokemonId = event.pokemon.id;
    const captured = event.isCaptured;

    // Debounce para evitar múltiplos cliques
    if (this.toggleDebounceTimer[pokemonId]) {
      clearTimeout(this.toggleDebounceTimer[pokemonId]);
    }

    this.toggleDebounceTimer[pokemonId] = setTimeout(async () => {
      try {
        if (captured) {
          // Precisamos do objeto Pokemon completo para addToCaptured
          const pokemon = await firstValueFrom(this.pokeApiService.getPokemon(pokemonId));
          await this.capturedService.addToCaptured(pokemon).toPromise();
          this.capturedStates.set(pokemonId, true);
        } else {
          await this.capturedService.removeFromCaptured(pokemonId).toPromise();
          this.capturedStates.set(pokemonId, false);
        }

        // Play sound effect (removido - método não existe no AudioService)

      } catch (error) {
        console.error('Erro ao alterar captura:', error);
        this.showErrorToast('ranking_page.error_capture');
      }

      delete this.toggleDebounceTimer[pokemonId];
    }, 300);
  }

  // Classe CSS para badge de ranking
  getRankingBadgeClass(rank: number): string {
    if (rank <= 3) return 'ranking-badge-gold';
    if (rank <= 10) return 'ranking-badge-silver';
    return 'ranking-badge-bronze';
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

  // Métodos de toast
  private async showErrorToast(messageKey: string) {
    const message = await this.translate.get(messageKey).toPromise();
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger'
    });
    await toast.present();
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
}
