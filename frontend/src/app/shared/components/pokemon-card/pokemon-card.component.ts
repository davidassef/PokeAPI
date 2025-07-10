import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Pokemon } from '../../../models/pokemon.model';
import { CapturedService } from '../../../core/services/captured.service';
import { AudioService } from '../../../core/services/audio.service';
import { PokeApiService } from '../../../core/services/pokeapi.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ToastController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthModalNewComponent } from '../auth-modal-new/auth-modal-new.component';

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
    private capturedService: CapturedService,
    private authService: AuthService,
    private toastController: ToastController,
    private translate: TranslateService,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.capturedSub = this.capturedService.captured$.subscribe(() => {
      this.capturedService.isCaptured(this.pokemon.id).subscribe(isCaptured => {
        this.isCaptured = isCaptured;
      });
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

  onCardClick(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.cardClick.emit(this.pokemon);
  }

  /**
   * Manipula o clique no botão de captura/liberação
   * @param event Evento de clique
   */
  async onCaptureClick(event: Event) {
    event.stopPropagation();

    // Evita múltiplos cliques rápidos
    if (this.isProcessing) {
      console.log('[PokemonCard] Operação de captura já em andamento, ignorando clique');
      return;
    }

    // Verifica autenticação
    if (!this.authService.isAuthenticated()) {
      console.log('[PokemonCard] Usuário não autenticado, abrindo modal de login');
      await this.openAuthModal();
      return;
    }

    // Inicia o processo de captura/liberação
    this.isProcessing = true;
    this.isLoading = true;
    console.log(`[PokemonCard] Iniciando ${this.isCaptured ? 'libertação' : 'captura'} do Pokémon ${this.pokemon.id}`);

    this.capturedService.toggleCaptured(this.pokemon).subscribe({
      next: (isCaptured) => {
        console.log(`[PokemonCard] Pokémon ${this.pokemon.id} ${isCaptured ? 'capturado' : 'liberado'} com sucesso`);
        this.isCaptured = isCaptured;
        this.captureToggle.emit({ pokemon: this.pokemon, isCaptured });

        // Toca o som de captura/libertação
        this.audioService.playCaptureSound(isCaptured ? 'capture' : 'release')
          .catch(error => console.error('[PokemonCard] Erro ao reproduzir som:', error));

        // Exibe mensagem de sucesso
        const messageKey = isCaptured ? 'capture.success' : 'capture.released';
        this.showToast(messageKey, 'success');
      },
      error: async (error: any) => {
        console.error('[PokemonCard] Erro ao alternar estado de captura:', {
          pokemonId: this.pokemon.id,
          error: error.error || error.message,
          status: error.status
        });

        // Mensagem de erro adequada com base no status HTTP
        let messageKey = 'capture.error';
        if (error.status === 401 || error.status === 403) {
          messageKey = 'capture.auth_error';
        } else if (error.status === 0) {
          messageKey = 'capture.network_error';
        }

        await this.showToast(messageKey, 'danger');
      },
      complete: () => {
        console.log(`[PokemonCard] Operação de ${this.isCaptured ? 'captura' : 'libertação'} concluída`);
        this.isLoading = false;
        this.isProcessing = false;
      }
    });
  }

  /**
   * Exibe uma mensagem toast para o usuário
   * @param messageKey Chave da mensagem de tradução
   * @param color Cor do toast (danger, success, etc.)
   * @param duration Duração em milissegundos
   */
  private async showToast(messageKey: string, color: string = 'primary', duration: number = 2500) {
    try {
      const message = await this.translate.get(messageKey).toPromise();
      const toast = await this.toastController.create({
        message,
        duration,
        color,
        position: 'top',
        buttons: [
          {
            icon: 'close',
            role: 'cancel'
          }
        ]
      });
      await toast.present();
    } catch (error) {
      console.error('[PokemonCard] Erro ao exibir toast:', error);
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

  /**
   * Abre o modal de autenticação
   */
  private async openAuthModal() {
    this.isProcessing = false; // Reset processing state

    const modal = await this.modalController.create({
      component: AuthModalNewComponent,
      cssClass: 'auth-modal-fixed'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.success) {
        // Login bem-sucedido, tentar capturar novamente
        console.log('[PokemonCard] Login bem-sucedido, tentando capturar novamente');
        setTimeout(() => {
          this.onCaptureClick(new Event('click'));
        }, 500);
      }
    });

    return await modal.present();
  }
}
