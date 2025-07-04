import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
  currentTrack: Track | null = null;
  isPlaying = false;
  isMuted = false;
  volume = 0.5;
  currentTime = 0;
  duration = 0;
  isMinimized = true;
  isLoading = false;
  isAutoMinimized = false;

  playlist: Track[] = [];
  defaultTrackForLanguage: Track | null = null;

  private destroy$ = new Subject<void>();
  private audio?: HTMLAudioElement;

  constructor(
    private audioService: AudioService,
    private settingsService: SettingsService,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    this.loadSettings();
    this.setupAudioService();
    this.setupPlaylist();
    this.setupLanguageListener();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
    }
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
      });
  }

  private setupPlaylist() {
    // Configurar playlist com todas as faixas de opening
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

  private setupLanguageListener() {
    // Escutar mudanças de idioma para definir a faixa padrão
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

    // Se não há faixa atual tocando, carrega a faixa padrão do idioma
    if (!this.currentTrack && this.defaultTrackForLanguage) {
      this.loadTrack(this.defaultTrackForLanguage, true); // true = autoplay
    }
  }

  private initializePlayer() {
    // Load first track by default
    if (this.playlist.length > 0) {
      this.loadTrack(this.playlist[0]);
    }
  }

  private loadTrack(track: Track, autoplay = false) {
    this.currentTrack = track;
    this.isLoading = true;

    if (this.audio) {
      this.audio.pause();
    }

    this.audio = new Audio();
    this.audio.src = track.url;
    this.audio.volume = this.isMuted ? 0 : this.volume;
    this.audio.loop = true;

    this.audio.addEventListener('loadedmetadata', () => {
      this.duration = this.audio?.duration || 0;
      this.isLoading = false;
      if (autoplay) {
        this.audio?.play();
        this.isPlaying = true;
      }
    });

    this.audio.addEventListener('timeupdate', () => {
      this.currentTime = this.audio?.currentTime || 0;
    });

    this.audio.addEventListener('ended', () => {
      this.playNext();
    });

    this.audio.addEventListener('error', (error) => {
      console.error('Audio error:', error);
      this.isLoading = false;
      this.isPlaying = false;
    });

    // Preload the audio
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
    } catch (error) {
      console.error('Error toggling play:', error);
      this.isPlaying = false;
    }
  }
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.audio) {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
    // Save mute state to settings
    this.settingsService.saveSettings({ musicEnabled: !this.isMuted });
  }

  setVolume(event: any) {
    this.volume = event.detail.value / 100;
    if (this.audio) {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
    // Não chama audioService.setVolume para evitar conflito
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

  isDefaultTrack(track: Track): boolean {
    return this.defaultTrackForLanguage?.id === track.id;
  }

  toggleMinimize() {
    console.log('toggleMinimize called, current state:', this.isMinimized);
    this.isMinimized = !this.isMinimized;
    console.log('new state:', this.isMinimized);
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    // Só aplica auto-minimização se o player JÁ ESTAVA expandido antes do clique
    // Captura o estado ANTES de qualquer mudança
    const wasExpandedBeforeClick = !this.isMinimized;

    // Pequeno delay para garantir que todos os eventos foram processados
    setTimeout(() => {
      const target = event.target as Element;
      if (target && this.elementRef.nativeElement && wasExpandedBeforeClick) {
        // Verifica se o clique foi fora do componente
        const clickedInside = this.elementRef.nativeElement.contains(target);

        // Verifica se o clique foi em um elemento do Ionic que pode estar fora do DOM
        const isIonicElement = target.closest('ion-button') ||
                               target.closest('ion-range') ||
                               target.closest('ion-icon') ||
                               target.tagName?.toLowerCase().startsWith('ion-');

        console.log('Document click - wasExpandedBeforeClick:', wasExpandedBeforeClick, 'clickedInside:', clickedInside, 'isIonicElement:', isIonicElement, 'target:', target.tagName, 'class:', target.className);

        // Só minimiza se realmente clicou fora do player e não em elementos do Ionic
        if (!clickedInside && !isIonicElement) {
          console.log('Auto-minimizing player');
          this.minimizePlayerAuto();
        } else {
          console.log('Clicked inside player or on Ionic element, not minimizing');
        }
      }
    }, 10);
  }

  private minimizePlayer() {
    this.isMinimized = true;
    this.isAutoMinimized = false;
  }

  private minimizePlayerAuto() {
    console.log('minimizePlayerAuto called');
    this.isAutoMinimized = true;
    this.isMinimized = true;

    // Remove a classe de animação após a animação terminar
    setTimeout(() => {
      this.isAutoMinimized = false;
      console.log('auto-minimized flag reset');
    }, 400);
  }
}
