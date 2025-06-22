import { Component, OnInit, OnDestroy } from '@angular/core';
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

  // Sample tracks - in real app these would come from a service
  playlist: Track[] = [
    {
      id: 'route1',
      title: 'Route 1',
      artist: 'Pokémon Red/Blue',
      url: 'assets/audio/route1.mp3'
    },
    {
      id: 'pallettown',
      title: 'Pallet Town',
      artist: 'Pokémon Red/Blue',
      url: 'assets/audio/pallettown.mp3'
    },
    {
      id: 'pokemoncenter',
      title: 'Pokémon Center',
      artist: 'Pokémon Red/Blue',
      url: 'assets/audio/pokemoncenter.mp3'
    },
    {
      id: 'wildpokemon',
      title: 'Wild Pokémon Battle',
      artist: 'Pokémon Red/Blue',
      url: 'assets/audio/wildpokemon.mp3'
    }
  ];

  private destroy$ = new Subject<void>();
  private audio?: HTMLAudioElement;

  constructor(
    private audioService: AudioService,
    private settingsService: SettingsService
  ) {}

  ngOnInit() {
    this.loadSettings();
    this.setupAudioService();
    this.initializePlayer();
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

  private initializePlayer() {
    // Load first track by default
    if (this.playlist.length > 0) {
      this.loadTrack(this.playlist[0]);
    }
  }

  private loadTrack(track: Track) {
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
    this.audioService.setVolume(this.volume);
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

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
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
}
