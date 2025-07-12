import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonContent, ToastController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { AudioService } from '../../../core/services/audio.service';
import { CapturedService } from '../../../core/services/captured.service';
import { PokeApiService } from '../../../core/services/pokeapi.service';
import { PokemonFilters } from '../../../models/app.model';
import { Pokemon } from '../../../models/pokemon.model';
import { FilterOptions } from '../../../shared/components/search-filter/search-filter.component';
import { AuthService } from '../../../core/services/auth.service';
import { User } from 'src/app/models/user.model';
import { AuthModalNewComponent } from '../../../shared/components/auth-modal-new/auth-modal-new.component';

@Component({
  selector: 'app-mobile-captured',
  templateUrl: './captured.page.html',
  styleUrls: ['./captured.page.scss'],
})
export class CapturedPage implements OnInit, OnDestroy {
  Math = Math; // Para usar no template
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  capturedPokemon: Pokemon[] = [];
  loading = false;
  showSearch = false;
  // Paginação otimizada para mobile
  currentPage = 1;
  totalPages = 1;
  capturedPerPage = 8; // Menos cards por página em mobile
  paginatedCaptured: Pokemon[] = [];

  currentFilters: PokemonFilters = {
    name: '',
    elementTypes: [],
    movementTypes: [],
    generation: undefined,
    sortBy: 'id',
    sortOrder: 'asc'
  };

  private destroy$ = new Subject<void>();

  showDetailsModal = false;
  selectedPokemonId: number | null = null;

  isAuthenticated = false;
  user: User | null = null;
  showUserMenu = false;

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
    private capturedService: CapturedService,
    private pokeApiService: PokeApiService,
    private audioService: AudioService,
    private alertController: AlertController,
    private toastController: ToastController,
    private translate: TranslateService,
    public router: Router,
    private authService: AuthService,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.authService.getAuthState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        this.isAuthenticated = isAuthenticated;
        if (isAuthenticated) {
          this.user = this.authService.getCurrentUser();
          this.loadCaptured();
        } else {
          this.user = null;
          this.capturedPokemon = [];
        }
      });

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carrega Pokémons capturados
   */
  loadCaptured() {
    if (!this.isAuthenticated) {
      this.capturedPokemon = [];
      this.updatePagination();
      return;
    }

    this.loading = true;
    this.capturedService.getCaptured()
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (captured) => {
        try {
          const pokemonPromises = captured
            .filter(cap => cap.pokemon_id)
            .map(cap => this.pokeApiService.getPokemon(cap.pokemon_id!).toPromise());

          const results = await Promise.all(pokemonPromises);
          this.capturedPokemon = results.filter((pokemon): pokemon is Pokemon => pokemon !== null);
          this.applyFiltersAndSort();
          this.updatePagination();
        } catch (error) {
          console.error('[MOBILE-CAPTURED] Erro ao carregar capturados:', error);
          this.capturedPokemon = [];
          this.updatePagination();
        } finally {
          this.loading = false;
        }
      });
  }

  /**
   * Aplica filtros e ordenação
   */
  private applyFiltersAndSort() {
    let filtered = [...this.capturedPokemon];

    // Filtro por nome
    if (this.currentFilters.name) {
      const searchTerm = this.currentFilters.name.toLowerCase();
      filtered = filtered.filter(pokemon =>
        pokemon.name.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por tipos de elemento
    if (this.currentFilters.elementTypes && this.currentFilters.elementTypes.length > 0) {
      filtered = filtered.filter(pokemon =>
        pokemon.types.some(type =>
          this.currentFilters.elementTypes!.includes(type.type.name)
        )
      );
    }

    // Filtro por geração
    if (this.currentFilters.generation) {
      filtered = filtered.filter(pokemon => {
        const generation = this.getGenerationFromId(pokemon.id);
        return generation === this.currentFilters.generation;
      });
    }

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (this.currentFilters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'id':
        default:
          comparison = a.id - b.id;
          break;
      }
      return this.currentFilters.sortOrder === 'desc' ? -comparison : comparison;
    });

    this.capturedPokemon = filtered;
  }

  /**
   * Atualiza paginação
   */
  private updatePagination() {
    this.totalPages = Math.ceil(this.capturedPokemon.length / this.capturedPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    this.updatePaginatedCaptured();
  }

  /**
   * Atualiza lista paginada
   */
  private updatePaginatedCaptured() {
    const startIndex = (this.currentPage - 1) * this.capturedPerPage;
    const endIndex = startIndex + this.capturedPerPage;
    this.paginatedCaptured = this.capturedPokemon.slice(startIndex, endIndex);
  }

  // Navegação de página
  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePaginatedCaptured();
  }
  nextPage() { this.goToPage(this.currentPage + 1); }
  prevPage() { this.goToPage(this.currentPage - 1); }
  firstPage() { this.goToPage(1); }
  lastPage() { this.goToPage(this.totalPages); }

  /**
   * Determina geração baseada no ID
   */
  private getGenerationFromId(id: number): number {
    if (id <= 151) return 1;
    if (id <= 251) return 2;
    if (id <= 386) return 3;
    if (id <= 493) return 4;
    if (id <= 649) return 5;
    if (id <= 721) return 6;
    if (id <= 809) return 7;
    if (id <= 898) return 8;
    return 9;
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
    this.applyFiltersAndSort();
    this.currentPage = 1;
    this.updatePagination();
  }

  /**
   * Manipula mudanças na busca
   */
  onSearchChanged(searchTerm: string) {
    this.currentFilters.name = searchTerm;
    this.applyFiltersAndSort();
    this.currentPage = 1;
    this.updatePagination();
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
    this.applyFiltersAndSort();
    this.updatePagination();
  }

  /**
   * Alterna captura
   */
  onCaptureToggled(event: any) {
    const { pokemon, isCaptured } = event;
    if (!isCaptured) {
      // Pokemon foi removido da captura
      this.capturedPokemon = this.capturedPokemon.filter(p => p.id !== pokemon.id);
      this.updatePagination();
      this.showToast('captured.removed_from_captured');
    }
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
   * Exibe toast personalizado
   */
  private async showToast(messageKey: string) {
    const message = await this.translate.get(messageKey).toPromise();
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
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

  ionViewWillEnter() {
    document.body.classList.add('mobile-captured-page-active');
    if (this.isAuthenticated) {
      this.loadCaptured();
    }
  }

  ionViewWillLeave() {
    document.body.classList.remove('mobile-captured-page-active');
  }

  openDetailsModal(pokemonId: number) {
    console.log('🔍 Mobile Captured - openDetailsModal chamado:', {
      pokemonId,
      currentUrl: window.location.href,
      timestamp: new Date().toISOString()
    });

    this.selectedPokemonId = pokemonId;
    this.showDetailsModal = true;

    console.log('📱 Mobile Captured - Estado do modal atualizado:', {
      selectedPokemonId: this.selectedPokemonId,
      showDetailsModal: this.showDetailsModal
    });
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedPokemonId = null;
  }

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
          this.loadCaptured();
        }
      }
    });

    return await modal.present();
  };

  abrirCadastro = async () => {
    const modal = await this.modalController.create({
      component: AuthModalNewComponent,
      cssClass: 'auth-modal-fixed',
      componentProps: {
        initialMode: 'register'
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.success) {
        this.isAuthenticated = this.authService.isAuthenticated();
        if (this.isAuthenticated) {
          this.user = this.authService.getCurrentUser();
          this.loadCaptured();
        }
      }
    });

    return await modal.present();
  };

  logout() {
    this.authService.logout();
    window.location.reload();
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }
}
