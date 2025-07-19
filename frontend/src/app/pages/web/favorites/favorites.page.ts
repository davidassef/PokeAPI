import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FavoritesService, FavoriteData, FavoritesStats } from '../../../core/services/favorites.service';
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
  searchTerm: string = '';
  selectedType: string = '';
  sortBy: 'name' | 'date' | 'type' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Modal de detalhes
  showDetailsModal: boolean = false;
  selectedPokemonId: number | null = null;

  constructor(
    private favoritesService: FavoritesService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadFavorites();
    this.loadStats();
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

    this.favoritesService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe(favorites => {
        this.favorites = favorites;
        this.applyFiltersAndSort();
        this.isLoading = false;
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
  }

  /**
   * Manipuladores de eventos de filtro
   */
  onSearchChange(event: any): void {
    this.searchTerm = event.detail.value || '';
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
}
