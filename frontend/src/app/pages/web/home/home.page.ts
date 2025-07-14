import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonContent, LoadingController, ToastController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { AudioService } from '../../../core/services/audio.service';
import { CapturedService } from '../../../core/services/captured.service';
import { PokeApiService } from '../../../core/services/pokeapi.service';
import { RbacService, Permission } from '../../../core/services/rbac.service';
import { PokemonFilters } from '../../../models/app.model';
import { Pokemon } from '../../../models/pokemon.model';
import { FilterOptions } from '../../../shared/components/search-filter/search-filter.component';
import { DetailsModalComponent } from '../details/details-modal.component';
import { AuthService } from '../../../core/services/auth.service';
import { User } from 'src/app/models/user.model';
import { AuthModalNewComponent } from '../../../shared/components/auth-modal-new/auth-modal-new.component';
import { AdminPokemonModalComponent } from '../../../shared/components/admin-pokemon-modal/admin-pokemon-modal.component';

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

  // Admin controls
  canAddPokemon = false;
  isAdmin = false;

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
    private router: Router,
    private pokeApiService: PokeApiService,
    private capturedService: CapturedService,
    private audioService: AudioService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController,
    private translate: TranslateService,
    private authService: AuthService,
    private modalController: ModalController,
    private rbacService: RbacService
  ) {}

  ngOnInit() {
    this.loadPaginatedPokemons();
    this.loadCaptured();

    // ✅ CORREÇÃO: Inscrever-se no estado de autenticação reativo
    this.authService.getAuthState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        console.log('[HomePage] Estado de autenticação atualizado:', isAuthenticated);
        this.isAuthenticated = isAuthenticated;
        if (isAuthenticated) {
          this.user = this.authService.getCurrentUser();
          console.log('[HomePage] Usuário carregado:', this.user);
        } else {
          this.user = null;
          console.log('[HomePage] Usuário deslogado');
        }
      });

    // Inscrever-se no usuário atual
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        console.log('[HomePage] Usuário atual atualizado:', user);
        this.user = user;
      });

    // Verifica permissões de administrador
    this.rbacService.hasPermission(Permission.ADD_POKEMON)
      .pipe(takeUntil(this.destroy$))
      .subscribe(canAdd => {
        this.canAddPokemon = canAdd;
      });

    this.rbacService.isAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAdmin => {
        this.isAdmin = isAdmin;
      });
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
    // Toast específico será exibido pelo pokemon-card component
    // A sincronização é feita automaticamente pelo CapturedService
    // quando o toggle é feito via UI - não fazemos sync direto aqui
  }

  /**
   * Verifica se Pokémon está capturado
   */
  isCaptured(pokemonId: number): boolean {
    // Usa o estado atual do serviço em vez da lista local
    return this.capturedService.isCapturedSync(pokemonId);
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
      message: await this.translate.get('home.error_loading').toPromise(),
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }

  /**
   * Exibe toast personalizado
   */
  private async showToast(messageKey: string) {
    const message = await this.translate.get(messageKey).toPromise();
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
    document.body.classList.add('home-page-active');
    // Força sincronização completa com o backend
    this.capturedService.forceSyncWithBackend().subscribe();
  }

  ionViewWillLeave() {
    document.body.classList.remove('home-page-active');
  }

  /**
   * Retorna a quantidade de capturas pendentes de sincronização
   * Como usamos sistema pull-based, sempre retorna 0
   */
  getPendingSyncCount(): Promise<number> {
    return Promise.resolve(0);
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

  abrirPerfil() {
    // TODO: Abrir modal de perfil do usuário
    console.log('Abrir modal de perfil do usuário');
  }

  logout() {
    this.authService.logout();
    window.location.reload();
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  // Método para abrir modal de adicionar Pokemon (apenas para admins)
  async openAddPokemonModal() {
    if (!this.canAddPokemon) {
      console.warn('Usuário não tem permissão para adicionar Pokemon');
      return;
    }

    const modal = await this.modalController.create({
      component: AdminPokemonModalComponent,
      cssClass: 'admin-pokemon-modal',
      componentProps: {
        mode: 'add'
      },
      backdropDismiss: true,
      showBackdrop: true
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.success && result.data.pokemon) {
        // Pokemon foi adicionado com sucesso
        this.showSuccessToast('admin.pokemon.success.created');
        // Recarregar a lista de Pokemon
        this.loadPaginatedPokemons();
      }
    });

    return await modal.present();
  }

  // Método para lidar com atualização de Pokemon
  onPokemonUpdated(updatedPokemon: Pokemon) {
    // Encontrar e atualizar o Pokemon na lista
    const index = this.pokemon.findIndex(p => p.id === updatedPokemon.id);
    if (index !== -1) {
      this.pokemon[index] = updatedPokemon;
      this.updatePaginatedPokemons();
    }
    this.showSuccessToast('admin.pokemon.success.updated');
  }

  // Método para lidar com exclusão de Pokemon
  onPokemonDeleted(pokemonId: number) {
    // Remover o Pokemon da lista
    this.pokemon = this.pokemon.filter(p => p.id !== pokemonId);
    this.updatePaginatedPokemons();
    this.showSuccessToast('admin.pokemon.success.deleted');
  }

  private async showSuccessToast(messageKey: string) {
    const message = await this.translate.get(messageKey).toPromise();
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'success'
    });
    await toast.present();
  }

  private updatePaginatedPokemons() {
    // Atualizar a paginação após mudanças na lista
    this.totalPokemons = this.pokemon.length;
    this.totalPages = Math.ceil(this.totalPokemons / this.pokemonPerPage);

    // Verificar se a página atual ainda é válida
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }

    this.loadPaginatedPokemons();
  }
}
