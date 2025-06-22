import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { Pokemon } from '../../models/pokemon.model';
import { PokeApiService } from '../../core/services/pokeapi.service';
import { FavoritesService } from '../../core/services/favorites.service';

interface ImageVariant {
  url: string;
  label: string;
}

@Component({
  selector: 'app-details',
  templateUrl: './details.page.html',
  styleUrls: ['./details.page.scss'],
})
export class DetailsPage implements OnInit, OnDestroy {
  pokemon: Pokemon | null = null;
  loading = false;
  isFavorite = false;
  selectedImageType = 'default';
  currentImageUrl = '';

  private pokemonId: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pokeApiService: PokeApiService,
    private favoritesService: FavoritesService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.pokemonId = parseInt(params['id'], 10);
      if (this.pokemonId) {
        this.loadPokemonDetails();
        this.checkIfFavorite();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carrega detalhes do Pokémon
   */
  private async loadPokemonDetails() {
    this.loading = true;
    try {
      this.pokemon = await this.pokeApiService.getPokemon(this.pokemonId).toPromise();
      if (this.pokemon) {
        this.currentImageUrl = this.pokemon.sprites?.front_default || '';
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do Pokémon:', error);
      this.showErrorToast();
    } finally {
      this.loading = false;
    }
  }

  /**
   * Verifica se o Pokémon é favorito
   */
  private checkIfFavorite() {
    this.favoritesService.getFavorites()
      .pipe(takeUntil(this.destroy$))
      .subscribe(favorites => {
        this.isFavorite = favorites.some(fav => fav.pokemon_id === this.pokemonId);
      });
  }

  /**
   * Alterna status de favorito
   */
  async toggleFavorite() {
    if (!this.pokemon) return;

    try {
      if (this.isFavorite) {
        await this.favoritesService.removeFromFavorites(this.pokemon.id);
        this.showToast(this.translate.instant('DETAILS.REMOVED_FROM_FAVORITES'));
      } else {
        await this.favoritesService.addToFavorites(this.pokemon);
        this.showToast(this.translate.instant('DETAILS.ADDED_TO_FAVORITES'));
      }
    } catch (error) {
      console.error('Erro ao alterar favorito:', error);
      this.showErrorToast();
    }
  }

  /**
   * Obtém gradiente de fundo baseado nos tipos
   */
  getBackgroundGradient(): string {
    if (!this.pokemon?.types?.length) {
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    const colors = this.pokemon.types.map(type => this.getTypeColor(type.type.name));

    if (colors.length === 1) {
      return `linear-gradient(135deg, ${colors[0]} 0%, ${this.darkenColor(colors[0])} 100%)`;
    }

    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
  }

  /**
   * Obtém cor do tipo
   */
  private getTypeColor(type: string): string {
    const typeColors: { [key: string]: string } = {
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
    return typeColors[type] || '#68A090';
  }

  /**
   * Escurece uma cor
   */
  private darkenColor(color: string): string {
    const factor = 0.7;
    const hex = color.replace('#', '');
    const r = Math.floor(parseInt(hex.substring(0, 2), 16) * factor);
    const g = Math.floor(parseInt(hex.substring(2, 4), 16) * factor);
    const b = Math.floor(parseInt(hex.substring(4, 6), 16) * factor);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * Obtém imagem atual
   */
  getCurrentImage(): string {
    return this.currentImageUrl || 'assets/images/pokeball.png';
  }

  /**
   * Obtém variantes de imagem
   */
  getImageVariants(): ImageVariant[] {
    if (!this.pokemon?.sprites) return [];

    const variants: ImageVariant[] = [];
    const sprites = this.pokemon.sprites;
    const isShiny = this.selectedImageType === 'shiny';

    if (isShiny) {
      if (sprites.front_shiny) {
        variants.push({ url: sprites.front_shiny, label: 'Front Shiny' });
      }
      if (sprites.back_shiny) {
        variants.push({ url: sprites.back_shiny, label: 'Back Shiny' });
      }
    } else {
      if (sprites.front_default) {
        variants.push({ url: sprites.front_default, label: 'Front Default' });
      }
      if (sprites.back_default) {
        variants.push({ url: sprites.back_default, label: 'Back Default' });
      }
    }

    return variants;
  }

  /**
   * Seleciona uma imagem
   */
  selectImage(url: string) {
    this.currentImageUrl = url;
  }

  /**
   * Mudança do tipo de imagem
   */
  onImageTypeChange(event: any) {
    this.selectedImageType = event.detail.value;
    const variants = this.getImageVariants();
    if (variants.length > 0) {
      this.currentImageUrl = variants[0].url;
    }
  }

  /**
   * Obtém nome traduzido do stat
   */
  getStatName(statName: string): string {
    const statNames: { [key: string]: string } = {
      'hp': 'HP',
      'attack': 'Attack',
      'defense': 'Defense',
      'special-attack': 'Sp. Attack',
      'special-defense': 'Sp. Defense',
      'speed': 'Speed'
    };
    return statNames[statName] || statName;
  }

  /**
   * Calcula porcentagem do stat
   */
  getStatPercentage(statValue: number): number {
    return Math.min((statValue / 200) * 100, 100);
  }

  /**
   * Calcula total dos stats
   */
  getTotalStats(): number {
    if (!this.pokemon?.stats) return 0;
    return this.pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);
  }

  /**
   * Obtém movimentos recentes
   */
  getRecentMoves() {
    if (!this.pokemon?.moves) return [];
    return this.pokemon.moves.slice(0, 6);
  }

  /**
   * Manipula erro de imagem
   */
  onImageError(event: any) {
    event.target.src = 'assets/images/pokeball.png';
  }

  /**
   * Recarrega a página
   */
  retry() {
    this.loadPokemonDetails();
  }

  /**
   * Exibe toast de erro
   */
  private async showErrorToast() {
    const toast = await this.toastController.create({
      message: this.translate.instant('DETAILS.ERROR_LOADING'),
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
