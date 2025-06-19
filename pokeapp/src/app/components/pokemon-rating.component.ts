// ⭐ Pokemon Rating Component
// Componente de avaliação com feedback visual

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export interface RatingStats {
  average: number;
  total: number;
  distribution: number[]; // Array com contagem para cada estrela
}

@Component({
  selector: 'app-pokemon-rating',
  templateUrl: './pokemon-rating.component.html',
  styleUrls: ['./pokemon-rating.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class PokemonRatingComponent implements OnInit {

  @Input() currentRating = 0;
  @Input() maxRating = 5;
  @Input() readonly = false;
  @Input() showTitle = true;
  @Input() showFeedback = true;
  @Input() showStats = false;
  @Input() title?: string;
  @Input() stats?: RatingStats;
  @Input() pokemonId?: number;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() color = '#FFD700'; // Cor dourada padrão

  @Output() ratingChange = new EventEmitter<number>();
  @Output() ratingHover = new EventEmitter<number>();

  hoveredRating = 0;
  stars: number[] = [];

  private feedbackMessages = [
    '', // 0 estrelas
    'Não gostei', // 1 estrela
    'Razoável', // 2 estrelas
    'Bom', // 3 estrelas
    'Muito bom', // 4 estrelas
    'Excelente!', // 5 estrelas
  ];

  ngOnInit(): void {
    this.stars = Array(this.maxRating).fill(0).map((_, i) => i + 1);
  }

  /**
   * Define nova avaliação
   */
  setRating(rating: number): void {
    if (this.readonly) return;

    this.currentRating = rating;
    this.ratingChange.emit(rating);

    // Micro-feedback tátil
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }

  /**
   * Hover sobre estrela
   */
  onStarHover(rating: number): void {
    if (this.readonly) return;

    this.hoveredRating = rating;
    this.ratingHover.emit(rating);
  }

  /**
   * Sai do hover
   */
  onStarLeave(): void {
    this.hoveredRating = 0;
    this.ratingHover.emit(0);
  }

  /**
   * Retorna fill da estrela baseado no estado
   */
  getStarFill(index: number): string {
    const starNumber = index + 1;
    const activeRating = this.hoveredRating || this.currentRating;

    if (starNumber <= activeRating) {
      return this.color;
    }

    return 'none';
  }

  /**
   * Retorna stroke da estrela
   */
  getStarStroke(index: number): string {
    const starNumber = index + 1;
    const activeRating = this.hoveredRating || this.currentRating;

    if (starNumber <= activeRating) {
      return this.color;
    }

    return '#ccc';
  }

  /**
   * Retorna feedback textual da avaliação
   */
  getRatingFeedback(): string {
    const rating = this.hoveredRating || this.currentRating;
    return this.feedbackMessages[rating] || '';
  }

  /**
   * Retorna porcentagem preenchida
   */
  getFilledPercentage(): number {
    return (this.currentRating / this.maxRating) * 100;
  }

  /**
   * Verifica se estrela está ativa
   */
  isStarActive(index: number): boolean {
    const starNumber = index + 1;
    const activeRating = this.hoveredRating || this.currentRating;
    return starNumber <= activeRating;
  }

  /**
   * Retorna classes CSS baseadas no tamanho
   */
  getSizeClass(): string {
    return `rating-${this.size}`;
  }
}
