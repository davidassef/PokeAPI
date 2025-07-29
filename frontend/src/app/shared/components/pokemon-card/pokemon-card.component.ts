import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Pokemon } from '../../../models/pokemon.model';
import { CapturedService } from '../../../core/services/captured.service';
import { AudioService } from '../../../core/services/audio.service';
import { PokeApiService } from '../../../core/services/pokeapi.service';
import { PokemonImageService } from '../../../core/services/pokemon-image.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { RbacService, Permission } from '../../../core/services/rbac.service';
import { ToastController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthModalNewComponent } from '../auth-modal-new/auth-modal-new.component';
import { AdminPokemonModalComponent } from '../admin-pokemon-modal/admin-pokemon-modal.component';
import { ToastNotificationService } from '../../../core/services/toast-notification.service';

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
  @Input() showAdminControls = true; // Controla se mostra botões de admin
  @Output() captureToggle = new EventEmitter<{ pokemon: Pokemon, isCaptured: boolean }>();

  @Output() cardClick = new EventEmitter<Pokemon>();
  @Output() pokemonUpdated = new EventEmitter<Pokemon>(); // Evento para quando Pokemon é atualizado
  @Output() pokemonDeleted = new EventEmitter<number>(); // Evento para quando Pokemon é deletado

  isLoading = false;
  imageUrl: string = '';
  canManagePokemon = false;
  isAdmin = false;

  private capturedSub?: Subscription;
  private rbacSub?: Subscription;
  private isProcessing = false;

  constructor(
    private router: Router,
    private audioService: AudioService,
    private pokeApiService: PokeApiService,
    private pokemonImageService: PokemonImageService,
    private capturedService: CapturedService,
    private authService: AuthService,
    private rbacService: RbacService,
    private toastController: ToastController,
    private translate: TranslateService,
    private modalController: ModalController,
    private toastNotification: ToastNotificationService
  ) {}

  ngOnInit() {
    // Verifica permissões de administrador
    this.rbacSub = this.rbacService.canManagePokemon().subscribe(canManage => {
      this.canManagePokemon = canManage;
    });

    this.rbacService.isAdmin().subscribe(isAdmin => {
      this.isAdmin = isAdmin;
    });

    this.loadPokemonImage();
  }

  ngOnDestroy() {
    this.capturedSub?.unsubscribe();
    this.rbacSub?.unsubscribe();
  }

  /**
   * Carrega a imagem do Pokémon usando o novo serviço de cache do backend.
   *
   * Substitui a dependência direta de URLs externas por um sistema robusto
   * que utiliza cache no backend e fallback para placeholders.
   */
  private loadPokemonImage() {
    this.pokemonImageService.getPokemonImageUrl(this.pokemon.id, 'official-artwork').subscribe({
      next: (url) => {
        this.imageUrl = url;
        console.debug(`[PokemonCard] Imagem carregada para ${this.pokemon.name}: ${url.substring(0, 50)}...`);
      },
      error: (error) => {
        console.error(`[PokemonCard] Erro ao carregar imagem do ${this.pokemon.name}:`, error);
        // O serviço já retorna placeholder em caso de erro, mas garantimos aqui também
        this.imageUrl = this.pokemonImageService['getPlaceholderUrl'](this.pokemon.id, 'official-artwork');
      }
    });
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

    // Verifica autenticação de forma mais robusta
    const isAuthenticated = this.authService.isAuthenticated();
    const currentUser = this.authService.getCurrentUser();

    console.log('[PokemonCard] Verificação de autenticação:', {
      isAuthenticated,
      hasUser: !!currentUser,
      userId: currentUser?.id
    });

    if (!isAuthenticated || !currentUser) {
      console.log('[PokemonCard] Usuário não autenticado, abrindo modal de login');
      await this.openAuthModal();
      return;
    }

    // Inicia o processo de captura/liberação
    this.isProcessing = true;
    this.isLoading = true;
    console.log(`[PokemonCard] Iniciando ${this.isCaptured ? 'libertação' : 'captura'} do Pokémon ${this.pokemon.id}`);

    // Passa o estado atual para evitar verificação HTTP desnecessária
    this.capturedService.toggleCaptured(this.pokemon, this.isCaptured).subscribe({
      next: (isCaptured) => {
        console.log(`[PokemonCard] Pokémon ${this.pokemon.id} ${isCaptured ? 'capturado' : 'liberado'} com sucesso`);
        this.isCaptured = isCaptured;
        this.captureToggle.emit({ pokemon: this.pokemon, isCaptured });

        // Toca o som de captura/libertação
        this.audioService.playCaptureSound(isCaptured ? 'capture' : 'release')
          .catch(error => console.error('[PokemonCard] Erro ao reproduzir som:', error));

        // Exibe mensagem de sucesso usando toast inteligente
        if (isCaptured) {
          this.toastNotification.showPokemonCaptured(this.pokemon.name);
        } else {
          this.toastNotification.showPokemonReleased(this.pokemon.name);
        }
      },
      error: async (error: any) => {
        console.error('[PokemonCard] Erro ao alternar estado de captura:', {
          pokemonId: this.pokemon.id,
          error: error.error || error.message,
          status: error.status
        });

        // Resetar estado de loading imediatamente em caso de erro
        this.isLoading = false;
        this.isProcessing = false;

        // Se for erro de autenticação, abrir modal de login novamente
        if (error.status === 401 || error.status === 403) {
          console.log('[PokemonCard] Erro de autenticação, abrindo modal de login');
          await this.openAuthModal();
          return;
        }

        // Mensagem de erro adequada com base no status HTTP
        let messageKey = 'capture.error';
        if (error.status === 0) {
          messageKey = 'capture.network_error';
        } else if (error.status === 408 || error.message?.includes('timeout')) {
          messageKey = 'capture.timeout';
        }

        await this.toastNotification.showError(messageKey);
      },
      complete: () => {
        console.log(`[PokemonCard] Operação de ${this.isCaptured ? 'captura' : 'libertação'} concluída`);
        this.isLoading = false;
        this.isProcessing = false;

        // Force reset do alinhamento do ícone após operação
        this.forceIconReset();
      }
    });
  }

  /**
   * Force reset do alinhamento do ícone da pokébola
   * Corrige bug visual onde o ícone fica desalinhado após captura/liberação
   */
  private forceIconReset(): void {
    // Usar setTimeout para garantir que o DOM foi atualizado
    setTimeout(() => {
      const captureBtn = document.querySelector(`[data-pokemon-id="${this.pokemon.id}"] .capture-btn`);
      if (captureBtn) {
        // Adicionar classe de reset temporariamente
        captureBtn.classList.add('force-reset');

        // Remover a classe após um breve delay para permitir a transição
        setTimeout(() => {
          captureBtn.classList.remove('force-reset');
        }, 100);
      }
    }, 50);
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
   * Callback quando a imagem começa a carregar
   */
  onImageStartLoading(): void {
    // ✅ CLEANUP: Log de carregamento removido - funcionalidade estável após FASE 4
    // console.log(`🔄 Loading image for ${this.pokemon.name}`);
  }

  /**
   * Callback quando a imagem é carregada com sucesso
   */
  onImageLoaded(): void {
    // ✅ CLEANUP: Log de sucesso removido - funcionalidade estável após FASE 4
    // console.log(`✅ Image loaded for ${this.pokemon.name}`);
  }

  /**
   * Callback quando há erro no carregamento da imagem
   */
  onImageError(error: Error): void {
    console.error(`❌ Image error for ${this.pokemon.name}:`, error);
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
        // Login bem-sucedido, verificar novamente o estado de autenticação
        console.log('[PokemonCard] Login bem-sucedido, verificando estado de autenticação');

        // Aguardar um pouco para garantir que o estado foi atualizado
        setTimeout(() => {
          const isAuthenticated = this.authService.isAuthenticated();
          const currentUser = this.authService.getCurrentUser();

          console.log('[PokemonCard] Estado após login:', {
            isAuthenticated,
            hasUser: !!currentUser,
            userId: currentUser?.id
          });

          if (isAuthenticated && currentUser) {
            console.log('[PokemonCard] Usuário autenticado, tentando capturar novamente');
            this.onCaptureClick(new Event('click'));
          } else {
            console.log('[PokemonCard] Usuário ainda não autenticado após login');
          }
        }, 1000); // Aumentado para 1 segundo para garantir sincronização
      } else {
        console.log('[PokemonCard] Login cancelado ou falhou');
      }
    });

    return await modal.present();
  }

  // Métodos de administração
  async openEditPokemonModal(event: Event) {
    event.stopPropagation();

    const modal = await this.modalController.create({
      component: AdminPokemonModalComponent,
      cssClass: 'admin-pokemon-modal',
      componentProps: {
        pokemon: this.pokemon,
        mode: 'edit'
      },
      backdropDismiss: true,
      showBackdrop: true
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.success) {
        if (result.data.pokemon) {
          // Pokemon foi atualizado
          this.pokemonUpdated.emit(result.data.pokemon);
          this.toastNotification.showSuccess('admin.pokemon.success.updated');
        } else {
          // Pokemon foi deletado
          this.pokemonDeleted.emit(this.pokemon.id);
          this.toastNotification.showSuccess('admin.pokemon.success.deleted');
        }
      }
    });

    return await modal.present();
  }

  async deletePokemon(event: Event) {
    event.stopPropagation();

    // Abre o modal de edição em modo de exclusão
    await this.openEditPokemonModal(event);
  }



  // Getter para verificar se deve mostrar controles de admin
  get shouldShowAdminControls(): boolean {
    return this.showAdminControls && this.canManagePokemon && this.isAdmin;
  }
}
