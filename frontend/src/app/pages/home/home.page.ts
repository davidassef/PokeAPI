import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoadingController, AlertController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { Pokemon, PokemonListResponse } from '../../models/pokemon.model';
import { PokemonFilters } from '../../models/app.model';
import { PokeApiService } from '../../core/services/pokeapi.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { AudioService } from '../../core/services/audio.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  pokemon: Pokemon[] = [];
  filteredPokemon: Pokemon[] = [];
  loading = false;
  filters: PokemonFilters = {
    name: '',
    type: '',
    generation: undefined,
    sortBy: 'id',
    sortOrder: 'asc'
  };

  currentPage = 1;
  totalPages = 1;
  pokemonPerPage = 20;

  generations = [
    { id: 1, name: 'Generation I (Kanto)', range: '1-151' },
    { id: 2, name: 'Generation II (Johto)', range: '152-251' },
    { id: 3, name: 'Generation III (Hoenn)', range: '252-386' },
    { id: 4, name: 'Generation IV (Sinnoh)', range: '387-493' },
    { id: 5, name: 'Generation V (Unova)', range: '494-649' },
    { id: 6, name: 'Generation VI (Kalos)', range: '650-721' },
    { id: 7, name: 'Generation VII (Alola)', range: '722-809' },
    { id: 8, name: 'Generation VIII (Galar)', range: '810-905' }
  ];

  pokemonTypes = [
    'normal', 'fighting', 'flying', 'poison', 'ground', 'rock',
    'bug', 'ghost', 'steel', 'fire', 'water', 'grass',
    'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private pokeApiService: PokeApiService,
    private favoritesService: FavoritesService,
    private audioService: AudioService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadPokemon();
    this.playBackgroundMusic();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  async loadPokemon(refresh = false) {
    if (refresh) {
      this.currentPage = 1;
      this.pokemon = [];
    }

    this.loading = true;
    const loading = await this.loadingController.create({
      message: await this.translate.get('LOADING_POKEMON').toPromise()
    });
    await loading.present();

    try {
      const offset = (this.currentPage - 1) * this.pokemonPerPage;

      this.pokeApiService.getPokemonList(this.pokemonPerPage, offset)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (response) => {            // Carregar detalhes de cada Pokémon
            const pokemonDetails = await Promise.all(
              response.results.map(item =>
                this.pokeApiService.getPokemon(item.name).toPromise()
              )
            );

            const validPokemon = pokemonDetails.filter(p => p !== undefined) as Pokemon[];

            if (refresh) {
              this.pokemon = validPokemon;
            } else {
              this.pokemon = [...this.pokemon, ...validPokemon];
            }

            this.totalPages = Math.ceil(response.count / this.pokemonPerPage);
            this.applyFilters();
            this.loading = false;
            await loading.dismiss();
          },
          error: async (error) => {
            console.error('Erro ao carregar Pokémon:', error);
            await this.showErrorToast('ERROR_LOADING_POKEMON');
            this.loading = false;
            await loading.dismiss();
          }
        });

    } catch (error) {
      console.error('Erro ao carregar Pokémon:', error);
      await this.showErrorToast('ERROR_LOADING_POKEMON');
      this.loading = false;
      await loading.dismiss();
    }
  }

  async loadMore(event: any) {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      await this.loadPokemon();
    }
    event.target.complete();
  }
  async onSearch(event: any) {
    const searchTerm = event.target.value.toLowerCase().trim();
    this.filters.name = searchTerm;

    if (searchTerm.length > 0) {
      try {
        this.pokeApiService.searchPokemon(searchTerm)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (pokemon) => {
              this.filteredPokemon = pokemon.length > 0 ? pokemon : [];
            },
            error: () => {
              this.applyFilters();
            }
          });
      } catch (error) {
        this.applyFilters();
      }
    } else {
      this.applyFilters();
    }
  }

  onFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.pokemon];

    // Filtro por nome
    if (this.filters.name) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(this.filters.name!.toLowerCase())
      );
    }

    // Filtro por tipo
    if (this.filters.type) {
      filtered = filtered.filter(p =>
        p.types.some(t => t.type.name === this.filters.type)
      );
    }

    // Filtro por geração
    if (this.filters.generation) {
      const genRanges = {
        1: { min: 1, max: 151 },
        2: { min: 152, max: 251 },
        3: { min: 252, max: 386 },
        4: { min: 387, max: 493 },
        5: { min: 494, max: 649 },
        6: { min: 650, max: 721 },
        7: { min: 722, max: 809 },
        8: { min: 810, max: 905 }
      };

      const range = genRanges[this.filters.generation as keyof typeof genRanges];
      if (range) {
        filtered = filtered.filter(p => p.id >= range.min && p.id <= range.max);
      }
    }

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;

      if (this.filters.sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison = a.id - b.id;
      }

      return this.filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    this.filteredPokemon = filtered;
  }

  async toggleFavorite(pokemon: Pokemon, event: Event) {
    event.stopPropagation();

    try {
      await this.favoritesService.toggleFavorite(pokemon);
      await this.audioService.playSound('/assets/audio/click.wav');

      const isFavorite = await this.favoritesService.isFavorite(pokemon.id);
      const message = isFavorite ? 'ADDED_TO_FAVORITES' : 'REMOVED_FROM_FAVORITES';
      await this.showToast(message, pokemon.name);

    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      await this.showErrorToast('ERROR_TOGGLE_FAVORITE');
    }
  }

  async isFavorite(pokemonId: number): Promise<boolean> {
    return await this.favoritesService.isFavorite(pokemonId);
  }

  async onRefresh(event: any) {
    await this.loadPokemon(true);
    event.target.complete();
  }

  async clearFilters() {
    this.filters = {
      name: '',
      type: '',
      generation: undefined,
      sortBy: 'id',
      sortOrder: 'asc'
    };
    this.applyFilters();
  }

  async showFilterModal() {
    const alert = await this.alertController.create({
      header: await this.translate.get('FILTERS').toPromise(),
      inputs: [
        {
          name: 'type',
          type: 'text',
          placeholder: await this.translate.get('FILTER_BY_TYPE').toPromise(),
          value: this.filters.type
        },
        {
          name: 'generation',
          type: 'number',
          placeholder: await this.translate.get('FILTER_BY_GENERATION').toPromise(),
          value: this.filters.generation
        }
      ],
      buttons: [
        {
          text: await this.translate.get('CANCEL').toPromise(),
          role: 'cancel'
        },
        {
          text: await this.translate.get('APPLY').toPromise(),
          handler: (data) => {
            this.filters.type = data.type;
            this.filters.generation = data.generation ? parseInt(data.generation) : undefined;
            this.applyFilters();
          }
        }
      ]
    });

    await alert.present();
  }

  private async playBackgroundMusic() {
    try {
      await this.audioService.loadTrack('pallet-town');
      await this.audioService.play();
    } catch (error) {
      console.log('Música não disponível:', error);
    }
  }

  private async showToast(messageKey: string, pokemonName?: string) {
    const message = await this.translate.get(messageKey, { name: pokemonName }).toPromise();
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  private async showErrorToast(messageKey: string) {
    const message = await this.translate.get(messageKey).toPromise();
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
