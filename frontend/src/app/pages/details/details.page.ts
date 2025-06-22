import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { Pokemon, PokemonSpecies } from '../../models/pokemon.model';
import { PokeApiService } from '../../core/services/pokeapi.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { AudioService } from '../../core/services/audio.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.page.html',
  styleUrls: ['./details.page.scss'],
})
export class DetailsPage implements OnInit, OnDestroy {
  pokemon: Pokemon | null = null;
  species: PokemonSpecies | null = null;
  loading = false;
  isFavorite = false;
  selectedTab = 'info';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private pokeApiService: PokeApiService,
    private favoritesService: FavoritesService,
    private audioService: AudioService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPokemon(id);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadPokemon(id: string) {
    this.loading = true;
    const loading = await this.loadingController.create({
      message: await this.translate.get('LOADING_POKEMON_DETAILS').toPromise()
    });
    await loading.present();

    try {
      // Carregar dados do Pokémon
      this.pokeApiService.getPokemon(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (pokemon) => {
            this.pokemon = pokemon;
            await this.loadSpecies(pokemon.species.url);
            await this.checkIfFavorite(pokemon.id);
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

  private async loadSpecies(speciesUrl: string) {
    try {
      const speciesId = speciesUrl.split('/').slice(-2, -1)[0];
      this.pokeApiService.getPokemonSpecies(parseInt(speciesId))
        .pipe(takeUntil(this.destroy$))
        .subscribe(species => {
          this.species = species;
        });
    } catch (error) {
      console.error('Erro ao carregar espécie:', error);
    }
  }

  private async checkIfFavorite(pokemonId: number) {
    this.isFavorite = await this.favoritesService.isFavorite(pokemonId);
  }

  async toggleFavorite() {
    if (!this.pokemon) return;

    try {
      await this.favoritesService.toggleFavorite(this.pokemon);
      this.isFavorite = !this.isFavorite;
      await this.audioService.playSound('/assets/audio/click.wav');

      const message = this.isFavorite ? 'ADDED_TO_FAVORITES' : 'REMOVED_FROM_FAVORITES';
      await this.showToast(message, this.pokemon.name);

    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      await this.showErrorToast('ERROR_TOGGLE_FAVORITE');
    }
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  getTypeColor(typeName: string): string {
    const colors: { [key: string]: string } = {
      normal: '#A8A878',
      fighting: '#C03028',
      flying: '#A890F0',
      poison: '#A040A0',
      ground: '#E0C068',
      rock: '#B8A038',
      bug: '#A8B820',
      ghost: '#705898',
      steel: '#B8B8D0',
      fire: '#F08030',
      water: '#6890F0',
      grass: '#78C850',
      electric: '#F8D030',
      psychic: '#F85888',
      ice: '#98D8D8',
      dragon: '#7038F8',
      dark: '#705848',
      fairy: '#EE99AC'
    };
    return colors[typeName] || '#68A090';
  }

  getStatPercentage(value: number): number {
    return Math.min((value / 255) * 100, 100);
  }

  getStatBarColor(value: number): string {
    if (value >= 120) return 'success';
    if (value >= 80) return 'warning';
    if (value >= 50) return 'primary';
    return 'danger';
  }

  getTotalStats(): number {
    if (!this.pokemon) return 0;
    return this.pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);
  }

  getHeightInMeters(): string {
    if (!this.pokemon) return '0.0';
    return (this.pokemon.height / 10).toFixed(1);
  }

  getWeightInKg(): string {
    if (!this.pokemon) return '0.0';
    return (this.pokemon.weight / 10).toFixed(1);
  }

  getAbilityDescription(abilityName: string): string {
    // Mock descriptions (em um app real, viria da API)
    const descriptions: { [key: string]: string } = {
      'overgrow': 'Powers up Grass-type moves when HP is low.',
      'chlorophyll': 'Boosts Speed in sunshine.',
      'solar-power': 'Boosts Sp. Atk in sunshine, but loses HP.',
      'blaze': 'Powers up Fire-type moves when HP is low.',
      'torrent': 'Powers up Water-type moves when HP is low.',
      'static': 'May paralyze on contact.',
      'lightning-rod': 'Draws Electric-type moves to itself.'
    };
    return descriptions[abilityName] || 'Ability description not available.';
  }

  getFlavorText(): string {
    if (!this.species || !this.species.flavor_text_entries) {
      return 'No description available.';
    }

    // Buscar texto em inglês como fallback
    const englishEntry = this.species.flavor_text_entries.find(
      entry => entry.language.name === 'en'
    );

    return englishEntry ? englishEntry.flavor_text.replace(/\f/g, ' ') : 'No description available.';
  }

  getEvolutionChain(): any[] {
    // Mock evolution chain (em um app real, viria da API)
    if (!this.pokemon) return [];

    const evolutionChains: { [key: number]: any[] } = {
      1: [
        { id: 1, name: 'Bulbasaur', level: 1 },
        { id: 2, name: 'Ivysaur', level: 16 },
        { id: 3, name: 'Venusaur', level: 32 }
      ],
      4: [
        { id: 4, name: 'Charmander', level: 1 },
        { id: 5, name: 'Charmeleon', level: 16 },
        { id: 6, name: 'Charizard', level: 36 }
      ],
      7: [
        { id: 7, name: 'Squirtle', level: 1 },
        { id: 8, name: 'Wartortle', level: 16 },
        { id: 9, name: 'Blastoise', level: 36 }
      ],
      25: [
        { id: 172, name: 'Pichu', level: 1 },
        { id: 25, name: 'Pikachu', level: 'friendship' },
        { id: 26, name: 'Raichu', level: 'thunder stone' }
      ]
    };

    return evolutionChains[this.pokemon.id] || [{ id: this.pokemon.id, name: this.pokemon.name, level: 1 }];
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
