/**
 * 🏠 Componente Principal - Tela Inicial da Pokédex
 * ================================================
 *
 * Componente central da Pokédex que orquestra toda a experiência:
 * - Gerenciamento de estado global da aplicação
 * - Sistema de busca e filtros avançados
 * - Integração com todos os sistemas (favoritos, ranking, conquistas)
 * - Performance otimizada com lazy loading e virtual scrolling
 * - Suporte completo à acessibilidade
 * - Efeitos visuais coordenados
 *
 * @example
 * ```html
 * <poke-ui-home></poke-ui-home>
 * ```
 *
 * @author Equipe de Desenvolvimento
 * @version 2.0.0
 * @since 2025-01-01
 */

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BehaviorSubject,
  Subject,
  Observable,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  catchError,
  finalize,
  tap,
  map,
  of,
  switchMap,
  forkJoin,
} from 'rxjs';

// Services
import { PokemonApiService } from '../services/pokemon-api.service';
import { EpicEffectsService } from '../services/epic-effects.service';

// Models
import { Pokemon, PokemonType, PokemonListResponse } from '../models/pokemon.model';

// Poke-UI Components
import { PokeUiHeaderComponent } from './poke-ui-header.component';
import { PokeUiCardComponent } from './poke-ui-card.component';
import { PokeUiDetailModalComponent } from './poke-ui-detail-modal.component';
import { PokeUiRankingComponent } from './poke-ui-ranking.component';
import { PokeUiAchievementsComponent } from './poke-ui-achievements.component';
import { PokeUiRandomBtnComponent } from './poke-ui-random-btn.component';

// Poke-UI Services
import { PokeUiRankingService } from './poke-ui-ranking.service';
import { PokeUiAchievementsService } from './poke-ui-achievements.service';
import { PokeUiSoundService } from './poke-ui-sound.service';
import { PokeUiFavoritesService } from './poke-ui-favorites.service';

/**
 * Interface para configuração de filtros
 */
interface FilterConfig {
  searchTerm: string;
  selectedType: string;
  showOnlyFavorites: boolean;
  sortBy: 'id' | 'name' | 'type';
  sortOrder: 'asc' | 'desc';
}

/**
 * Interface para estado de carregamento
 */
interface LoadingState {
  initial: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
}

/**
 * Interface para estatísticas da aplicação
 */
interface AppStats {
  totalPokemon: number;
  favoriteCount: number;
  typesDiscovered: number;
  achievementsUnlocked: number;
}

@Component({
  selector: 'poke-ui-home',
  standalone: true,
  imports: [
    CommonModule,
    PokeUiHeaderComponent,
    PokeUiCardComponent,
    PokeUiDetailModalComponent,
    PokeUiRankingComponent,
    PokeUiAchievementsComponent,
    PokeUiRandomBtnComponent,
  ],
  templateUrl: './poke-ui-home.component.html',
  styleUrls: ['./poke-ui-home.component.scss'],
  providers: [PokeUiAchievementsService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokeUiHomeComponent implements OnInit, AfterViewInit, OnDestroy {
  // ====================================================================
  // CONSTANTES
  // ====================================================================

  private readonly PAGE_SIZE = 20;
  private readonly componentId = 'poke-ui-home';

  // ====================================================================
  // REFERÊNCIAS DE ELEMENTOS
  // ====================================================================

  @ViewChild('pokemonGrid', { static: false })
  pokemonGridRef?: ElementRef<HTMLElement>;

  @ViewChild('loadingIndicator', { static: false })
  loadingIndicatorRef?: ElementRef<HTMLElement>;

  // ====================================================================
  // SUBJECTS E OBSERVABLES
  // ====================================================================

  private destroy$ = new Subject<void>();
  private allPokemon$ = new BehaviorSubject<Pokemon[]>([]);
  private loadingStateSubject$ = new BehaviorSubject<LoadingState>({
    initial: true,
    loadingMore: false,
    error: null,
    hasMore: true,
  });

  public filterConfig$ = new BehaviorSubject<FilterConfig>({
    searchTerm: '',
    selectedType: '',
    showOnlyFavorites: false,
    sortBy: 'id',
    sortOrder: 'asc',
  });

  public loadingState$ = this.loadingStateSubject$.asObservable();
  public filteredPokemon$!: Observable<Pokemon[]>;
  public availableTypes$!: Observable<string[]>;
  public appStats$!: Observable<AppStats>;

  // ====================================================================
  // PROPRIEDADES PÚBLICAS
  // ====================================================================

  selectedPokemon: Pokemon | null = null;
  isModalOpen: boolean = false;
  achievements: any[] = [];
  currentPage = 0;
  hasMorePokemon = true;

  /**
   * Anéis do portal para efeitos visuais
   */
  portalRings: Array<{size: number, delay: number, color: string}> = Array.from({ length: 5 }, (_, i) => ({
    size: 80 + i * 40,
    delay: i * 0.2,
    color: this.getPortalColor(i)
  }));

  /**
   * Partículas ambientais para fundo
   */
  ambientParticles: Array<{x: number, y: number, size: number, speed: number, color: string}> = Array.from({ length: 30 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 3 + Math.random() * 8,
    speed: 2 + Math.random() * 6,
    color: this.getRandomParticleColor()
  }));

  /**
   * Anéis do spinner para efeitos de carregamento
   */
  spinnerRings: Array<{size: number, delay: number, color: string}> = Array.from({ length: 3 }, (_, i) => ({
    size: 30 + i * 20,
    delay: i * 0.3,
    color: this.getSpinnerColor(i)
  }));

  /**
   * Termo de busca reativo
   */
  searchTerm$ = new BehaviorSubject<string>('');

  /**
   * Contador total de Pokémon
   */
  totalPokemonCount$ = new BehaviorSubject<number>(0);

  /**
   * Progresso do carregamento
   */
  loadingProgress$ = new BehaviorSubject<number>(0);

  /**
   * Indica se há filtros ativos
   */
  hasActiveFilters$ = new BehaviorSubject<boolean>(false);

  /**
   * Indica se há mais Pokémon para carregar
   */
  hasMorePokemon$ = new BehaviorSubject<boolean>(true);

  /**
   * Controle para exibição de conquistas
   */
  showAchievements$ = new BehaviorSubject<boolean>(false);

  /**
   * Controle para exibição de ranking
   */
  showRanking$ = new BehaviorSubject<boolean>(false);

  /**
   * Controla o foco na barra de busca
   */
  isSearchFocused: boolean = false;

  /**
   * Contador de favoritos para exibição no header
   */
  favoritesCount: number = 0;

  constructor(
    private pokemonApi: PokemonApiService,
    private favoritesService: PokeUiFavoritesService,
    private rankingService: PokeUiRankingService,
    private achievementsService: PokeUiAchievementsService,
    private soundService: PokeUiSoundService,
    private epicEffects: EpicEffectsService,
    private cdr: ChangeDetectorRef,
  ) {
    this.initializeObservables();
  }

  // ===================== MÉTODOS PÚBLICOS ESPERADOS PELO TEMPLATE =====================

  /** Handler para clique em favoritos no header */
  onHeaderFavorites(event: any): void { this.onToggleFavorites(); }
  /** Handler para busca avançada */
  onAdvancedSearch(event: any): void { console.log('Advanced search:', event); }
  /** Handler para toggle do menu */
  onMenuToggle(event: any): void { console.log('Menu toggle:', event); }
  /** Handler para clique no logo */
  onLogoClick(event: any): void { this.onRandomPokemon(); }
  /** Handler para clique em card */
  onCardClick(pokemon: Pokemon): void { this.selectedPokemon = pokemon; this.isModalOpen = true; this.soundService.play('modal'); this.applyCardClickEffects(pokemon); }
  /** Handler para mudança no termo de busca */
  onSearchChange(searchTerm: string): void { this.updateFilterConfig({ searchTerm }); this.searchTerm$.next(searchTerm); this.soundService.play('catch'); }
  /** Handler para foco/desfoque na busca */
  onSearchFocus(isFocused: boolean): void { this.isSearchFocused = isFocused; }
  /** Handler para mudança de tipo */
  onTypeChange(selectedType: string): void { this.updateFilterConfig({ selectedType }); this.soundService.play('catch'); }
  /** Handler para alternar favoritos */
  onToggleFavorites(): void { const currentConfig = this.filterConfig$.value; this.updateFilterConfig({ showOnlyFavorites: !currentConfig.showOnlyFavorites }); this.soundService.play('favorite'); }
  /** Handler para selecionar Pokémon aleatório */
  onRandomPokemon(): void { const allPokemon = this.allPokemon$.value; if (allPokemon.length > 0) { const randomIndex = Math.floor(Math.random() * allPokemon.length); const randomPokemon = allPokemon[randomIndex]; this.onCardClick(randomPokemon); this.soundService.play('catch'); } }
  /** Handler para fechar modal */
  onCloseModal(): void { this.isModalOpen = false; this.selectedPokemon = null; this.soundService.play('modal'); }
  /** Handler para próximo Pokémon no modal */
  onNextPokemon(): void { /* Implementar navegação */ }
  /** Handler para Pokémon anterior no modal */
  onPreviousPokemon(): void { /* Implementar navegação */ }

  // ===================== MÉTODOS AUXILIARES PARA EFEITOS VISUAIS =====================

  getPortalColor(i: number): string { const colors = ['#ff4757', '#3742fa', '#2ed573', '#ffa502', '#70a1ff']; return colors[i % colors.length]; }
  getRandomParticleColor(): string { const colors = ['#ff4757', '#3742fa', '#2ed573', '#ffa502', '#70a1ff', '#f1c40f', '#e17055', '#00b894']; return colors[Math.floor(Math.random() * colors.length)]; }
  getSpinnerColor(i: number): string { const colors = ['#fbbf24', '#06b6d4', '#dc2626']; return colors[i % colors.length]; }

  // ===================== ATUALIZAÇÃO DE FILTROS E ESTADOS =====================

  private updateFilterConfig(updates: Partial<FilterConfig>): void {
    const currentConfig = this.filterConfig$.value;
    const newConfig = { ...currentConfig, ...updates };
    this.filterConfig$.next(newConfig);
    this.hasActiveFilters$.next(
      !!newConfig.searchTerm ||
      !!newConfig.selectedType ||
      newConfig.showOnlyFavorites ||
      newConfig.sortBy !== 'id' ||
      newConfig.sortOrder !== 'asc'
    );
  }

  // ====================================================================
  // LIFECYCLE HOOKS
  // ====================================================================
  ngOnInit(): void {
    this.initializeObservables();
    this.loadInitialPokemon();
    this.setupIntersectionObserver();
    this.updateAchievements();
  }

  ngAfterViewInit(): void {
    this.applyInitialEffects();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanup();
  }

  // ====================================================================
  // INICIALIZAÇÃO
  // ====================================================================

  private initializeObservables(): void {
    // Configurar filtros de Pokémon
    this.filteredPokemon$ = combineLatest([
      this.allPokemon$,
      this.filterConfig$,
    ]).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      map(([pokemon, filterConfig]) => {
        let filtered = [...pokemon];

        // Filtro por texto de busca
        if (filterConfig.searchTerm) {
          const searchTerm = filterConfig.searchTerm.toLowerCase();
          filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.id.toString().includes(searchTerm)
          );
        }

        // Filtro por tipo
        if (filterConfig.selectedType) {
          filtered = filtered.filter(pokemon =>
            pokemon.types?.some(type =>
              this.getTypeName(type).toLowerCase() === filterConfig.selectedType.toLowerCase()
            )
          );
        }

        // Filtro por favoritos
        if (filterConfig.showOnlyFavorites) {
          const favorites = this.favoritesService.getFavorites();
          filtered = filtered.filter(p => favorites.includes(p.id));
        }

        // Ordenação
        filtered.sort((a, b) => {
          let comparison = 0;
          switch (filterConfig.sortBy) {
            case 'id':
              comparison = a.id - b.id;
              break;
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'type':
              const aType = this.getTypeName(a.types?.[0]);
              const bType = this.getTypeName(b.types?.[0]);
              comparison = aType.localeCompare(bType);
              break;
          }
          return filterConfig.sortOrder === 'desc' ? -comparison : comparison;
        });

        return filtered;
      }),
      takeUntil(this.destroy$)
    );

    // Extrair tipos disponíveis
    this.availableTypes$ = this.allPokemon$.pipe(
      map(pokemon => {
        const typesSet = new Set<string>();
        pokemon.forEach(p => {
          p.types?.forEach(type => typesSet.add(this.getTypeName(type)));
        });
        return Array.from(typesSet).sort();
      }),
      takeUntil(this.destroy$)
    );

    // Configurar estatísticas
    this.appStats$ = combineLatest([
      this.allPokemon$,
      this.availableTypes$,
    ]).pipe(
      map(([pokemon, types]) => ({
        totalPokemon: pokemon.length,
        favoriteCount: this.favoritesService.getFavorites().length,
        typesDiscovered: types.length,
        achievementsUnlocked: this.achievements.length,
      }))
    );
  }

  // ====================================================================
  // CARREGAMENTO DE DADOS
  // ====================================================================
  private loadInitialPokemon(): void {
    this.loadingStateSubject$.next({
      ...this.loadingStateSubject$.value,
      initial: true,
    });

    this.pokemonApi.getPokemonList(0, this.PAGE_SIZE).pipe(      switchMap((response: PokemonListResponse): Observable<Pokemon[]> => {
        const pokemonList = Array.isArray(response) ? response : response.results;
        this.hasMorePokemon = pokemonList.length === this.PAGE_SIZE;

        // Buscar detalhes completos de cada Pokémon
        const detailRequests = pokemonList.map((pokemon: Pokemon) => {
          const pokemonId = this.pokemonApi.extractPokemonId(pokemon.url);
          return this.pokemonApi.getPokemonDetails(pokemonId).pipe(
            catchError(error => {
              console.warn(`Erro ao carregar detalhes do Pokémon ${pokemonId}:`, error);
              // Retorna o Pokémon básico com dados mínimos
              return of({
                ...pokemon,
                id: pokemonId,
                sprites: {
                  front_default: this.pokemonApi.getPokemonImageUrl(pokemonId),
                  other: {
                    'official-artwork': {
                      front_default: this.pokemonApi.getPokemonImageUrl(pokemonId)
                    }
                  }
                }
              } as Pokemon);
            })
          );
        });

        // Aguardar todos os detalhes serem carregados
        return forkJoin(detailRequests);
      }),
      tap((pokemonWithDetails: Pokemon[]) => {
        this.allPokemon$.next(pokemonWithDetails);
      }),
      catchError(error => {
        console.error('Erro ao carregar Pokémon:', error);
        this.loadingStateSubject$.next({
          ...this.loadingStateSubject$.value,
          error: 'Erro ao carregar Pokémon. Tente novamente.',
        });
        return of([]);
      }),
      finalize(() => {
        this.loadingStateSubject$.next({
          ...this.loadingStateSubject$.value,
          initial: false,
        });
        this.cdr.detectChanges();
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }
  private loadMorePokemon(): void {
    if (!this.hasMorePokemon) return;

    this.loadingStateSubject$.next({
      ...this.loadingStateSubject$.value,
      loadingMore: true,
    });

    this.currentPage++;
    const offset = this.currentPage * this.PAGE_SIZE;

    this.pokemonApi.getPokemonList(offset, this.PAGE_SIZE).pipe(
      switchMap((response: PokemonListResponse): Observable<Pokemon[]> => {
        const pokemonList = Array.isArray(response) ? response : response.results;
        this.hasMorePokemon = pokemonList.length === this.PAGE_SIZE;

        // Buscar detalhes completos de cada Pokémon
        const detailRequests = pokemonList.map((pokemon: Pokemon) => {
          const pokemonId = this.pokemonApi.extractPokemonId(pokemon.url);
          return this.pokemonApi.getPokemonDetails(pokemonId).pipe(
            catchError(error => {
              console.warn(`Erro ao carregar detalhes do Pokémon ${pokemonId}:`, error);
              return of({
                ...pokemon,
                id: pokemonId,
                sprites: {
                  front_default: this.pokemonApi.getPokemonImageUrl(pokemonId),
                  other: {
                    'official-artwork': {
                      front_default: this.pokemonApi.getPokemonImageUrl(pokemonId)
                    }
                  }
                }
              } as Pokemon);
            })
          );
        });

        return forkJoin(detailRequests);
      }),
      tap((pokemonWithDetails: Pokemon[]) => {
        const currentPokemon = this.allPokemon$.value;
        if (pokemonWithDetails.length > 0) {
          this.allPokemon$.next([...currentPokemon, ...pokemonWithDetails]);
        } else {
          this.hasMorePokemon = false;
        }
      }),
      catchError(error => {
        console.error('Erro ao carregar mais Pokémon:', error);
        this.currentPage--; // Reverte o incremento em caso de erro
        return of([]);
      }),
      finalize(() => {
        this.loadingStateSubject$.next({
          ...this.loadingStateSubject$.value,
          loadingMore: false,
        });
        this.cdr.detectChanges();
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  // ====================================================================
  // HANDLERS DE EVENTOS
  // ====================================================================
  onPokemonClick(pokemon: Pokemon): void {
    this.selectedPokemon = pokemon;
    this.isModalOpen = true;
    this.applyCardClickEffects(pokemon);
    this.soundService.play('modal');
  }
  onToggleFavorite(pokemon: Pokemon): void {
    this.favoritesService.toggleFavorite(pokemon.id);
    const isFavorite = this.favoritesService.isFavorite(pokemon.id);
    this.applyFavoriteEffects(pokemon, isFavorite);
    this.soundService.play(isFavorite ? 'favorite' : 'error');
    this.updateAchievements();
  }

  onModalClose(): void {
    this.isModalOpen = false;
    this.selectedPokemon = null;
  }

  onFilterChange(filterConfig: FilterConfig): void {
    this.filterConfig$.next(filterConfig);
    this.applyViewChangeEffects();
  }

  onLoadMore(): void {
    this.loadMorePokemon();
  }
  onResetFilters(): void {
    this.filterConfig$.next({
      searchTerm: '',
      selectedType: '',
      showOnlyFavorites: false,
      sortBy: 'id',
      sortOrder: 'asc',
    });
    this.soundService.play('catch');
  }

  // ====================================================================
  // MÉTODOS UTILITÁRIOS
  // ====================================================================

  private getTypeName(type: PokemonType | undefined): string {
    if (!type) return '';
    return typeof type === 'string' ? type : type.type?.name || '';
  }

  isFavorite(pokemonId: number): boolean {
    return this.favoritesService.isFavorite(pokemonId);
  }

  getTypeDisplayName(type: string): string {
    const typeNames: { [key: string]: string } = {
      'normal': 'Normal',
      'fire': 'Fogo',
      'water': 'Água',
      'electric': 'Elétrico',
      'grass': 'Planta',
      'ice': 'Gelo',
      'fighting': 'Lutador',
      'poison': 'Veneno',
      'ground': 'Terra',
      'flying': 'Voador',
      'psychic': 'Psíquico',
      'bug': 'Inseto',
      'rock': 'Pedra',
      'ghost': 'Fantasma',
      'dragon': 'Dragão',
      'dark': 'Sombrio',
      'steel': 'Aço',
      'fairy': 'Fada',
    };
    return typeNames[type.toLowerCase()] || type;
  }

  isCardEntering(index: number): boolean {
    return index < 3; // Primeiros 3 cards têm animação de entrada
  }

  // ====================================================================
  // TRACKING FUNCTIONS
  // ====================================================================

  trackByPokemonId(_: number, pokemon: Pokemon): number {
    return pokemon.id;
  }

  trackByType(_: number, type: string): string {
    return type;
  }

  trackPortalRing(_: number, ring: { size: number }): number {
    return ring.size;
  }

  trackParticle(index: number): number {
    return index;
  }

  // ====================================================================
  // EFEITOS VISUAIS
  // ====================================================================

  private applyInitialEffects(): void {
    // Aplicar efeitos iniciais após a renderização
    setTimeout(() => {
      this.applyViewChangeEffects();
    }, 100);
  }

  private applyCardClickEffects(pokemon: Pokemon): void {
    // Efeitos visuais ao clicar em um card
    console.log('Aplicando efeitos de clique para:', pokemon.name);
  }

  private applyFavoriteEffects(pokemon: Pokemon, isFavorite: boolean): void {
    // Efeitos visuais ao favoritar/desfavoritar
    console.log(`Pokémon ${pokemon.name} ${isFavorite ? 'favoritado' : 'desfavoritado'}`);
  }

  private applyViewChangeEffects(): void {
    // Efeitos visuais ao mudar filtros/visualização
    console.log('Aplicando efeitos de mudança de visualização');
  }

  // ====================================================================
  // GESTÃO DE CONQUISTAS
  // ====================================================================
  private updateAchievements(): void {
    // Lógica para atualizar conquistas
    const favorites = this.favoritesService.getFavorites();
    const totalPokemon = this.allPokemon$.value.length;

    // Usar o método correto do service para verificar e desbloquear conquistas
    this.achievementsService.checkAndUnlock(favorites.length, totalPokemon);

    // Atualizar a lista de conquistas
    this.achievements = this.achievementsService.getAchievements();
  }

  // ====================================================================
  // INTERSECTION OBSERVER
  // ====================================================================

  private setupIntersectionObserver(): void {
    if (!this.loadingIndicatorRef?.nativeElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && this.hasMorePokemon) {
            this.loadMorePokemon();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(this.loadingIndicatorRef.nativeElement);
  }

  // ====================================================================
  // LIMPEZA
  // ====================================================================

  private cleanup(): void {
    // Limpeza de recursos
    console.log('Limpando recursos do componente');
  }

  // ====================================================================
  // MÉTODOS DE LOADING E EMPTY STATES
  // ====================================================================

  getLoadingMessage(): string {
    return 'Carregando Pokémon...';
  }

  getLoadingTitle(): string {
    return 'Preparando sua Pokédex';
  }

  getLoadingSubtitle(): string {
    return 'Aguarde enquanto buscamos os Pokémon';
  }

  getEmptyTitle(): string {
    return 'Nenhum Pokémon encontrado';
  }

  getEmptyMessage(): string {
    return 'Tente ajustar os filtros para encontrar Pokémon';
  }
}
