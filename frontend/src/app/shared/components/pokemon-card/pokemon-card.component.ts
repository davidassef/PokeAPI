import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Pokemon } from '../../../models/pokemon.model';
import { FavoritesService } from '../../../core/services/favorites.service';
import { AudioService } from '../../../core/services/audio.service';

@Component({
  selector: 'app-pokemon-card',
  templateUrl: './pokemon-card.component.html',
  styleUrls: ['./pokemon-card.component.scss']
})
export class PokemonCardComponent implements OnInit {
  @Input() pokemon!: Pokemon;
  @Input() showFavoriteButton = true;
  @Input() showStats = false;
  @Input() animationDelay = 0;
  @Input() isFavorite = false;
  @Output() favoriteToggle = new EventEmitter<Pokemon>();
  @Output() cardClick = new EventEmitter<Pokemon>();
  isLoading = false;

  constructor(
    private router: Router,
    private favoritesService: FavoritesService,
    private audioService: AudioService
  ) {}
  ngOnInit() {
    // Se isFavorite não foi passado como input, verifica através do serviço
    if (!this.isFavorite) {
      this.checkIfFavorite();
    }
  }

  private checkIfFavorite() {
    this.isFavorite = this.favoritesService.isFavorite(this.pokemon.id);
  }

  onCardClick() {
    this.audioService.playSound('click');
    this.cardClick.emit(this.pokemon);
    this.router.navigate(['/tabs/details', this.pokemon.id]);
  }
  async onFavoriteClick(event: Event) {
    event.stopPropagation();
    this.isLoading = true;

    try {
      const isFavorite = await this.favoritesService.toggleFavorite(this.pokemon);
      this.isFavorite = isFavorite;
      this.favoriteToggle.emit(this.pokemon);
      this.audioService.playSound(isFavorite ? 'favorite_add' : 'favorite_remove');
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      this.isLoading = false;
    }
  }

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

  getStatBarWidth(stat: number): number {
    return Math.min((stat / 255) * 100, 100);
  }

  formatPokemonNumber(id: number): string {
    return `#${id.toString().padStart(3, '0')}`;
  }

  capitalizeName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}
