import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonContent, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { AudioService } from '../../../core/services/audio.service';
import { CapturedService } from '../../../core/services/captured.service';
import { PokeApiService } from '../../../core/services/pokeapi.service';
import { SyncAction, SyncService } from '../../../core/services/sync.service';
import { PokemonFilters } from '../../../models/app.model';
import { Pokemon } from '../../../models/pokemon.model';
import { FilterOptions } from '../../../shared/components/search-filter/search-filter.component';

@Component({
  selector: 'app-captured',
  templateUrl: './captured.page.html',
  styleUrls: ['./captured.page.scss'],
})
export class CapturedPage implements OnInit, OnDestroy {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  capturedPokemon: Pokemon[] = [];
  loading = false;
  showSearch = false;
  // Paginação
  currentPage = 1;
  totalPages = 1;
  capturedPerPage = 12;
  paginatedCaptured: Pokemon[] = [];

  // Tipagem igual à Pokédex
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
    private syncService: SyncService // Adicionado para sincronização automática
  ) {}

  ngOnInit() {
    this.loadCaptured();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadCaptured() {
    this.loading = true;
    try {
      this.capturedService.captured$
        .pipe(takeUntil(this.destroy$))
        .subscribe(async (captured) => {
          const pokemonPromises = captured.map(c =>
            this.pokeApiService.getPokemon(c.pokemon_id).toPromise()
          );
          const pokemonData = await Promise.all(pokemonPromises);
          this.capturedPokemon = pokemonData.filter(p => p !== undefined) as Pokemon[];
          this.applyFiltersAndPaginate();
          this.loading = false;
        });
    } catch (error) {
      console.error('Erro ao carregar capturados:', error);
      this.loading = false;
    }
  }

  toggleSearch() {
    this.showSearch = !this.showSearch;
  }

  onFiltersChanged(filters: FilterOptions) {
    this.currentFilters = {
      name: filters.searchTerm || '',
      elementTypes: filters.selectedElementTypes || [],
      movementTypes: filters.selectedMovementTypes || [],
      generation: filters.selectedGeneration || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    };
    this.currentPage = 1;
    this.applyFiltersAndPaginate();
  }

  onSearchChanged(searchTerm: string) {
    this.currentFilters.name = searchTerm;
    this.currentPage = 1;
    this.applyFiltersAndPaginate();
  }

  applyFiltersAndPaginate() {
    let filtered = [...this.capturedPokemon];
    if (this.currentFilters.name) {
      filtered = filtered.filter(pokemon =>
        (pokemon.name?.toLowerCase() || '').includes((this.currentFilters.name || '').toLowerCase())
      );
    }
    // Filtros adicionais podem ser aplicados aqui se necessário
    if (this.currentFilters.sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      filtered.sort((a, b) => a.id - b.id);
    }
    if (this.currentFilters.sortOrder === 'desc') {
      filtered.reverse();
    }
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.capturedPerPage));
    const start = (this.currentPage - 1) * this.capturedPerPage;
    const end = start + this.capturedPerPage;
    this.paginatedCaptured = filtered.slice(start, end);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyFiltersAndPaginate();
  }
  nextPage() { this.goToPage(this.currentPage + 1); }
  prevPage() { this.goToPage(this.currentPage - 1); }

  firstPage() {
    if (this.currentPage !== 1) {
      this.goToPage(1);
    }
  }

  lastPage() {
    if (this.currentPage !== this.totalPages) {
      this.goToPage(this.totalPages);
    }
  }

  trackByPokemonId(index: number, pokemon: Pokemon): number {
    return pokemon.id;
  }

  getAnimationDelay(index: number): number {
    return index * 100;
  }

  navigateToDetails(pokemonId: number) {
    this.selectedPokemonId = pokemonId;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedPokemonId = null;
  }

  /**
   * Remove Pokémon dos capturados (apenas local)
   * @param pokemon Pokémon para remover dos capturados
   */
  async removeFromCaptured(pokemon: Pokemon) {
    try {
      await this.capturedService.removeFromCaptured(pokemon.id);
      this.showToast(this.translate.instant('captured.removed_from_captured'));
      this.loadCaptured();
    } catch (error) {
      console.error('Erro ao remover dos capturados:', error);
      this.showErrorToast();
    }
  }

  scrollToTop() {
    if (this.content) {
      this.content.scrollToTop(500);
    }
  }

  private async showErrorToast() {
    const toast = await this.toastController.create({
      message: this.translate.instant('captured.error_release_captured'),
      duration: 3000,
      position: 'top',
      color: 'danger'
    });
    await toast.present();
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'success'
    });
    await toast.present();
  }
}
