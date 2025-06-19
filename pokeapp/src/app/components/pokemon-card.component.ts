import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Pokemon } from '../models/pokemon.model';
import { PokemonTranslationService } from '../services/pokemon-translation.service';
import { LocalizationService } from '../services/localization.service';
import { IntersectionObserverService } from '../services/intersection-observer.service';
import { TranslatePipe } from '../pipes/translate.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pokemon-card',
  templateUrl: './pokemon-card.component.html',
  styleUrls: ['./pokemon-card.component.scss'],  standalone: true,
  imports: [CommonModule, IonicModule, TranslatePipe],
})
export class PokemonCardComponent implements OnInit, OnDestroy {
  @Input() pokemon!: Pokemon;
  @Input() isFavorite: boolean = false;
  @Input() showFavoriteButton: boolean = true;
  @Input() isLoading: boolean = false;
  @Input() localizedName?: string; // Nome localizado passado pela página home

  @Output() cardClick = new EventEmitter<Pokemon>();
  @Output() favoriteToggle = new EventEmitter<Pokemon>();

  @ViewChild('pokemonCard', { static: true }) cardElement!: ElementRef;

  currentLanguage = 'pt';
  translatedName = '';
  isInView = false;
  private subscription = new Subscription();

  // Type icons mapping
  private typeIcons: { [key: string]: string } = {
    normal: '🐾',
    fire: '🔥',
    water: '💧',
    electric: '⚡',
    grass: '🌿',
    ice: '❄️',
    fighting: '👊',
    poison: '☠️',
    ground: '🌍',
    flying: '🦅',
    psychic: '🔮',
    bug: '🐛',
    rock: '🗿',
    ghost: '👻',
    dragon: '🐉',
    dark: '🌙',
    steel: '⚙️',
    fairy: '🧚',
  };

  // Localized type names
  private typeNames: { [key: string]: { [key: string]: string } } = {
    pt: {
      normal: 'Normal', fire: 'Fogo', water: 'Água', electric: 'Elétrico',
      grass: 'Grama', ice: 'Gelo', fighting: 'Lutador', poison: 'Veneno',
      ground: 'Terra', flying: 'Voador', psychic: 'Psíquico', bug: 'Inseto',
      rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão', dark: 'Sombrio',
      steel: 'Metal', fairy: 'Fada',
    },
    en: {
      normal: 'Normal', fire: 'Fire', water: 'Water', electric: 'Electric',
      grass: 'Grass', ice: 'Ice', fighting: 'Fighting', poison: 'Poison',
      ground: 'Ground', flying: 'Flying', psychic: 'Psychic', bug: 'Bug',
      rock: 'Rock', ghost: 'Ghost', dragon: 'Dragon', dark: 'Dark',
      steel: 'Steel', fairy: 'Fairy',
    },
    es: {
      normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico',
      grass: 'Hierba', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
      ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
      rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro',
      steel: 'Acero', fairy: 'Hada',
    },
  };
  constructor(
    private pokemonTranslationService: PokemonTranslationService,
    private localizationService: LocalizationService,
    private intersectionObserverService: IntersectionObserverService,
  ) {
    this.currentLanguage = this.localizationService.getCurrentLanguage();
  }  ngOnInit() {
    // Subscribe to language changes
    this.subscription.add(
      this.localizationService.currentLanguage$.subscribe(language => {
        this.currentLanguage = language;
        this.updateTranslatedName();
      }),
    );

    this.updateTranslatedName();
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver() {
    if (this.cardElement) {
      const observerId = 'pokemon-card-lazy';

      // Criar o observer para lazy loading
      this.subscription.add(
        this.intersectionObserverService.createLazyLoadObserver(0.1, '50px')
          .subscribe(entry => {
            if (entry.element === this.cardElement.nativeElement) {
              this.isInView = entry.isIntersecting;
            }
          }),
      );

      // Observar o elemento
      this.intersectionObserverService.observe(this.cardElement.nativeElement, observerId);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private updateTranslatedName() {
    if (this.pokemon) {
      this.translatedName = this.pokemonTranslationService.getTranslatedName(
        this.pokemon.name,
        this.currentLanguage,
      );
    }
  }

  /**
   * Emite evento quando card é clicado
   */
  onCardClick(): void {
    this.cardClick.emit(this.pokemon);
  }

  /**
   * Emite evento quando botão de favorito é clicado
   */
  onFavoriteClick(event: Event): void {
    event.stopPropagation();
    this.favoriteToggle.emit(this.pokemon);
  }

  /**
   * Retorna URL da imagem do Pokémon
   */
  getPokemonImageUrl(): string {
    if (this.pokemon.sprites?.other?.['official-artwork']?.front_default) {
      return this.pokemon.sprites.other['official-artwork'].front_default;
    }
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${this.pokemon.id}.png`;
  }

  /**
   * Manipula erro de carregamento de imagem
   */
  onImageError(event: any): void {
    const img = event.target;
    img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${this.pokemon.id}.png`;
  }

  /**
   * Retorna nome do tipo primário
   */
  getPrimaryTypeName(): string {
    return this.pokemon.types?.[0]?.type?.name || 'normal';
  }

  /**
   * Retorna ícone do tipo
   */
  getTypeIcon(typeName: string): string {
    return this.typeIcons[typeName] || '❓';
  }

  /**
   * Retorna nome localizado do tipo
   */
  getLocalizedTypeName(typeName: string): string {
    return this.typeNames[this.currentLanguage]?.[typeName] || typeName;
  }

  /**
   * Retorna valor de uma estatística específica
   */
  getStatValue(statName: string): number {
    if (!this.pokemon.stats) return 0;
    const stat = this.pokemon.stats.find(s => s.stat.name === statName);
    return stat?.base_stat || 0;
  }  /**
   * Formata o nome do Pokémon (usa tradução se disponível)
   */
  getFormattedName(): string {
    // Prioridade: nome localizado passado por input > nome traduzido > nome original
    return this.localizedName || this.translatedName || this.capitalizeFirstLetter(this.pokemon.name);
  }

  /**
   * Retorna cor baseada no tipo principal do Pokémon
   */
  getPrimaryTypeColor(): string {
    if (!this.pokemon.types || this.pokemon.types.length === 0) {
      return '#68A090'; // Cor padrão
    }

    const primaryType = this.pokemon.types[0].type.name;
    return this.getTypeColor(primaryType);
  }
  /**
   * Retorna cor específica para cada tipo de Pokémon
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
   * Retorna tipos do Pokémon formatados
   */
  getFormattedTypes(): string {
    if (!this.pokemon.types) return '';

    return this.pokemon.types
      .map(typeInfo => this.capitalizeFirstLetter(typeInfo.type.name))
      .join(' • ');
  }

  /**
   * Capitaliza primeira letra
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
