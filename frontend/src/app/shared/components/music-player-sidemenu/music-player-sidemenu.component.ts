import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { AudioService } from '../../../core/services/audio.service';
import { SettingsService } from '../../../core/services/settings.service';

interface Track {
  id: string;
  title: string;
  artist: string;
  src: string;
  language: string;
}

@Component({
  selector: 'app-music-player-sidemenu',
  templateUrl: './music-player-sidemenu.component.html',
  styleUrls: ['./music-player-sidemenu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MusicPlayerSidemenuComponent implements OnInit, OnDestroy {
  // Estado principal do player
  currentTrack: Track | null = null;
  isPlaying = false;
  isMuted = false;
  volume = 0.5;
  currentTime = 0;
  duration = 0;
  isLoading = false;

  // Playlist e configurações
  playlist: Track[] = [];
  defaultTrackForLanguage: Track | null = null;

  // Controles internos
  private destroy$ = new Subject<void>();

  constructor(
    private audioService: AudioService,
    private settingsService: SettingsService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.initializeComponent();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent() {
    this.loadPlaylist();
    this.loadSettings();
    this.setupAudioService();
  }

  private loadPlaylist() {
    this.playlist = [
      {
        id: 'opening-br',
        title: 'Pokémon Opening (BR)',
        artist: 'Pokémon',
        src: 'assets/audio/Opening BR.mp3',
        language: 'pt-BR'
      },
      {
        id: 'opening-en',
        title: 'Pokémon Opening (EN)',
        artist: 'Pokémon',
        src: 'assets/audio/Opening EN.mp3',
        language: 'en-US'
      },
      {
        id: 'opening-es',
        title: 'Pokémon Opening (ES)',
        artist: 'Pokémon',
        src: 'assets/audio/Opening ES.mp3',
        language: 'es-ES'
      }
    ];

    // Definir faixa padrão baseada no idioma atual
    this.setDefaultTrackForLanguage();
  }

  private setDefaultTrackForLanguage() {
    const currentLang = this.translate.currentLang || 'pt-BR';
    this.defaultTrackForLanguage = this.playlist.find(track => track.language === currentLang) || this.playlist[0];
    // Sempre definir a faixa principal como selecionada e carregada
    this.currentTrack = this.defaultTrackForLanguage;
    if (this.currentTrack) {
      this.audioService.loadTrack(this.currentTrack.id);
    }
  }

  private loadSettings() {
    this.settingsService.settings$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(100)
      )
      .subscribe(settings => {
        const newVolume = settings.musicEnabled ? (settings.musicVolume || 0.7) : 0;
        const newMuted = !settings.musicEnabled;

        if (this.volume !== newVolume || this.isMuted !== newMuted) {
          this.volume = newVolume;
          this.isMuted = newMuted;

          if (settings.musicEnabled) {
            this.audioService.setVolume(newVolume);
          }
        }
      });
  }

  private setupAudioService() {
    this.audioService.audioState$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(50)
      )
      .subscribe(state => {
        this.isPlaying = state.isPlaying;
        this.volume = state.volume;
        this.currentTime = state.currentTime;
        this.duration = state.duration;
        this.isLoading = state.isLoading;

        // Atualizar faixa atual se necessário
        if (state.currentTrack && (!this.currentTrack || this.currentTrack.id !== state.currentTrack?.id)) {
          this.currentTrack = this.playlist.find(track => track.id === state.currentTrack?.id) || null;
        }

        this.cdr.markForCheck();
      });
  }

  // ===== CONTROLE DO PLAYER =====

  async togglePlay() {
    if (!this.currentTrack) {
      // Se não houver faixa, carregar a principal
      this.currentTrack = this.defaultTrackForLanguage;
      if (this.currentTrack) {
        await this.audioService.loadTrack(this.currentTrack.id);
      }
    }
    try {
      await this.audioService.togglePlayPause();
    } catch (error) {
      console.error('MusicPlayerSidemenu: Erro no toggle play:', error);
    }
  }

  async playNext() {
    if (!this.currentTrack) return;
    const currentIndex = this.playlist.findIndex(track => track.id === this.currentTrack?.id);
    const nextIndex = (currentIndex + 1) % this.playlist.length;
    const nextTrack = this.playlist[nextIndex];
    try {
      await this.audioService.loadTrack(nextTrack.id);
      await this.audioService.play();
      this.currentTrack = nextTrack;
    } catch (error) {
      console.error('MusicPlayerSidemenu: Erro ao avançar faixa:', error);
    }
  }

  async playPrevious() {
    if (!this.currentTrack) return;
    const currentIndex = this.playlist.findIndex(track => track.id === this.currentTrack?.id);
    const prevIndex = (currentIndex - 1 + this.playlist.length) % this.playlist.length;
    const prevTrack = this.playlist[prevIndex];
    try {
      await this.audioService.loadTrack(prevTrack.id);
      await this.audioService.play();
      this.currentTrack = prevTrack;
    } catch (error) {
      console.error('MusicPlayerSidemenu: Erro ao retroceder faixa:', error);
    }
  }

  async toggleMute() {
    // Se volume > 0, muta. Se mutado, volta para 0.7
    if (this.isMuted || this.volume === 0) {
      this.setVolume({ detail: { value: 70 } });
    } else {
      this.setVolume({ detail: { value: 0 } });
    }
  }

  async setVolume(event: any) {
    const newVolume = event.detail.value / 100;
    try {
      await this.audioService.setVolume(newVolume);
    } catch (error) {
      console.error('MusicPlayerSidemenu: Erro ao definir volume:', error);
    }
  }

  async selectTrack(track: Track) {
    try {
      await this.audioService.loadTrack(track.id);
      await this.audioService.play();
      this.currentTrack = track;
    } catch (error) {
      console.error('MusicPlayerSidemenu: Erro ao selecionar faixa:', error);
    }
  }

  seek(event: any) {
    const value = event.detail.value;
    if (this.duration > 0) {
      const time = (value / 100) * this.duration;
      this.audioService.seek(time);
    }
  }

  // ===== UTILITÁRIOS =====

  getVolumeIcon(): string {
    if (this.isMuted || this.volume === 0) {
      return 'volume-mute-outline';
    } else if (this.volume < 0.3) {
      return 'volume-low-outline';
    } else if (this.volume < 0.7) {
      return 'volume-medium-outline';
    } else {
      return 'volume-high-outline';
    }
  }

  isDefaultTrack(track: Track): boolean {
    return track.id === this.defaultTrackForLanguage?.id;
  }

  getProgress(): number {
    if (this.duration === 0) return 0;
    return (this.currentTime / this.duration) * 100;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  get orderedPlaylist(): Track[] {
    // Colocar a faixa padrão primeiro
    const defaultTrack = this.defaultTrackForLanguage;
    const otherTracks = this.playlist.filter(track => track.id !== defaultTrack?.id);
    
    return defaultTrack ? [defaultTrack, ...otherTracks] : this.playlist;
  }
} 