import { Component, OnInit, OnDestroy, HostListener, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { AudioService } from '../../../core/services/audio.service';
import { SettingsService } from '../../../core/services/settings.service';

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
  styleUrls: ['./music-player.component.scss']
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
  private audio?: HTMLAudioElement;

  constructor(
    private audioService: AudioService,
    private settingsService: SettingsService,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    // Garantir que o estado inicial é minimizado
    this.isMinimized = true;
    this.isAutoMinimized = false;

    this.initializeComponent();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupAudio();
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
      console.error('MusicPlayer: Erro na inicialização:', error);
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
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.volume = settings.musicEnabled ? 0.7 : 0;
        this.isMuted = !settings.musicEnabled;
        if (this.audio) {
          this.audio.volume = this.isMuted ? 0 : this.volume;
        }
      });
  }

  private setupAudioService() {
    this.audioService.audioState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.isPlaying = state.isPlaying;
        this.volume = state.volume;
        this.currentTime = state.currentTime;
        this.duration = state.duration;
        this.isLoading = state.isLoading;
        this.cdr.detectChanges();
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
      this.loadTrack(this.defaultTrackForLanguage, false);
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

  private loadTrack(track: Track, autoplay = false) {
    this.currentTrack = track;
    this.isLoading = true;

    this.cleanupAudio();

    this.audio = new Audio();
    this.audio.src = track.url;
    this.audio.volume = this.isMuted ? 0 : this.volume;
    this.audio.loop = true;

    this.audio.addEventListener('loadedmetadata', () => {
      this.duration = this.audio?.duration || 0;
      this.isLoading = false;
      this.cdr.detectChanges();

      if (autoplay) {
        this.audio?.play().catch(e => console.error('Erro no autoplay:', e));
        this.isPlaying = true;
      }
    });

    this.audio.addEventListener('timeupdate', () => {
      this.currentTime = this.audio?.currentTime || 0;
      this.cdr.detectChanges();
    });

    this.audio.addEventListener('ended', () => {
      this.playNext();
    });

    this.audio.addEventListener('error', (error) => {
      console.error('MusicPlayer: Erro no áudio:', error);
      this.isLoading = false;
      this.isPlaying = false;
      this.cdr.detectChanges();
    });

    this.audio.load();
  }

  async togglePlay() {
    if (!this.audio || !this.currentTrack) return;

    try {
      if (this.isPlaying) {
        this.audio.pause();
        this.audioService.pause();
      } else {
        await this.audio.play();
        this.audioService.play();
      }
      this.isPlaying = !this.isPlaying;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('MusicPlayer: Erro no toggle play:', error);
      this.isPlaying = false;
      this.cdr.detectChanges();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.audio) {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
    this.settingsService.saveSettings({ musicEnabled: !this.isMuted });
  }

  setVolume(event: any) {
    this.volume = event.detail.value / 100;
    if (this.audio) {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
  }

  seek(event: any) {
    if (this.audio && this.duration > 0) {
      const seekTime = (event.detail.value / 100) * this.duration;
      this.audio.currentTime = seekTime;
      this.audioService.seek(seekTime);
    }
  }

  playPrevious() {
    if (!this.currentTrack) return;

    const currentIndex = this.playlist.findIndex(track => track.id === this.currentTrack!.id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : this.playlist.length - 1;

    this.loadTrack(this.playlist[previousIndex]);
    if (this.isPlaying) {
      setTimeout(() => this.togglePlay(), 100);
    }
  }

  playNext() {
    if (!this.currentTrack) return;

    const currentIndex = this.playlist.findIndex(track => track.id === this.currentTrack!.id);
    const nextIndex = currentIndex < this.playlist.length - 1 ? currentIndex + 1 : 0;

    this.loadTrack(this.playlist[nextIndex]);
    if (this.isPlaying) {
      setTimeout(() => this.togglePlay(), 100);
    }
  }

  selectTrack(track: Track) {
    this.loadTrack(track);
    if (this.isPlaying) {
      setTimeout(() => this.togglePlay(), 100);
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

  private cleanupAudio() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = undefined;
    }
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
}
