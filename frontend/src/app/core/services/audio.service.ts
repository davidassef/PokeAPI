import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SettingsService } from './settings.service';

export interface AudioTrack {
  id: string;
  name: string;
  path: string;
  duration?: number;
  artist?: string;
}

export interface AudioState {
  isPlaying: boolean;
  currentTrack: AudioTrack | null;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audio: HTMLAudioElement | null = null;
  private audioStateSubject = new BehaviorSubject<AudioState>({
    isPlaying: false,
    currentTrack: null,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isLoading: false
  });

  public audioState$ = this.audioStateSubject.asObservable();

  // Lista de faixas disponíveis
  private tracks: AudioTrack[] = [
    { id: 'pallet-town', name: 'Pallet Town', path: '/assets/audio/pallet-town.mp3', artist: 'Game Freak' },
    { id: 'pokemon-center', name: 'Pokémon Center', path: '/assets/audio/pokemon-center.mp3', artist: 'Game Freak' },
    { id: 'route-1', name: 'Route 1', path: '/assets/audio/route-1.mp3', artist: 'Game Freak' },
    { id: 'battle-wild', name: 'Wild Pokémon Battle', path: '/assets/audio/battle-wild.mp3', artist: 'Game Freak' },
    { id: 'battle-trainer', name: 'Trainer Battle', path: '/assets/audio/battle-trainer.mp3', artist: 'Game Freak' }
  ];

  constructor(private settingsService: SettingsService) {
    this.initializeAudio();
  }

  private initializeAudio(): void {
    this.settingsService.settings$.subscribe(settings => {
      const currentState = this.audioStateSubject.value;
      this.audioStateSubject.next({
        ...currentState,
        volume: settings.musicVolume || 0.7
      });

      if (this.audio) {
        this.audio.volume = settings.musicVolume || 0.7;
      }
    });
  }

  async loadTrack(trackId: string): Promise<void> {
    const track = this.tracks.find(t => t.id === trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    this.updateState({ isLoading: true });

    try {
      if (this.audio) {
        this.audio.pause();
        this.audio.removeEventListener('loadedmetadata', this.onLoadedMetadata);
        this.audio.removeEventListener('timeupdate', this.onTimeUpdate);
        this.audio.removeEventListener('ended', this.onEnded);
      }

      this.audio = new Audio(track.path);
      this.audio.volume = this.audioStateSubject.value.volume;

      this.audio.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this));
      this.audio.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
      this.audio.addEventListener('ended', this.onEnded.bind(this));
      this.audio.addEventListener('error', this.onError.bind(this));

      await this.audio.load();

      this.updateState({
        currentTrack: track,
        isLoading: false,
        currentTime: 0
      });

    } catch (error) {
      console.error('Erro ao carregar áudio:', error);
      this.updateState({ isLoading: false });
      throw error;
    }
  }

  async play(): Promise<void> {
    const settings = this.settingsService.getCurrentSettings();
    if (!settings.musicEnabled || !this.audio) {
      return;
    }

    try {
      await this.audio.play();
      this.updateState({ isPlaying: true });
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      throw error;
    }
  }

  pause(): void {
    if (this.audio) {
      this.audio.pause();
      this.updateState({ isPlaying: false });
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.updateState({ isPlaying: false, currentTime: 0 });
    }
  }

  async togglePlayPause(): Promise<void> {
    const currentState = this.audioStateSubject.value;
    if (currentState.isPlaying) {
      this.pause();
    } else {
      await this.play();
    }
  }

  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = clampedVolume;
    }
    this.updateState({ volume: clampedVolume });

    // Salvar volume nas configurações
    this.settingsService.saveSettings({ musicVolume: clampedVolume });
  }

  seek(time: number): void {
    if (this.audio) {
      this.audio.currentTime = time;
      this.updateState({ currentTime: time });
    }
  }

  async playSound(soundPath: string): Promise<void> {
    const settings = this.settingsService.getCurrentSettings();
    if (!settings.soundEnabled) {
      return;
    }

    try {
      const soundAudio = new Audio(soundPath);
      soundAudio.volume = settings.musicVolume || 0.7;
      await soundAudio.play();
    } catch (error) {
      console.error('Erro ao reproduzir som:', error);
    }
  }

  getAvailableTracks(): AudioTrack[] {
    return [...this.tracks];
  }

  getCurrentState(): AudioState {
    return this.audioStateSubject.value;
  }

  private onLoadedMetadata(): void {
    if (this.audio) {
      this.updateState({ duration: this.audio.duration });
    }
  }

  private onTimeUpdate(): void {
    if (this.audio) {
      this.updateState({ currentTime: this.audio.currentTime });
    }
  }

  private onEnded(): void {
    this.updateState({ isPlaying: false, currentTime: 0 });

    // Auto-play próxima faixa se habilitado
    const settings = this.settingsService.getCurrentSettings();
    if (settings.autoPlayMusic) {
      this.playNextTrack();
    }
  }

  private onError(event: Event): void {
    console.error('Erro de áudio:', event);
    this.updateState({ isPlaying: false, isLoading: false });
  }

  private async playNextTrack(): Promise<void> {
    const currentTrack = this.audioStateSubject.value.currentTrack;
    if (!currentTrack) return;

    const currentIndex = this.tracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % this.tracks.length;
    const nextTrack = this.tracks[nextIndex];

    try {
      await this.loadTrack(nextTrack.id);
      await this.play();
    } catch (error) {
      console.error('Erro ao reproduzir próxima faixa:', error);
    }
  }

  private updateState(updates: Partial<AudioState>): void {
    const currentState = this.audioStateSubject.value;
    this.audioStateSubject.next({ ...currentState, ...updates });
  }

  destroy(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.removeEventListener('loadedmetadata', this.onLoadedMetadata);
      this.audio.removeEventListener('timeupdate', this.onTimeUpdate);
      this.audio.removeEventListener('ended', this.onEnded);
      this.audio.removeEventListener('error', this.onError);
      this.audio = null;
    }
  }
}
