import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FavoritesService, FavoriteData, FavoritesStats } from '../../../core/services/favorites.service';
import { FilterOptions } from '../../../shared/components/search-filter/search-filter.component';
import { Router } from '@angular/router';

/**
 * Página de favoritos - versão web
 * Exibe todos os Pokémon favoritos do usuário com opções de filtro e ordenação
 */
@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss']
})
export class FavoritesPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Dados
  favorites: FavoriteData[] = [];
  filteredFavorites: FavoriteData[] = [];
  stats: FavoritesStats | null = null;

  // Estados da UI
  isLoading: boolean = true;
  loading: boolean = true;
  searchTerm: string = '';
  selectedType: string = '';
  sortBy: 'name' | 'date' | 'type' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Modal de detalhes
  showDetailsModal: boolean = false;
  selectedPokemonId: number | null = null;

  // Paginação
  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 1;

  // Propriedades para o template
  totalFavorites: number = 0;
  averageRating: number = 0;
  paginatedFavorites: any[] = [];

  constructor(
    private favoritesService: FavoritesService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadFavorites();
    this.loadStats();
    this.updatePagination();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carrega lista de favoritos
   */
  private loadFavorites(): void {
    this.isLoading = true;
    this.loading = true;

    this.favoritesService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe(favorites => {
        this.favorites = favorites;
        this.applyFiltersAndSort();
        this.isLoading = false;
        this.loading = false;
      });
  }

  /**
   * Carrega estatísticas
   */
  private loadStats(): void {
    this.favoritesService.stats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.stats = stats;
      });
  }

  /**
   * Aplica filtros e ordenação
   */
  private applyFiltersAndSort(): void {
    let filtered = [...this.favorites];

    // Filtro por busca
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(fav =>
        fav.name.toLowerCase().includes(term) ||
        fav.pokemonId.toString().includes(term)
      );
    }

    // Filtro por tipo
    if (this.selectedType) {
      filtered = filtered.filter(fav =>
        fav.types.includes(this.selectedType)
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = a.addedAt.getTime() - b.addedAt.getTime();
          break;
        case 'type':
          comparison = (a.types[0] || '').localeCompare(b.types[0] || '');
          break;
      }

      return this.sortOrder === 'desc' ? -comparison : comparison;
    });

    this.filteredFavorites = filtered;
    this.updatePagination();
  }

  /**
   * Manipuladores de eventos de filtro
   */
  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm || '';
    this.applyFiltersAndSort();
  }

  onTypeFilterChange(event: any): void {
    this.selectedType = event.detail.value || '';
    this.applyFiltersAndSort();
  }

  onSortChange(event: any): void {
    const value = event.detail.value;
    if (value) {
      const [sortBy, sortOrder] = value.split('-');
      this.sortBy = sortBy as 'name' | 'date' | 'type';
      this.sortOrder = sortOrder as 'asc' | 'desc';
      this.applyFiltersAndSort();
    }
  }

  /**
   * Abre modal de detalhes do Pokémon
   */
  openPokemonDetails(pokemonId: number): void {
    this.selectedPokemonId = pokemonId;
    this.showDetailsModal = true;
  }

  /**
   * Fecha modal de detalhes
   */
  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedPokemonId = null;
  }

  /**
   * Remove um favorito
   */
  onRemoveFavorite(pokemonId: number): void {
    this.favoritesService.removeFromFavorites(pokemonId);
  }

  /**
   * Limpa todos os favoritos (com confirmação)
   */
  async clearAllFavorites(): Promise<void> {
    // Implementar modal de confirmação
    const confirmed = confirm('Tem certeza que deseja remover todos os favoritos?');
    if (confirmed) {
      this.favoritesService.clearAllFavorites();
    }
  }

  /**
   * Exporta favoritos
   */
  exportFavorites(): void {
    const data = this.favoritesService.exportFavorites();
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `pokemon-favorites-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    window.URL.revokeObjectURL(url);
  }

  /**
   * Obtém tipos únicos dos favoritos
   */
  get uniqueTypes(): string[] {
    const types = new Set<string>();
    this.favorites.forEach(fav => {
      fav.types.forEach(type => types.add(type));
    });
    return Array.from(types).sort();
  }

  /**
   * Obtém opções de ordenação
   */
  get sortOptions() {
    return [
      { value: 'date-desc', label: 'Mais recentes primeiro' },
      { value: 'date-asc', label: 'Mais antigos primeiro' },
      { value: 'name-asc', label: 'Nome (A-Z)' },
      { value: 'name-desc', label: 'Nome (Z-A)' },
      { value: 'type-asc', label: 'Tipo (A-Z)' },
      { value: 'type-desc', label: 'Tipo (Z-A)' }
    ];
  }

  /**
   * Verifica se há favoritos
   */
  get hasFavorites(): boolean {
    return this.favorites.length > 0;
  }

  /**
   * Verifica se há resultados filtrados
   */
  get hasFilteredResults(): boolean {
    return this.filteredFavorites.length > 0;
  }

  /**
   * TrackBy function para otimizar renderização
   */
  trackByPokemonId(index: number, favorite: FavoriteData): number {
    return favorite.pokemonId;
  }

  /**
   * Obtém cor do tipo Pokémon
   */
  getTypeColor(type: string): string {
    const typeColors: { [key: string]: string } = {
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0',
      electric: '#F8D030',
      grass: '#78C850',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      dragon: '#7038F8',
      dark: '#705848',
      steel: '#B8B8D0',
      fairy: '#EE99AC'
    };
    return typeColors[type] || '#68A090';
  }

  /**
   * Métodos faltantes para o template
   */
  refreshFavorites(): void {
    this.loadFavorites();
    this.loadStats();
  }

  onFiltersChange(filters: FilterOptions): void {
    this.searchTerm = filters.searchTerm;
    this.applyFiltersAndSort();
  }

  openDetailsModal(pokemonId: number): void {
    this.selectedPokemonId = pokemonId;
    this.showDetailsModal = true;
  }

  onCaptureToggle(pokemonId: number): void {
    // Implementar lógica de captura se necessário
    console.log('Capture toggle for pokemon:', pokemonId);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private updatePagination(): void {
    this.totalFavorites = this.filteredFavorites.length;
    this.totalPages = Math.ceil(this.totalFavorites / this.itemsPerPage);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    this.paginatedFavorites = this.filteredFavorites.slice(startIndex, endIndex).map((fav, index) => ({
      ...fav,
      pokemon: {
        id: fav.pokemonId,
        name: fav.name,
        sprites: { other: { 'official-artwork': { front_default: fav.imageUrl } } },
        types: fav.types.map((type: string) => ({ type: { name: type } }))
      },
      animationDelay: index * 100
    }));

    // Calcular estatísticas
    if (this.stats) {
      this.averageRating = this.calculateAverageRating();
    }
  }

  private calculateAverageRating(): number {
    // Implementar cálculo de rating médio baseado nos tipos
    const typeRatings: { [key: string]: number } = {
      fire: 8.5, water: 8.0, grass: 7.5, electric: 8.2,
      psychic: 8.8, ice: 7.8, dragon: 9.2, dark: 8.1,
      fighting: 7.9, poison: 6.8, ground: 7.2, flying: 7.6,
      bug: 6.5, rock: 7.1, ghost: 8.3, steel: 8.0,
      fairy: 8.4, normal: 6.9
    };

    if (this.favorites.length === 0) return 0;

    const totalRating = this.favorites.reduce((sum, fav) => {
      const avgTypeRating = fav.types.reduce((typeSum, type) =>
        typeSum + (typeRatings[type] || 7.0), 0) / fav.types.length;
      return sum + avgTypeRating;
    }, 0);

    return totalRating / this.favorites.length;
  }
}
