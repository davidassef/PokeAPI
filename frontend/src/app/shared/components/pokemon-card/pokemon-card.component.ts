import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Pokemon } from '../../../models/pokemon.model';
import { CapturedService } from '../../../core/services/captured.service';
import { AudioService } from '../../../core/services/audio.service';
import { PokeApiService } from '../../../core/services/pokeapi.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pokemon-card',
  templateUrl: './pokemon-card.component.html',
  styleUrls: ['./pokemon-card.component.scss']
})
export class PokemonCardComponent implements OnInit, OnDestroy {
  @Input() pokemon!: Pokemon;
  @Input() showCaptureButton = true;
  @Input() showStats = false;
  @Input() animationDelay = 0;
  @Input() isCaptured = false;
  @Input() customBadge?: number;
  @Input() favoriteCount?: number;
  @Output() captureToggle = new EventEmitter<{ pokemon: Pokemon, isCaptured: boolean }>();
  @Output() cardClick = new EventEmitter<Pokemon>();
  isLoading = false;
  imageUrl: string = '';
  private capturedSub?: Subscription;
  private isProcessing = false;

  constructor(
    private router: Router,
    private audioService: AudioService,
    private pokeApiService: PokeApiService,
    private capturedService: CapturedService
  ) {}

  ngOnInit() {
    this.capturedSub = this.capturedService.captured$.subscribe(() => {
      this.isCaptured = this.capturedService.isCaptured(this.pokemon.id);
    });
    this.loadPokemonImage();
  }

  ngOnDestroy() {
    this.capturedSub?.unsubscribe();
  }

  private loadPokemonImage() {
    this.pokeApiService.getPokemonOfficialArtworkUrl(this.pokemon.id).subscribe(
      url => this.imageUrl = url,
      error => console.error('Error loading Pokemon image:', error)
    );
  }

  onCardClick() {
    this.audioService.playSound('click');
    this.cardClick.emit(this.pokemon);
    this.router.navigate(['/tabs/details', this.pokemon.id]);
  }

  async onCaptureClick(event: Event) {
    if (this.isProcessing) return;
    this.isProcessing = true;
    event.stopPropagation();
    this.isLoading = true;
    try {
      const isCaptured = await this.capturedService.toggleCaptured(this.pokemon);
      this.isCaptured = isCaptured;
      this.captureToggle.emit({ pokemon: this.pokemon, isCaptured });
      await this.audioService.playCaptureSound(isCaptured ? 'capture' : 'release');
    } catch (error) {
      console.error('Error toggling captured:', error);
    } finally {
      this.isLoading = false;
      this.isProcessing = false;
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
