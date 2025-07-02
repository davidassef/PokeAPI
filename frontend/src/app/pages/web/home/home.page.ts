import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonContent, LoadingController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { AudioService } from '../../../core/services/audio.service';
import { CapturedService } from '../../../core/services/captured.service';
import { PokeApiService } from '../../../core/services/pokeapi.service';
import { SyncAction, SyncService } from '../../../core/services/sync.service';
import { PokemonFilters } from '../../../models/app.model';
import { Pokemon } from '../../../models/pokemon.model';
import { FilterOptions } from '../../../shared/components/search-filter/search-filter.component';
import { DetailsModalComponent } from '../details/details-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  @ViewChild(DetailsModalComponent) detailsModal!: DetailsModalComponent;

  pokemon: Pokemon[] = [];
  loading = false;
  showSearch = false;
  // Paginação
  currentPage = 1;
  totalPages = 1;
  totalPokemons = 0;
  pokemonPerPage = 12;
  paginatedPokemons: any[] = [];

  currentFilters: PokemonFilters = {
    name: '',
    elementTypes: [],
    movementTypes: [],
    generation: undefined,
    sortBy: 'id',
    sortOrder: 'asc'
  };

  captured: number[] = [];
  private destroy$ = new Subject<void>();

  showDetailsModal = false;
  selectedPokemonId: number | null = null;

  get currentFilterOptions(): FilterOptions {
    return {
      searchTerm: this.currentFilters.name || '',
      selectedElementTypes: this.currentFilters.elementTypes || [],
      selectedMovementTypes: this.currentFilters.movementTypes || [],
      selectedGeneration: this.currentFilters.generation || null,
      sortBy: this.currentFilters.sortBy,
      sortOrder: this.currentFilters.sortOrder
    };
  }

  constructor(
    private router: Router,
    private pokeApiService: PokeApiService,
    private capturedService: CapturedService,
    private audioService: AudioService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController,
    private translate: TranslateService,
    private syncService: SyncService
  ) {}

  ngOnInit() {
    this.loadPaginatedPokemons();
    this.loadCaptured();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carrega Pokémons paginados
   */
  loadPaginatedPokemons(resetPage: boolean = false) {
    if (resetPage) this.currentPage = 1;
    this.loading = true;

    const filters = {
      name: this.currentFilters.name,
      type: this.currentFilters.elementTypes?.[0], // Mantém compatibilidade
      generation: this.currentFilters.generation,
      orderBy: this.currentFilters.sortBy,
      sortOrder: this.currentFilters.sortOrder,
      elementTypes: this.currentFilters.elementTypes,
      movementTypes: this.currentFilters.movementTypes
    };

    console.log('[HOME] Aplicando filtros:', filters);

    this.pokeApiService.getPokemonsPaginated(this.currentPage, this.pokemonPerPage, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (result) => {
        console.log('[HOME] Resultado da busca:', result);
        this.totalPokemons = result.total;
        this.totalPages = result.totalPages;
        // Carregar detalhes dos pokémons da página
        this.paginatedPokemons = await this.loadPokemonDetails(result.pokemons);
        this.loading = false;
      }, err => {
        console.error('[HOME] Erro ao carregar Pokémons:', err);
        this.loading = false;
        this.paginatedPokemons = [];
        this.totalPokemons = 0;
        this.totalPages = 1;
      });
  }

  // Navegação de página
  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadPaginatedPokemons();
  }
  nextPage() { this.goToPage(this.currentPage + 1); }
  prevPage() { this.goToPage(this.currentPage - 1); }
  firstPage() { this.goToPage(1); }
  lastPage() { this.goToPage(this.totalPages); }

  /**
   * Carrega detalhes de uma lista de Pokémons
   */
  private async loadPokemonDetails(pokemonList: any[]): Promise<Pokemon[]> {
    const promises = pokemonList.map(async (item) => {
      try {
        return await this.pokeApiService.getPokemon(this.extractIdFromUrl(item.url)).toPromise();
      } catch (error) {
        console.error(`Erro ao carregar detalhes do Pokémon ${item.name}:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter((pokemon: any): pokemon is Pokemon => pokemon !== null);
  }

  /**
   * Extrai o ID da URL do Pokémon
   */
  private extractIdFromUrl(url: string): number {
    const matches = url.match(/\/(\d+)\/$/);
    return matches ? parseInt(matches[1], 10) : 0;
  }

  /**
   * Carrega lista de capturados
   */
  private loadCaptured() {
    this.capturedService.getCaptured()
      .pipe(takeUntil(this.destroy$))
      .subscribe(captured => {
        this.captured = captured.map(cap => cap.pokemon_id).filter((id): id is number => id !== undefined);
      });
  }

  /**
   * Alterna exibição do filtro de busca
   */
  toggleSearch() {
    this.showSearch = !this.showSearch;
  }

  /**
   * Manipula mudanças nos filtros
   */
  onFiltersChanged(filters: FilterOptions) {
    this.currentFilters = {
      name: filters.searchTerm || '',
      elementTypes: filters.selectedElementTypes || [],
      movementTypes: filters.selectedMovementTypes || [],
      generation: filters.selectedGeneration || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    };
    this.loadPaginatedPokemons(true); // Resetar para página 1
  }

  /**
   * Manipula mudanças na busca
   */
  onSearchChanged(searchTerm: string) {
    this.currentFilters.name = searchTerm;
    this.loadPaginatedPokemons(true);
  }

  /**
   * Limpa todos os filtros
   */
  clearFilters() {
    this.currentFilters = {
      name: '',
      elementTypes: [],
      movementTypes: [],
      generation: undefined,
      sortBy: 'id',
      sortOrder: 'asc'
    };
    this.showSearch = false;
    this.currentPage = 1;
    this.loadPaginatedPokemons(true);
  }

  /**
   * Navega para detalhes do Pokémon
   */
  navigateToDetails(pokemonId: number) {
    this.router.navigate(['/pokemon', pokemonId]);
  }

  /**
   * Alterna captura
   */
  onCaptureToggled(event: { pokemon: Pokemon, isCaptured: boolean }) {
    const { pokemon, isCaptured } = event;
    if (isCaptured) {
      this.showToast(this.translate.instant('home.added_to_captured'));
      const action: SyncAction = {
        pokemonId: pokemon.id,
        action: 'capture',
        timestamp: Date.now(),
        payload: { added: true }
      };
      this.syncService.addToQueue(action);
    } else {
      this.showToast(this.translate.instant('home.removed_from_captured'));
      const action: SyncAction = {
        pokemonId: pokemon.id,
        action: 'capture',
        timestamp: Date.now(),
        payload: { removed: true }
      };
      this.syncService.addToQueue(action);
    }
    this.loadCaptured();
  }

  /**
   * Verifica se Pokémon está capturado
   */
  isCaptured(pokemonId: number): boolean {
    return this.captured.includes(pokemonId);
  }

  /**
   * Função para trackBy do ngFor
   */
  trackByPokemonId(index: number, pokemon: Pokemon): number {
    return pokemon.id;
  }

  /**
   * Calcula delay de animação para cards
   */
  getAnimationDelay(index: number): number {
    return index * 100;
  }

  /**
   * Exibe toast de erro
   */
  private async showErrorToast() {
    const toast = await this.toastController.create({
      message: this.translate.instant('home.error_loading'),
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }

  /**
   * Exibe toast personalizado
   */
  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top'
    });
    await toast.present();
  }

  /**
   * Rola para o topo da página
   */
  scrollToTop() {
    if (this.content) {
      this.content.scrollToTop(500);
    }
  }

  // Atualiza capturados sempre que a página Home for exibida
  ionViewWillEnter() {
    this.loadCaptured();
  }

  /**
   * Retorna a quantidade de capturas pendentes de sincronização
   */
  getPendingSyncCount(): Promise<number> {
    return this.syncService.getPendingCount();
  }

  openDetailsModal(pokemonId: number) {
    this.selectedPokemonId = pokemonId;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedPokemonId = null;
  }

  surpreendaMe() {
    const maxId = 898;
    const randomId = Math.floor(Math.random() * maxId) + 1;
    this.openDetailsModal(randomId);
  }
}
