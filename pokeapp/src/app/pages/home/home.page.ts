import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonContent } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { finalize } from 'rxjs/operators';

import { PokemonApiService } from '../../services/pokemon-api.service';
import { FavoritesService } from '../../services/favorites.service';
import { LocalizationService } from '../../services/localization.service';
import { PokemonTranslationService } from '../../services/pokemon-translation.service';
import { PokemonCardComponent } from '../../components/pokemon-card.component';
import { SharedHeaderComponent } from '../../components/shared-header.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Pokemon, FavoritePokemon } from '../../models/pokemon.model';
import { POKEMON_TYPES, getTypeColor, getContrastColor } from '../../utils/pokemon-types.util';

// Interface para filtros rápidos
interface QuickFilter {
  id: string;
  label: string;
  icon: string;
  active: boolean;
  filterFn: (pokemon: Pokemon) => boolean;
  color?: string;
  backgroundColor?: string;
  textColor?: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule, PokemonCardComponent, SharedHeaderComponent, TranslatePipe]
})
export class HomePage implements OnInit {
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  // Controle de inicialização
  private initialized = false;

  pokemons: Pokemon[] = [];
  favorites: FavoritePokemon[] = [];
  totalPokemon = 0;
  currentLanguage = 'pt';

  // Paginação
  currentOffset = 0;
  readonly itemsPerPage = 20;
  hasMore = true;
  isLoading = false;
  isLoadingMore = false;

  // Filtros
  searchTerm = '';
  filteredPokemon: Pokemon[] = [];
  allLoadedPokemon: Pokemon[] = [];
  isSearching = false;
  searchTimeout: any;  quickFilters: QuickFilter[] = [];

  constructor(
    private pokemonApi: PokemonApiService,
    private favoritesService: FavoritesService,
    private localizationService: LocalizationService,
    private pokemonTranslationService: PokemonTranslationService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.currentLanguage = this.localizationService.getCurrentLanguage();
    this.initializeFilters();
  }
  /**
   * Inicializa a página carregando dados
   */
  private async initializePage(): Promise<void> {
    console.log('🔧 Inicializando página...');

    // Verifica se já foi inicializado para evitar múltiplas chamadas
    if (this.initialized) {
      console.log('✅ Página já inicializada, pulando');
      return;
    }

    // Verifica se já está carregando para evitar múltiplas chamadas
    if (this.isLoading) {
      console.log('⚠️ Já está carregando, pulando inicialização');
      return;
    }

    this.initialized = true;
    await this.loadInitialData();
    this.subscribeToFavorites();
  }/**
   * Carrega dados iniciais
   */  private async loadInitialData(): Promise<void> {
    console.log('🔄 Iniciando carregamento de dados...');
    this.isLoading = true;

    try {
      this.pokemonApi.getPokemonList(this.currentOffset, this.itemsPerPage).subscribe({
        next: async (response) => {
          console.log('📡 Resposta da API recebida:', response);

          if (response && response.results) {
            console.log(`📦 Carregando detalhes de ${response.results.length} Pokémons...`);

            // Carrega detalhes dos Pokémons
            const pokemonDetails = await Promise.all(
              response.results.map((pokemon: any) =>
                this.pokemonApi.getPokemonDetailsByUrl(pokemon.url).toPromise()
              )
            );

            const validPokemons = pokemonDetails.filter((p: Pokemon | undefined): p is Pokemon => p !== undefined);
            console.log(`✅ ${validPokemons.length} Pokémons carregados com sucesso`);

            this.pokemons = validPokemons;
            this.allLoadedPokemon = [...validPokemons];
            this.filteredPokemon = [...validPokemons];
            this.totalPokemon = response.count || 0;
            this.currentOffset += this.itemsPerPage;
            this.hasMore = response.next !== null;

            console.log(`📊 Estado atual: ${this.pokemons.length} pokémons, offset: ${this.currentOffset}, hasMore: ${this.hasMore}`);
          }
          this.isLoading = false;
        },
        error: async (error) => {
          console.error('❌ Erro ao carregar Pokémons:', error);
          await this.showToast(this.localizationService.translate('error.loadingData'), 'danger');
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('❌ Erro crítico ao carregar Pokémons:', error);
      this.isLoading = false;
    }
  }

  /**
   * Carrega mais Pokémons (infinite scroll)
   */
  async loadMore(event: any): Promise<void> {
    if (this.isLoadingMore || !this.hasMore || this.isSearching) {
      event.target.complete();
      return;
    }

    this.isLoadingMore = true;
      this.pokemonApi.getPokemonList(this.currentOffset, this.itemsPerPage).subscribe({
      next: async (response) => {        if (response && response.results) {
          const pokemonDetails = await Promise.all(
            response.results.map((pokemon: any) =>
              this.pokemonApi.getPokemonDetailsByUrl(pokemon.url).toPromise()
            )
          );

          const validNewPokemons = pokemonDetails.filter((p: Pokemon | undefined): p is Pokemon => p !== undefined);
          this.pokemons = [...this.pokemons, ...validNewPokemons];
          this.allLoadedPokemon = [...this.allLoadedPokemon, ...validNewPokemons];

          // Se não está pesquisando, atualiza filteredPokemon
          if (!this.isSearching) {
            this.filteredPokemon = [...this.allLoadedPokemon];
          }

          this.currentOffset += this.itemsPerPage;
          this.hasMore = response.next !== null;
        }
        this.isLoadingMore = false;
        event.target.complete();
      },
      error: async (error) => {
        console.error('Erro ao carregar mais Pokémons:', error);
        await this.showToast(this.localizationService.translate('error.loadingMore'), 'warning');
        this.isLoadingMore = false;
        event.target.complete();
      }
    });
  }

  /**
   * Atualiza lista (pull to refresh)
   */
  async refreshData(event: any): Promise<void> {
    this.currentOffset = 0;
    this.hasMore = true;
    this.pokemons = [];
    this.allLoadedPokemon = [];
    this.filteredPokemon = [];
    this.clearSearch();

    await this.loadInitialData();
    event.target.complete();
  }

  /**
   * Inscreve-se nas mudanças de favoritos
   */
  private subscribeToFavorites(): void {
    this.favoritesService.getFavorites().subscribe(favorites => {
      this.favorites = favorites;
    });
  }

  /**
   * Navega para página de detalhes
   */
  goToDetails(pokemon: Pokemon): void {
    this.router.navigate(['/pokemon', pokemon.id]);
  }

  /**
   * Alterna favorito
   */
  async toggleFavorite(pokemon: Pokemon): Promise<void> {
    const imageUrl = this.pokemonApi.getPokemonImageUrl(pokemon.id);

    try {
      const success = await this.favoritesService.toggleFavorite({
        id: pokemon.id,
        name: pokemon.name,
        imageUrl
      });

      if (success) {        const isFavorite = this.favoritesService.isFavorite(pokemon.id);
        const pokemonName = this.pokemonApi.formatPokemonName(pokemon.name);
        const message = isFavorite
          ? `${pokemonName} ${this.localizationService.translate('favorites.added')}`
          : `${pokemonName} ${this.localizationService.translate('favorites.removed')}`;

        await this.showSuccessToast(message);
      }
    } catch (error) {
      await this.showErrorToast(this.localizationService.translate('error.changeFavorite'));
    }
  }

  /**
   * Verifica se Pokémon é favorito
   */
  isFavorite(pokemonId: number): boolean {
    return this.favoritesService.isFavorite(pokemonId);
  }

  /**
   * Sistema de busca inteligente com filtro em tempo real
   */
  onSearchChange(event: any): void {
    const searchTerm = event.detail.value.toLowerCase().trim();
    this.searchTerm = searchTerm;

    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce search
    this.searchTimeout = setTimeout(() => {
      this.performSearch(searchTerm);
    }, 200);
  }

  /**
   * Executa busca inteligente
   */
  private performSearch(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredPokemon = [...this.allLoadedPokemon];
      this.isSearching = false;
      return;
    }

    this.isSearching = true;

    // Busca inteligente: nome, ID ou parte do nome
    this.filteredPokemon = this.allLoadedPokemon.filter(pokemon => {
      const name = this.getLocalizedPokemonName(pokemon).toLowerCase();
      const id = pokemon.id.toString();

      return (
        name.includes(searchTerm) ||
        id.includes(searchTerm) ||
        pokemon.name.toLowerCase().includes(searchTerm) ||
        name.startsWith(searchTerm) ||
        this.normalizeString(name).includes(this.normalizeString(searchTerm))
      );
    });
  }

  /**
   * Normaliza string removendo acentos para busca
   */
  private normalizeString(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Limpa busca
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.filteredPokemon = [...this.allLoadedPokemon];
    this.isSearching = false;

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }  /**
   * Recarrega lista completa
   */
  async refreshList(): Promise<void> {
    this.currentOffset = 0;
    this.pokemons = [];
    this.allLoadedPokemon = [];
    this.filteredPokemon = [];
    this.hasMore = true;
    await this.loadInitialData();
  }

  /**
   * Exibe toast de sucesso
   */
  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
  }
  /**
   * Exibe toast de erro
   */
  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'bottom'
    });
    await toast.present();
  }
  /**
   * Exibe toast genérico
   */
  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: color === 'danger' ? 3000 : 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
  /**
   * Obtém quantidade de favoritos
   */
  getFavoritesCount(): number {
    return this.favoritesService.getFavoritesCount();
  }

  /**
   * TrackBy function para otimizar renderização da lista
   */
  trackByPokemonId(index: number, pokemon: Pokemon): number {
    return pokemon.id;
  }

  /**
   * Alterna idioma da aplicação
   */
  toggleLanguage(): void {
    const languages = ['pt', 'en', 'es'];
    const currentIndex = languages.indexOf(this.currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    this.currentLanguage = languages[nextIndex];
    this.localizationService.setLanguage(this.currentLanguage);
  }
  /**
   * Alterna estado de um filtro rápido
   */
  toggleFilter(filter: QuickFilter): void {
    console.log('🔍 Toggle filter:', filter.id, 'Active:', !filter.active);
    filter.active = !filter.active;

    try {
      this.applyFilters();
    } catch (error) {
      console.error('❌ Erro ao aplicar filtro:', error);
      this.showToast(this.localizationService.translate('error.applyFilter'), 'danger');
    }
  }
  /**
   * Aplica os filtros ativos
   */
  private applyFilters(): void {
    console.log('🔧 Aplicando filtros...');

    try {
      // Aplica filtros rápidos se houver algum ativo
      const activeFilters = this.quickFilters.filter(f => f.active);
      console.log('📊 Filtros ativos:', activeFilters.map(f => f.id));

      if (activeFilters.length === 0) {
        // Se não há filtros ativos, usa a lista completa ou busca atual
        this.filteredPokemon = this.searchTerm ?
          this.performSearchWithTerm(this.searchTerm) :
          [...this.allLoadedPokemon];
        console.log('✅ Sem filtros - Pokémons exibidos:', this.filteredPokemon.length);
      } else {
        // Aplica filtros ativos
        let baseList = this.searchTerm ?
          this.performSearchWithTerm(this.searchTerm) :
          [...this.allLoadedPokemon];

        console.log('📋 Lista base para filtros:', baseList.length);

        // Filtra com cada filtro ativo
        baseList = baseList.filter(pokemon => {
          try {
            return activeFilters.every(filter => {
              const result = filter.filterFn(pokemon);
              return result;
            });
          } catch (error) {
            console.error(`❌ Erro ao filtrar pokémon ${pokemon.name}:`, error);
            return false;
          }
        });

        this.filteredPokemon = baseList;
        console.log('✅ Filtros aplicados - Pokémons resultantes:', this.filteredPokemon.length);
      }
    } catch (error) {
      console.error('❌ Erro geral ao aplicar filtros:', error);
      // Em caso de erro, volta para lista completa
      this.filteredPokemon = [...this.allLoadedPokemon];
      throw error; // Re-propaga o erro para ser tratado no toggleFilter
    }
  }

  /**
   * Executa busca e retorna resultados sem modificar estado
   */
  private performSearchWithTerm(searchTerm: string): Pokemon[] {
    if (!searchTerm) {
      return [...this.allLoadedPokemon];
    }

    return this.allLoadedPokemon.filter(pokemon => {
      const name = this.getLocalizedPokemonName(pokemon).toLowerCase();
      const id = pokemon.id.toString();

      return (
        name.includes(searchTerm.toLowerCase()) ||
        id.includes(searchTerm) ||
        pokemon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        name.startsWith(searchTerm.toLowerCase()) ||
        this.normalizeString(name).includes(this.normalizeString(searchTerm))
      );
    });
  }

  /**
   * Rola para o topo da página
   */
  scrollToTop(): void {
    this.content.scrollToTop(500);
  }

  /**
   * Navega para a página de favoritos
   */
  goToFavorites(): void {
    this.router.navigate(['/tabs/tab2']);
  }

  /**
   * Retorna nome localizado do Pokémon baseado no idioma atual
   */  getLocalizedPokemonName(pokemon: Pokemon): string {
    return this.pokemonTranslationService.getTranslatedName(pokemon.name, this.currentLanguage);
  }

  /**
   * Capitaliza primeira letra
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Verifica se um Pokémon é lendário baseado no ID
   */
  private isLegendaryPokemon(pokemonId: number): boolean {
    // Lista de Pokémons lendários conhecidos (gerações 1-2 principais)
    const legendaryIds = [
      144, 145, 146, // Articuno, Zapdos, Moltres
      150, 151,     // Mewtwo, Mew
      243, 244, 245, // Raikou, Entei, Suicune
      249, 250,     // Lugia, Ho-Oh
      251,          // Celebi
      377, 378, 379, 380, 381, 382, 383, 384, 385, // Regirock, Regice, Registeel, Latias, Latios, Kyogre, Groudon, Rayquaza, Jirachi
      480, 481, 482, 483, 484, 485, 486, 487, 488, // Uxie, Mesprit, Azelf, Dialga, Palkia, Heatran, Regigigas, Giratina, Cresselia
      491, 492, 493, // Darkrai, Shaymin, Arceus
      638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649 // Cobalion, Terrakion, Virizion, Tornadus, Thundurus, Reshiram, Zekrom, Landorus, Kyurem, Keldeo, Meloetta, Genesect
    ];

    return legendaryIds.includes(pokemonId);
  }

  /**
   * Verifica se um Pokémon tem um tipo específico
   */
  private hasType(pokemon: Pokemon, typeName: string): boolean {
    if (!pokemon.types || pokemon.types.length === 0) {
      return false;
    }

    return pokemon.types.some(typeInfo =>
      typeInfo.type.name.toLowerCase() === typeName.toLowerCase()
    );
  }

  /**
   * Verifica se há filtros ativos
   */
  hasActiveFilters(): boolean {
    return this.quickFilters.some(filter => filter.active);
  }

  /**
   * Limpa todos os filtros ativos
   */
  clearAllFilters(): void {
    console.log('🧹 Limpando todos os filtros');
    this.quickFilters.forEach(filter => filter.active = false);
    this.applyFilters();  }

  /**
   * Obtém nome traduzido de um Pokémon
   */
  getTranslatedPokemonName(pokemon: Pokemon): string {
    return this.pokemonTranslationService.getTranslatedName(pokemon.name, this.currentLanguage);
  }

  /**
   * Inicializa os filtros dinâmicos
   */
  private initializeFilters(): void {
    // Filtros especiais
    this.quickFilters = [
      {
        id: 'favorites',
        label: 'filters.favorites',
        icon: 'heart',
        active: false,
        filterFn: (pokemon: Pokemon) => this.favoritesService.isFavorite(pokemon.id),
        color: '#e74c3c',
        backgroundColor: '#ffebee',
        textColor: '#c62828'
      },
      {
        id: 'legendary',
        label: 'filters.legendary',
        icon: 'star',
        active: false,
        filterFn: (pokemon: Pokemon) => this.isLegendaryPokemon(pokemon.id),
        color: '#f39c12',
        backgroundColor: '#fff8e1',
        textColor: '#f57f17'
      },
      {
        id: 'generation1',
        label: 'filters.gen1',
        icon: 'flame',
        active: false,
        filterFn: (pokemon: Pokemon) => pokemon.id <= 151,
        color: '#9b59b6',
        backgroundColor: '#f3e5f5',
        textColor: '#7b1fa2'
      }
    ];

    // Adiciona filtros por tipo de Pokémon
    POKEMON_TYPES.slice(0, 6).forEach(type => { // Limita a 6 tipos principais
      const typeColor = getTypeColor(type);
      const lightColor = getTypeColor(type, true);
      const textColor = getContrastColor(typeColor);

      this.quickFilters.push({
        id: type,
        label: `filters.${type}`,
        icon: this.getTypeIcon(type),
        active: false,
        filterFn: (pokemon: Pokemon) => this.hasType(pokemon, type),
        color: typeColor,
        backgroundColor: lightColor,
        textColor: textColor === '#FFFFFF' ? typeColor : textColor
      });
    });
  }

  /**
   * Retorna ícone apropriado para cada tipo
   */
  private getTypeIcon(type: string): string {
    const typeIcons: { [key: string]: string } = {
      'fire': 'flame-outline',
      'water': 'water-outline',
      'grass': 'leaf-outline',
      'electric': 'flash-outline',
      'psychic': 'eye-outline',
      'ice': 'snow-outline',
      'dragon': 'logo-dragon',
      'dark': 'moon-outline',
      'fighting': 'fitness-outline',
      'poison': 'flask-outline',
      'ground': 'earth-outline',
      'flying': 'airplane-outline',
      'bug': 'bug-outline',
      'rock': 'diamond-outline',
      'ghost': 'skull-outline',
      'steel': 'hardware-chip-outline',
      'fairy': 'heart-outline',
      'normal': 'ellipse-outline'
    };

    return typeIcons[type] || 'help-outline';
  }

  ngOnInit(): void {
    console.log('🚀 HomePage ngOnInit chamado');
    this.initializePage();
  }
}
