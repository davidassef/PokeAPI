import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, LoadingController, AlertController, ToastController, InfiniteScrollCustomEvent } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { Pokemon, PokemonListResponse } from '../../models/pokemon.model';
import { PokemonFilters } from '../../models/app.model';
import { PokeApiService } from '../../core/services/pokeapi.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { AudioService } from '../../core/services/audio.service';
import { FilterOptions } from '../../shared/components/search-filter/search-filter.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  pokemon: Pokemon[] = [];
  loading = false;
  showSearch = false;
  hasMoreData = true;

  currentFilters: PokemonFilters = {
    name: '',
    elementTypes: [],
    movementTypes: [],
    generation: undefined,
    sortBy: 'id',
    sortOrder: 'asc'
  };

  favorites: number[] = [];
  currentPage = 1;
  pokemonPerPage = 20;
  private destroy$ = new Subject<void>();

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
    private favoritesService: FavoritesService,
    private audioService: AudioService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadInitialPokemon();
    this.loadFavorites();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carrega os primeiros Pokémons
   */
  private async loadInitialPokemon() {
    this.loading = true;
    try {
      const response = await this.pokeApiService.getPokemonList(this.pokemonPerPage, 0).toPromise();
      if (response?.results) {
        this.pokemon = await this.loadPokemonDetails(response.results);
        this.hasMoreData = response.results.length === this.pokemonPerPage;
      }
    } catch (error) {
      console.error('Erro ao carregar Pokémons:', error);
      this.showErrorToast();
    } finally {
      this.loading = false;
    }
  }

  /**
   * Carrega mais Pokémons (scroll infinito)
   */
  async loadMorePokemon(event: InfiniteScrollCustomEvent) {
    try {
      const offset = this.currentPage * this.pokemonPerPage;
      const response = await this.pokeApiService.getPokemonList(this.pokemonPerPage, offset).toPromise();

      if (response?.results) {
        const newPokemon = await this.loadPokemonDetails(response.results);
        this.pokemon = [...this.pokemon, ...newPokemon];
        this.currentPage++;
        this.hasMoreData = response.results.length === this.pokemonPerPage;
      } else {
        this.hasMoreData = false;
      }
    } catch (error) {
      console.error('Erro ao carregar mais Pokémons:', error);
      this.hasMoreData = false;
    } finally {
      event.target.complete();
    }
  }

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
   * Carrega lista de favoritos
   */
  private loadFavorites() {
    this.favoritesService.getFavorites()
      .pipe(takeUntil(this.destroy$))
      .subscribe(favorites => {
        this.favorites = favorites.map(fav => fav.pokemon_id).filter((id): id is number => id !== undefined);
      });
  }

  /**
   * Alterna exibição do filtro de busca
   */
  toggleSearch() {
    this.showSearch = !this.showSearch;
  }  /**
   * Manipula mudanças nos filtros
   */
  onFiltersChanged(filters: FilterOptions) {
    console.log('[HomePage] Filtros recebidos:', filters);
    this.currentFilters = {
      name: filters.searchTerm || '',
      elementTypes: filters.selectedElementTypes || [],
      movementTypes: filters.selectedMovementTypes || [],
      generation: filters.selectedGeneration || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    };
    this.applyFilters();
  }

  /**
   * Manipula mudanças na busca
   */
  onSearchChanged(searchTerm: string) {
    this.currentFilters.name = searchTerm;
    this.applyFilters();
  }

  /**
   * Aplica filtros aos Pokémons
   */
  private async applyFilters() {
    console.log('[HomePage] Aplicando filtros:', this.currentFilters);
    this.loading = true;
    try {
      let pokemons: Pokemon[] = [];
      // Busca por nome tem prioridade
      if (this.currentFilters.name) {
        pokemons = (await this.pokeApiService.searchPokemon(this.currentFilters.name, 1000).toPromise()) || [];
      } else {
        // Carrega uma lista grande para filtrar localmente
        const response = await this.pokeApiService.getPokemonList(1000, 0).toPromise();
        if (response?.results) {
          pokemons = await this.loadPokemonDetails(response.results);
        }
      }
      // Filtro por tipos de elemento
      if (this.currentFilters.elementTypes && this.currentFilters.elementTypes.length > 0) {
        pokemons = pokemons.filter(pokemon =>
          Array.isArray(pokemon.types) &&
          Array.isArray(this.currentFilters.elementTypes) &&
          pokemon.types.length > 0 &&
          pokemon.types.some(t => t && t.type && typeof t.type.name === 'string' && (this.currentFilters.elementTypes?.includes?.(t.type.name)))
        );
      }
      // Filtro por tipos de movimentação
      if (this.currentFilters.movementTypes && this.currentFilters.movementTypes.length > 0) {
        pokemons = pokemons.filter(pokemon =>
          Array.isArray(pokemon.types) &&
          Array.isArray(this.currentFilters.movementTypes) &&
          pokemon.types.length > 0 &&
          pokemon.types.some(t => t && t.type && typeof t.type.name === 'string' && (this.currentFilters.movementTypes?.includes?.(t.type.name)))
        );
      }
      // Filtro por geração
      if (this.currentFilters.generation) {
        // Busca espécies da geração e filtra por id
        const speciesList = await this.pokeApiService.getPokemonsByGeneration(this.currentFilters.generation).toPromise();
        const allowedNames = (speciesList || []).map(s => s.name);
        pokemons = pokemons.filter(p => allowedNames.includes(p.name));
      }
      // Ordenação
      if (this.currentFilters.sortBy === 'name') {
        pokemons = pokemons.sort((a, b) =>
          this.currentFilters.sortOrder === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)
        );
      } else if (this.currentFilters.sortBy === 'height') {
        pokemons = pokemons.sort((a, b) =>
          this.currentFilters.sortOrder === 'asc'
            ? a.height - b.height
            : b.height - a.height
        );
      } else if (this.currentFilters.sortBy === 'weight') {
        pokemons = pokemons.sort((a, b) =>
          this.currentFilters.sortOrder === 'asc'
            ? a.weight - b.weight
            : b.weight - a.weight
        );
      } else {
        pokemons = pokemons.sort((a, b) =>
          this.currentFilters.sortOrder === 'asc'
            ? a.id - b.id
            : b.id - a.id
        );
      }
      // Garante que todos os pokémons possuem dados completos (types, stats, etc)
      pokemons = pokemons.filter(p => p && Array.isArray(p.types) && p.types.length > 0 && Array.isArray(p.stats) && p.stats.length > 0);
      this.pokemon = pokemons;
      console.log('[HomePage] Lista final de pokémons:', this.pokemon);
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      this.showErrorToast();
    } finally {
      this.loading = false;
    }
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
    this.loadInitialPokemon();
  }

  /**
   * Navega para detalhes do Pokémon
   */
  navigateToDetails(pokemonId: number) {
    this.router.navigate(['/pokemon', pokemonId]);
  }

  /**
   * Alterna favorito
   */
  async toggleFavorite(pokemon: Pokemon) {
    try {
      const isFavorite = this.isFavorite(pokemon.id);

      if (isFavorite) {
        await this.favoritesService.removeFromFavorites(pokemon.id);
        this.showToast(this.translate.instant('HOME.REMOVED_FROM_FAVORITES'));
      } else {
        await this.favoritesService.addToFavorites(pokemon);
        this.showToast(this.translate.instant('HOME.ADDED_TO_FAVORITES'));
      }
    } catch (error) {
      console.error('Erro ao alterar favorito:', error);
      this.showErrorToast();
    }
  }

  /**
   * Verifica se Pokémon é favorito
   */
  isFavorite(pokemonId: number): boolean {
    return this.favorites.includes(pokemonId);
  }

  /**
   * Rola para o topo
   */
  async scrollToTop() {
    await this.content.scrollToTop(500);
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
      message: this.translate.instant('HOME.ERROR_LOADING'),
      duration: 3000,
      color: 'danger',
      position: 'bottom'
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
      position: 'bottom'
    });
    await toast.present();
  }
}
