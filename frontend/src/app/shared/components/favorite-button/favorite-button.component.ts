import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FavoritesService } from '../../../core/services/favorites.service';
import { PokemonListItem } from '../../../core/interfaces/pokemon.interface';

/**
 * Componente de botão de favorito reutilizável
 * Pode ser usado em cards, modais e listas de Pokémon
 */
@Component({
  selector: 'app-favorite-button',
  templateUrl: './favorite-button.component.html',
  styleUrls: ['./favorite-button.component.scss']
})
export class FavoriteButtonComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  /**
   * Dados do Pokémon para favoritar
   */
  @Input() pokemon!: PokemonListItem | any;

  /**
   * Tamanho do botão: 'small', 'medium', 'large'
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Estilo do botão: 'filled', 'outline', 'clear'
   */
  @Input() fill: 'filled' | 'outline' | 'clear' = 'clear';

  /**
   * Cor do botão quando não é favorito
   */
  @Input() color: string = 'medium';

  /**
   * Cor do botão quando é favorito
   */
  @Input() favoriteColor: string = 'danger';

  /**
   * Mostrar texto junto com o ícone
   */
  @Input() showText: boolean = false;

  /**
   * Texto personalizado (se não fornecido, usa tradução padrão)
   */
  @Input() customText?: string;

  /**
   * Desabilitar o botão
   */
  @Input() disabled: boolean = false;

  /**
   * Evento emitido quando o status de favorito muda
   */
  @Output() favoriteChanged = new EventEmitter<{ pokemon: any, isFavorite: boolean }>();

  /**
   * Status atual de favorito
   */
  isFavorite: boolean = false;

  /**
   * Estado de loading durante operação
   */
  isLoading: boolean = false;

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit() {
    if (!this.pokemon) {
      console.error('❌ FavoriteButtonComponent: pokemon é obrigatório');
      return;
    }

    // Verificar status inicial
    this.updateFavoriteStatus();

    // Escutar mudanças nos favoritos
    this.favoritesService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateFavoriteStatus();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Atualiza o status de favorito
   */
  private updateFavoriteStatus(): void {
    if (this.pokemon && this.pokemon.id) {
      this.isFavorite = this.favoritesService.isFavorite(this.pokemon.id);
    }
  }

  /**
   * Alterna o status de favorito
   */
  onToggleFavorite(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    if (this.disabled || this.isLoading || !this.pokemon) {
      return;
    }

    this.isLoading = true;

    try {
      // Simular pequeno delay para feedback visual
      setTimeout(() => {
        this.favoritesService.toggleFavorite(this.pokemon);
        
        // Emitir evento
        this.favoriteChanged.emit({
          pokemon: this.pokemon,
          isFavorite: !this.isFavorite
        });

        this.isLoading = false;
      }, 150);

    } catch (error) {
      console.error('❌ Erro ao alterar favorito:', error);
      this.isLoading = false;
    }
  }

  /**
   * Obtém o ícone apropriado
   */
  get iconName(): string {
    if (this.isLoading) {
      return 'hourglass-outline';
    }
    return this.isFavorite ? 'heart' : 'heart-outline';
  }

  /**
   * Obtém a cor apropriada
   */
  get buttonColor(): string {
    return this.isFavorite ? this.favoriteColor : this.color;
  }

  /**
   * Obtém o texto apropriado
   */
  get buttonText(): string {
    if (this.customText) {
      return this.customText;
    }
    return this.isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos';
  }

  /**
   * Obtém classes CSS baseadas no tamanho
   */
  get sizeClass(): string {
    return `favorite-button--${this.size}`;
  }
}
