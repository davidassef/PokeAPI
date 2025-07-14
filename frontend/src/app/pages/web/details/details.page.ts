import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { AudioService } from '../../../core/services/audio.service';
import { CapturedService } from '../../../core/services/captured.service';
import { PokeApiService } from '../../../core/services/pokeapi.service';
import { Pokemon } from '../../../models/pokemon.model';
import { AuthService } from '../../../core/services/auth.service';
import { AuthModalNewComponent } from '../../../shared/components/auth-modal-new/auth-modal-new.component';

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
  isCaptured = false;
  selectedImageType = 'default';
  currentImageUrl = '';
  showCaptureAnimation = false;

  private pokemonId: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pokeApiService: PokeApiService,
    private capturedService: CapturedService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private translate: TranslateService,
    private audioService: AudioService,
    private authService: AuthService,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.pokemonId = parseInt(params['id'], 10);
      if (this.pokemonId) {
        this.loadPokemonDetails();
        this.checkIfCaptured();
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
      const pokemonData = await this.pokeApiService.getPokemon(this.pokemonId).toPromise();
      this.pokemon = pokemonData || null;
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
   * Verifica se o Pokémon está capturado
   */
  private checkIfCaptured() {
    this.capturedService.getCaptured()
      .pipe(takeUntil(this.destroy$))
      .subscribe(captured => {
        this.isCaptured = captured.some(cap => cap.pokemon_id === this.pokemonId);
      });
  }

  /**
   * Alterna status de captura
   */
  async toggleFavorite() {
    if (!this.pokemon) return;

    // Verifica autenticação
    if (!this.authService.isAuthenticated()) {
      console.log('[DetailsPage] Usuário não autenticado, abrindo modal de login');
      await this.openAuthModal();
      return;
    }

    try {
      if (this.isCaptured) {
        await this.capturedService.removeFromCaptured(this.pokemon.id);
        await this.audioService.playCaptureSound('release');
        this.showToast(this.translate.instant('details.removed_from_captured'));
      } else {
        await this.capturedService.addToCaptured(this.pokemon);
        await this.audioService.playCaptureSound('capture');
        this.showCaptureAnimation = true;
        setTimeout(() => this.showCaptureAnimation = false, 1000);
        this.showToast(this.translate.instant('details.added_to_captured'));
      }
    } catch (error) {
      console.error('Erro ao alterar captura:', error);
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
    return this.currentImageUrl || 'assets/img/pokeball.png';
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
   * Seleciona imagem
   */
  selectImage(url: string) {
    this.currentImageUrl = url;
  }

  /**
   * Altera tipo de imagem
   */
  onImageTypeChange(event: any) {
    this.selectedImageType = event.detail.value;
    const variants = this.getImageVariants();
    if (variants.length > 0) {
      this.currentImageUrl = variants[0].url;
    }
  }

  /**
   * Obtém nome da stat
   */
  getStatName(statName: string): string {
    const statNames: { [key: string]: string } = {
      hp: 'HP',
      attack: 'Ataque',
      defense: 'Defesa',
      'special-attack': 'Ataque Especial',
      'special-defense': 'Defesa Especial',
      speed: 'Velocidade'
    };
    return statNames[statName] || statName;
  }

  /**
   * Obtém porcentagem da stat
   */
  getStatPercentage(statValue: number): number {
    return Math.min((statValue / 255) * 100, 100);
  }

  /**
   * Obtém total de stats
   */
  getTotalStats(): number {
    if (!this.pokemon?.stats) return 0;
    return this.pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);
  }

  /**
   * Obtém movimentos recentes
   */
  getRecentMoves(): { move: { name: string } }[] {
    if (!this.pokemon?.moves) return [];
    return this.pokemon.moves.slice(0, 4);
  }

  /**
   * Trata erro de imagem
   */
  onImageError(event: any) {
    event.target.src = 'assets/img/pokeball.png';
  }

  /**
   * Tenta carregar novamente
   */
  retry() {
    this.loadPokemonDetails();
  }

  /**
   * Exibe toast de erro
   */
  private async showErrorToast() {
    const toast = await this.toastController.create({
      message: this.translate.instant('details.error_loading'),
      duration: 3000,
      color: 'danger',
      position: 'top'
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
      position: 'top'
    });
    await toast.present();
  }

  /**
   * Compartilha Pokémon
   */
  async sharePokemon() {
    if (!this.pokemon) return;

    const shareData = {
      title: `${this.pokemon.name} - Pokédex`,
      text: `Confira ${this.pokemon.name} na Pokédex!`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback para copiar URL
        await navigator.clipboard.writeText(window.location.href);
        this.showToast(this.translate.instant('details.url_copied'));
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  }

  /**
   * Abre o modal de autenticação
   */
  private async openAuthModal() {
    const modal = await this.modalController.create({
      component: AuthModalNewComponent,
      cssClass: 'auth-modal-fixed'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.success) {
        // Login bem-sucedido, tentar capturar novamente
        console.log('[DetailsPage] Login bem-sucedido, tentando capturar novamente');
        setTimeout(() => {
          this.toggleFavorite();
        }, 500);
      }
    });

    return await modal.present();
  }
}
