import { Component, OnInit, OnDestroy, HostListener, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { AudioService } from '../../../core/services/audio.service';
import { SettingsService } from '../../../core/services/settings.service';
import { LoggerService } from '../../../core/services/logger.service';

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration?: number;
}

@Component({
  selector: 'app-music-player',
  templateUrl: './music-player.component.html',
  styleUrls: ['./music-player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MusicPlayerComponent implements OnInit, OnDestroy {
  // Estado principal do player
  currentTrack: Track | null = null;
  isPlaying = false;
  isMuted = false;
  volume = 0.5;
  currentTime = 0;
  duration = 0;
  isLoading = false;

  // Estados de UI
  isMinimized = true;
  isAutoMinimized = false;

  // Playlist e configurações
  playlist: Track[] = [];
  defaultTrackForLanguage: Track | null = null;

  // Controles internos
  private destroy$ = new Subject<void>();
  private modalObserver?: MutationObserver;
  public isModalOpen = false;

  constructor(
    private audioService: AudioService,
    private settingsService: SettingsService,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    // Garantir que o estado inicial é minimizado
    this.isMinimized = true;
    this.isAutoMinimized = false;

    this.initializeComponent();
    this.setupModalObserver();

    // Verificar se já há modais abertos na inicialização
    this.checkExistingModals();
  }

  ngOnDestroy() {
    if (this.modalObserver) {
      this.modalObserver.disconnect();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== INICIALIZAÇÃO =====

  private async initializeComponent() {
    try {
      // Setup dos serviços
      this.setupPlaylist();
      this.loadSettings();
      this.setupAudioService();
      this.setupLanguageListener();
    } catch (error) {
      this.logger.error('musicPlayer', 'Erro na inicialização', error);
    }
  }

  private setupPlaylist() {
    this.playlist = [
      {
        id: 'opening-jp',
        title: 'Pokémon Theme (JP)',
        artist: 'Pokémon Japan',
        url: 'assets/audio/Opening JP.mp3'
      },
      {
        id: 'opening-en',
        title: 'Pokémon Theme (EN)',
        artist: 'Pokémon English',
        url: 'assets/audio/Opening EN.mp3'
      },
      {
        id: 'opening-es',
        title: 'Apertura Pokémon (ES)',
        artist: 'Pokémon España',
        url: 'assets/audio/Opening ES.mp3'
      },
      {
        id: 'opening-br',
        title: 'Abertura Pokémon (BR)',
        artist: 'Pokémon Brasil',
        url: 'assets/audio/Opening BR.mp3'
      }
    ];
  }

  private loadSettings() {
    this.settingsService.settings$
      .pipe(
        takeUntil(this.destroy$),
        // Debounce para evitar múltiplas atualizações durante mudanças de tema
        debounceTime(100)
      )
      .subscribe(settings => {
        // ✅ OTIMIZAÇÃO: Log apenas em debug
        this.logger.debug('musicPlayer', 'Configurações atualizadas', {
          musicEnabled: settings.musicEnabled,
          theme: settings.theme,
          darkMode: settings.darkMode
        });

        // Atualizar apenas configurações de áudio, não o estado de reprodução
        const newVolume = settings.musicEnabled ? (settings.musicVolume || 0.7) : 0;
        const newMuted = !settings.musicEnabled;

        // Só atualizar se realmente mudou para evitar re-renderizações desnecessárias
        if (this.volume !== newVolume || this.isMuted !== newMuted) {
          this.volume = newVolume;
          this.isMuted = newMuted;

          // Aplicar ao AudioService (fonte única da verdade)
          if (settings.musicEnabled) {
            this.audioService.setVolume(newVolume);
          }

          // ✅ OTIMIZAÇÃO: Log apenas em debug
          this.logger.debug('musicPlayer', 'Volume/mute atualizados', { volume: newVolume, muted: newMuted });
        }
      });
  }

  private setupAudioService() {
    this.audioService.audioState$
      .pipe(
        takeUntil(this.destroy$),
        // Adicionar debounce para evitar múltiplas atualizações durante mudanças de tema
        debounceTime(50)
      )
      .subscribe(state => {
        // ✅ OTIMIZAÇÃO: Log apenas em debug
        this.logger.debug('musicPlayer', 'Estado do AudioService atualizado', {
          isPlaying: state.isPlaying,
          currentTrack: state.currentTrack?.name,
          currentTime: state.currentTime
        });

        // Sincronizar APENAS com o AudioService - fonte única da verdade
        this.isPlaying = state.isPlaying;
        this.volume = state.volume;
        this.currentTime = state.currentTime;
        this.duration = state.duration;
        this.isLoading = state.isLoading;

        // Forçar detecção de mudanças apenas se necessário
        this.cdr.markForCheck();
      });
  }

  private setupLanguageListener() {
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        const lang = settings.language || 'pt-BR';
        this.setDefaultTrackForLanguage(lang);
      });
  }

  private setDefaultTrackForLanguage(language: string) {
    const langMap: { [key: string]: string } = {
      'pt-BR': 'opening-br',
      'en-US': 'opening-en',
      'es-ES': 'opening-es',
      'ja-JP': 'opening-jp'
    };

    const trackId = langMap[language] || 'opening-br';
    this.defaultTrackForLanguage = this.playlist.find(track => track.id === trackId) || null;

    if (!this.currentTrack && this.defaultTrackForLanguage) {
      // Carregar track padrão usando AudioService
      this.audioService.loadTrack(this.defaultTrackForLanguage.id)
        .then(() => {
          this.currentTrack = this.defaultTrackForLanguage;
          console.log('[MusicPlayer] Track padrão carregada:', this.defaultTrackForLanguage?.title);
        })
        .catch(error => {
          console.error('[MusicPlayer] Erro ao carregar track padrão:', error);
        });
    }
  }

  // ===== CONTROLE DO PLAYER =====

  toggleMinimize() {
    // Previne cliques duplos durante auto-minimização
    if (this.isAutoMinimized) {
      return;
    }

    // Alterna o estado
    this.isMinimized = !this.isMinimized;

    // Força detecção de mudanças
    this.cdr.detectChanges();
  }

  // Método específico para expansão via clique no player minimizado
  expandPlayer(event: Event) {
    event.stopPropagation();

    // Previne cliques duplos durante auto-minimização
    if (this.isAutoMinimized) {
      return;
    }

    // Só expande se estiver minimizado
    if (this.isMinimized) {
      this.isMinimized = false;
      this.cdr.detectChanges();
    }
  }



  async togglePlay() {
    if (!this.currentTrack) return;

    try {
      // ✅ OTIMIZAÇÃO: Log apenas em debug
      this.logger.debug('musicPlayer', `Toggle play - Estado atual: ${this.isPlaying}`);

      // Usar APENAS o AudioService - fonte única da verdade
      await this.audioService.togglePlayPause();

      this.logger.debug('musicPlayer', 'Toggle play concluído');
    } catch (error) {
      this.logger.error('musicPlayer', 'Erro no toggle play', error);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;

    // Usar AudioService para controlar volume
    const newVolume = this.isMuted ? 0 : this.volume;
    this.audioService.setVolume(newVolume);

    // Salvar configuração
    this.settingsService.saveSettings({ musicEnabled: !this.isMuted });

    console.log('[MusicPlayer] Mute toggled:', { isMuted: this.isMuted, volume: newVolume });
  }

  setVolume(event: any) {
    const newVolume = event.detail.value / 100;
    this.volume = newVolume;

    // Usar AudioService para controlar volume
    if (!this.isMuted) {
      this.audioService.setVolume(newVolume);
    }

    console.log('[MusicPlayer] Volume alterado:', newVolume);
  }

  seek(event: any) {
    if (this.duration > 0) {
      const seekTime = (event.detail.value / 100) * this.duration;

      // Usar AudioService para seek
      this.audioService.seek(seekTime);

      console.log('[MusicPlayer] Seek para:', seekTime);
    }
  }

  async playPrevious() {
    if (!this.currentTrack) return;

    const currentIndex = this.playlist.findIndex(track => track.id === this.currentTrack!.id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : this.playlist.length - 1;
    const previousTrack = this.playlist[previousIndex];

    try {
      await this.audioService.loadTrack(previousTrack.id);

      if (this.isPlaying) {
        await this.audioService.play();
      }

      this.currentTrack = previousTrack;
      console.log('[MusicPlayer] Track anterior carregada:', previousTrack.title);
    } catch (error) {
      console.error('[MusicPlayer] Erro ao carregar track anterior:', error);
    }
  }

  async playNext() {
    if (!this.currentTrack) return;

    const currentIndex = this.playlist.findIndex(track => track.id === this.currentTrack!.id);
    const nextIndex = currentIndex < this.playlist.length - 1 ? currentIndex + 1 : 0;
    const nextTrack = this.playlist[nextIndex];

    try {
      await this.audioService.loadTrack(nextTrack.id);

      if (this.isPlaying) {
        await this.audioService.play();
      }

      this.currentTrack = nextTrack;
      console.log('[MusicPlayer] Próxima track carregada:', nextTrack.title);
    } catch (error) {
      console.error('[MusicPlayer] Erro ao carregar próxima track:', error);
    }
  }

  async selectTrack(track: Track) {
    console.log('[MusicPlayer] Selecionando track:', track.title);

    try {
      // Usar AudioService para carregar a track
      await this.audioService.loadTrack(track.id);

      // Se estava tocando, continuar tocando a nova track
      if (this.isPlaying) {
        await this.audioService.play();
      }

      // Atualizar track atual local para UI
      this.currentTrack = track;

      console.log('[MusicPlayer] Track selecionada com sucesso');
    } catch (error) {
      console.error('[MusicPlayer] Erro ao selecionar track:', error);
    }
  }

  // ===== UTILITÁRIOS =====

  get orderedPlaylist(): Track[] {
    if (!this.playlist || this.playlist.length === 0) {
      return [];
    }

    // Separa a faixa padrão das outras
    const defaultTrack = this.playlist.find(track => this.isDefaultTrack(track));
    const otherTracks = this.playlist.filter(track => !this.isDefaultTrack(track));

    // Retorna com a faixa padrão no topo
    return defaultTrack ? [defaultTrack, ...otherTracks] : this.playlist;
  }

  isDefaultTrack(track: Track): boolean {
    return this.defaultTrackForLanguage?.id === track.id;
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getProgress(): number {
    if (this.duration === 0) return 0;
    return (this.currentTime / this.duration) * 100;
  }

  getVolumeIcon(): string {
    if (this.isMuted || this.volume === 0) return 'volume-mute';
    if (this.volume < 0.5) return 'volume-low';
    return 'volume-high';
  }



  // ===== EVENTOS DO DOCUMENTO =====

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    // Só funciona se o player estiver expandido
    if (this.isMinimized) return;

    const target = event.target as Element;
    if (!target || !this.elementRef.nativeElement) return;

    // Verifica se clicou dentro do player
    const clickedInside = this.elementRef.nativeElement.contains(target);

    // Verifica se clicou em elemento do Ionic
    const isIonicElement = target.closest('ion-button') ||
                           target.closest('ion-range') ||
                           target.closest('ion-icon') ||
                           target.tagName?.toLowerCase().startsWith('ion-');

    // Só minimiza se clicou fora E não é elemento do Ionic
    if (!clickedInside && !isIonicElement) {
      this.minimizePlayerAuto();
    }
  }

  private minimizePlayerAuto() {
    this.isAutoMinimized = true;
    this.isMinimized = true;
    this.cdr.detectChanges();

    // Remove flag de auto-minimização após animação
    setTimeout(() => {
      this.isAutoMinimized = false;
      this.cdr.detectChanges();
    }, 500);
  }

  // ===== OBSERVADOR DE MODAIS =====

  private setupModalObserver() {
    this.modalObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const element = node as Element;
            // Detectar se um modal foi adicionado (incluindo modal de autenticação)
            if (element.classList?.contains('mobile-modal-overlay') ||
                element.classList?.contains('details-modal-overlay') ||
                element.classList?.contains('auth-modal-container') ||
                element.tagName === 'APP-AUTH-MODAL-NEW' ||
                element.querySelector?.('.mobile-modal-overlay, .details-modal-overlay, .auth-modal-container, app-auth-modal-new')) {
              this.onModalOpened();
            }
          }
        });

        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const element = node as Element;
            // Detectar se um modal foi removido (incluindo modal de autenticação)
            if (element.classList?.contains('mobile-modal-overlay') ||
                element.classList?.contains('details-modal-overlay') ||
                element.classList?.contains('auth-modal-container') ||
                element.tagName === 'APP-AUTH-MODAL-NEW' ||
                element.querySelector?.('.mobile-modal-overlay, .details-modal-overlay, .auth-modal-container, app-auth-modal-new')) {
              this.onModalClosed();
            }
          }
        });
      });
    });

    this.modalObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('[MusicPlayer] Modal observer configurado');
  }

  private onModalOpened() {
    this.isModalOpen = true;

    // Forçar z-index baixo quando modal aberto
    const musicPlayerElement = this.elementRef.nativeElement.querySelector('.music-player');
    if (musicPlayerElement) {
      musicPlayerElement.style.zIndex = '100';
      console.log('[MusicPlayer] Modal detectado - z-index alterado para 100');
    } else {
      console.warn('[MusicPlayer] Elemento .music-player não encontrado');
    }

    console.log('[MusicPlayer] Modal aberto - isModalOpen:', this.isModalOpen);
  }

  private onModalClosed() {
    this.isModalOpen = false;

    // Restaurar z-index normal quando modal fechado
    const musicPlayerElement = this.elementRef.nativeElement.querySelector('.music-player');
    if (musicPlayerElement) {
      musicPlayerElement.style.zIndex = 'var(--z-music-player)';
      console.log('[MusicPlayer] Modal fechado - z-index restaurado para var(--z-music-player)');
    } else {
      console.warn('[MusicPlayer] Elemento .music-player não encontrado');
    }

    console.log('[MusicPlayer] Modal fechado - isModalOpen:', this.isModalOpen);
  }

  // Verificar se já existem modais abertos na inicialização
  private checkExistingModals() {
    const existingModal = document.querySelector('.mobile-modal-overlay, .details-modal-overlay, .auth-modal-container, app-auth-modal-new');
    if (existingModal) {
      console.log('[MusicPlayer] Modal já existente detectado na inicialização:', existingModal.tagName || existingModal.className);
      this.onModalOpened();
    } else {
      console.log('[MusicPlayer] Nenhum modal detectado na inicialização');
    }
  }
}
