import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { forkJoin } from 'rxjs';

import { PokemonApiService } from '../../services/pokemon-api.service';
import { PokemonFavoritesService } from '../../services/pokemon-favorites.service';
import { PokemonTranslationService } from '../../services/pokemon-translation.service';
import { LocalizationService } from '../../services/localization.service';
import { FeedbackToastService } from '../../components/feedback-toast.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SharedHeaderComponent } from '../../components/shared-header.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb.component';
import { PokemonLoadingComponent } from '../../components/pokemon-loading.component';
import { Pokemon, PokemonSpecies, FlavorTextEntry } from '../../models/pokemon.model';
import { AppPages } from '../../enums/app.enums';

@Component({
  selector: 'app-details',
  templateUrl: './details.page.html',
  styleUrls: ['./details.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslatePipe,
    SharedHeaderComponent,
    BreadcrumbComponent,
    PokemonLoadingComponent,
  ],
})
export class DetailsPage implements OnInit {
  // 📱 Enums para templates
  readonly appPages = AppPages;

  pokemon: Pokemon | null = null;
  breadcrumbItems: BreadcrumbItem[] = [];
  species: PokemonSpecies | null = null;
  pokemonId: number = 0;
  isLoading = true;
  isFavorite = false;
  currentLanguage = 'pt';
  translatedName = '';
  translatedDescription = '';

  // Dados processados para exibição
  descriptions: string[] = [];
  imageUrls: string[] = [];
  stats: { name: string; value: number; max: number }[] = [];  /**
   * Injeta o serviço de favoritos dedicado
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pokemonApi: PokemonApiService,
    private pokemonFavoritesService: PokemonFavoritesService,
    private pokemonTranslationService: PokemonTranslationService,
    private localizationService: LocalizationService,
    private loadingController: LoadingController,
    private feedbackToast: FeedbackToastService,
  ) {
    this.currentLanguage = this.localizationService.getCurrentLanguage();
  }

  ngOnInit(): void {
    this.initializePage();
  }

  /**
   * Inicializa a página
   */
  private initializePage(): void {
    this.route.params.subscribe(params => {
      this.pokemonId = +params['id'];
      if (this.pokemonId) {
        this.loadPokemonDetails();
      } else {
        this.goBack();
      }
    });
  }

  /**
   * Carrega detalhes completos do Pokémon
   */
  private async loadPokemonDetails(): Promise<void> {
    const loading = await this.loadingController.create({
      message: this.localizationService.translate('loading.details'),
      duration: 0,
    });

    await loading.present();
    this.isLoading = true;

    try {
      // Carrega dados do Pokémon e espécie em paralelo
      const [pokemon, species] = await forkJoin([
        this.pokemonApi.getPokemonDetails(this.pokemonId),
        this.pokemonApi.getPokemonSpecies(this.pokemonId),
      ]).toPromise() ?? [null, null];      if (pokemon && species) {
        this.pokemon = pokemon;
        this.species = species;
        this.processDataForDisplay();
        this.checkFavoriteStatus();
        this.setupBreadcrumbs(); // Configura breadcrumbs após carregar dados
      } else {
        throw new Error('Dados não encontrados');
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      await this.showErrorToast(this.localizationService.translate('error.loadingDetails'));
      this.goBack();
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  /**
   * Processa dados para exibição
   */
  private processDataForDisplay(): void {
    if (!this.pokemon || !this.species) return;

    // Processa descrições (mínimo 6)
    this.processDescriptions();

    // Processa URLs de imagens (mínimo 6)
    this.processImageUrls();

    // Processa stats para gráficos
    this.processStats();

    // Atualiza traduções do Pokémon
    this.updateTranslations();
  }

  /**
   * Processa descrições do Pokémon
   */
  private processDescriptions(): void {
    if (!this.species?.flavor_text_entries) return;

    const descriptions = new Set<string>();

    // Prioriza descrições em português, depois inglês
    const priorityLanguages = ['pt', 'en'];

    for (const lang of priorityLanguages) {
      const langEntries = this.species.flavor_text_entries
        .filter(entry => entry.language.name === lang)
        .map(entry => entry.flavor_text.replace(/\f/g, ' ').trim())
        .filter(text => text.length > 0);

      langEntries.forEach(desc => descriptions.add(desc));

      if (descriptions.size >= 6) break;
    }

    // Se ainda não tiver 6, adiciona de outras línguas
    if (descriptions.size < 6) {
      this.species.flavor_text_entries
        .map(entry => entry.flavor_text.replace(/\f/g, ' ').trim())
        .filter(text => text.length > 0)
        .forEach(desc => descriptions.add(desc));
    }

    this.descriptions = Array.from(descriptions).slice(0, 8);
  }

  /**
   * Processa URLs de imagens
   */
  private processImageUrls(): void {
    if (!this.pokemon?.sprites) return;

    const images: string[] = [];
    const sprites = this.pokemon.sprites;

    // Imagens oficiais
    if (sprites.other?.['official-artwork']?.front_default) {
      images.push(sprites.other['official-artwork'].front_default);
    }
    if (sprites.other?.['official-artwork']?.front_shiny) {
      images.push(sprites.other['official-artwork'].front_shiny);
    }

    // Imagens do Dream World
    if (sprites.other?.dream_world?.front_default) {
      images.push(sprites.other.dream_world.front_default);
    }

    // Imagens Home
    if (sprites.other?.home?.front_default) {
      images.push(sprites.other.home.front_default);
    }
    if (sprites.other?.home?.front_shiny) {
      images.push(sprites.other.home.front_shiny);
    }

    // Sprites tradicionais
    if (sprites.front_default) images.push(sprites.front_default);
    if (sprites.back_default) images.push(sprites.back_default);
    if (sprites.front_shiny) images.push(sprites.front_shiny);
    if (sprites.back_shiny) images.push(sprites.back_shiny);

    this.imageUrls = images.filter(url => url !== null).slice(0, 8);
  }

  /**
   * Processa stats para gráficos
   */
  private processStats(): void {
    if (!this.pokemon?.stats) return;

    this.stats = this.pokemon.stats.map(stat => ({
      name: this.formatStatName(stat.stat.name),
      value: stat.base_stat,
      max: 255, // Valor máximo teórico para stats
    }));
  }

  /**
   * Formata nome do stat
   */
  private formatStatName(statName: string): string {
    const statNames: { [key: string]: string } = {
      'hp': 'HP',
      'attack': 'Ataque',
      'defense': 'Defesa',
      'special-attack': 'Atq. Esp.',
      'special-defense': 'Def. Esp.',
      'speed': 'Velocidade',
    };

    return statNames[statName] || statName;
  }

  /**
   * Verifica status de favorito
   */
  private checkFavoriteStatus(): void {
    this.isFavorite = this.pokemonFavoritesService.isFavorite(this.pokemonId);
  }

  /**
   * Alterna favorito para o Pokémon atual
   */
  toggleFavorite(): void {
    if (this.pokemon) {
      this.pokemonFavoritesService.toggleFavorite(this.pokemon.id);
    }
  }

  /**
   * Volta para página anterior
   */
  goBack(): void {
    this.router.navigate(['/tabs/tab1']);
  }

  /**
   * Atualiza traduções do Pokémon
   */
  private updateTranslations(): void {
    if (this.pokemon) {
      this.translatedName = this.pokemonTranslationService.getTranslatedName(
        this.pokemon.name,
        this.currentLanguage,
      );
      this.translatedDescription = this.pokemonTranslationService.getTranslatedDescription(
        this.pokemon.name,
        this.currentLanguage,
      );
    }
  }

  /**
   * Retorna o nome formatado do Pokémon
   */
  getFormattedName(): string {
    return this.translatedName || this.capitalizeFirstLetter(this.pokemon?.name || '');
  }

  /**
   * Retorna a descrição formatada do Pokémon
   */
  getFormattedDescription(): string {
    return this.translatedDescription || this.descriptions[0] || this.localizationService.translate('details.noDescription');
  }

  /**
   * Retorna tipos formatados
   */
  getFormattedTypes(): string {
    if (!this.pokemon?.types) return '';

    return this.pokemon.types
      .map(typeInfo => this.capitalizeFirstLetter(typeInfo.type.name))
      .join(' • ');
  }

  /**
   * Retorna cor do tipo principal
   */
  getPrimaryTypeColor(): string {
    if (!this.pokemon?.types || this.pokemon.types.length === 0) {
      return '#68A090';
    }

    const primaryType = this.pokemon.types[0].type.name;
    return this.getTypeColor(primaryType);
  }

  /**
   * Retorna cor específica para cada tipo
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
      fairy: '#EE99AC',
    };

    return typeColors[type] || '#68A090';
  }

  /**
   * Capitaliza primeira letra
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Calcula porcentagem do stat
   */
  getStatPercentage(value: number, max: number): number {
    return Math.round((value / max) * 100);
  }

  /**
   * Retorna URL da imagem principal do Pokémon
   */
  getPokemonMainImageUrl(): string {
    return this.pokemon ? this.pokemonApi.getPokemonImageUrl(this.pokemon.id) : '';
  }
  /**
   * Exibe toast de sucesso
   */
  private async showSuccessToast(message: string): Promise<void> {
    await this.feedbackToast.showSuccess(message);
  }

  /**
   * Exibe toast de erro
   */
  private async showErrorToast(message: string): Promise<void> {
    await this.feedbackToast.showError(message);
  }

  /**
   * Configura breadcrumbs
   */
  private setupBreadcrumbs(): void {
    this.breadcrumbItems = [
      {
        label: 'nav.pokedex',
        route: '/tabs/tab1',
        icon: 'apps',
      },
      {
        label: this.getFormattedName(),
        icon: 'information-circle',
        isActive: true,
      },
    ];
  }
}
