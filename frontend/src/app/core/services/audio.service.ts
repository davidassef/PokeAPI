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
    volume: 0.5,
    isLoading: false
  });

  public audioState$ = this.audioStateSubject.asObservable();

  // Lista de faixas disponíveis
  private tracks: AudioTrack[] = [
    { id: 'opening-jp', name: 'Pokémon Theme (JP)', path: '/assets/audio/Opening JP.mp3', artist: 'Pokémon Japan' },
    { id: 'opening-en', name: 'Pokémon Theme (EN)', path: '/assets/audio/Opening EN.mp3', artist: 'Pokémon English' },
    { id: 'opening-es', name: 'Apertura Pokémon (ES)', path: '/assets/audio/Opening ES.mp3', artist: 'Pokémon España' },
    { id: 'opening-br', name: 'Abertura Pokémon (BR)', path: '/assets/audio/Opening BR.mp3', artist: 'Pokémon Brasil' }
  ];

  constructor(private settingsService: SettingsService) {
    this.initializeAudio();
  }

  private initializeAudio(): void {
    this.settingsService.settings$.subscribe(settings => {
      const currentState = this.audioStateSubject.value;
      this.audioStateSubject.next({
        ...currentState,
        volume: settings.musicVolume || 0.5
      });

      if (this.audio) {
        this.audio.volume = settings.musicVolume || 0.5;
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

  setVolume(volume: number, saveToSettings: boolean = false): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = clampedVolume;
    }
    this.updateState({ volume: clampedVolume });

    // Só salvar nas configurações se explicitamente solicitado
    if (saveToSettings) {
      this.settingsService.saveSettings({ musicVolume: clampedVolume });
    }
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
      // Garantir que o caminho seja um arquivo de áudio válido
      let fullPath: string;

      // Se o caminho já começa com /assets/, usar como está
      if (soundPath.startsWith('/assets/')) {
        fullPath = soundPath;
      } else {
        // Caso contrário, assumir que é um nome de arquivo e adicionar o caminho base
        fullPath = `/assets/audio/${soundPath}.wav`;
      }

      // Tentar carregar o arquivo específico
      const soundAudio = new Audio(fullPath);
      soundAudio.volume = settings.musicVolume || 0.5;

      // Adicionar listener de erro para fallback
      soundAudio.addEventListener('error', async () => {
        console.warn(`Arquivo de áudio não encontrado: ${fullPath}, usando fallback`);
        // Usar um som existente como fallback ou beep
        try {
          await this.playBeep(800, 100); // Beep simples como fallback
        } catch (beepError) {
          console.error('Erro ao reproduzir beep de fallback:', beepError);
        }
      });

      await soundAudio.play();
    } catch (error) {
      console.error('Erro ao reproduzir som:', error);
      // Fallback para beep em caso de erro
      try {
        await this.playBeep(800, 100);
      } catch (beepError) {
        console.error('Erro ao reproduzir beep de fallback:', beepError);
      }
    }
  }

  /**
   * Reproduz som de captura ou descaptura
   * @param action 'capture' para capturar, 'release' para soltar
   */
  async playCaptureSound(action: 'capture' | 'release'): Promise<void> {
    const settings = this.settingsService.getCurrentSettings();
    if (!settings.soundEnabled) {
      return;
    }

    try {
      // Usar sons padrão do sistema ou sons existentes
      let soundPath: string;

      if (action === 'capture') {
        // Som de captura - usar um som curto e agradável
        soundPath = '/assets/audio/capture.mp3'; // Se existir
        // Fallback para som padrão do navegador
        if (!this.fileExists(soundPath)) {
          // Usar um beep simples ou som de sucesso
          await this.playBeep(800, 100); // Frequência 800Hz por 100ms
          return;
        }
      } else {
        // Som de descaptura
        soundPath = '/assets/audio/release.mp3'; // Se existir
        if (!this.fileExists(soundPath)) {
          // Usar um beep simples ou som de remoção
          await this.playBeep(400, 100); // Frequência 400Hz por 100ms
          return;
        }
      }

      const soundAudio = new Audio(soundPath);
      soundAudio.volume = (settings.soundVolume || 0.5) * 0.3; // Volume menor para sons de efeito
      await soundAudio.play();
    } catch (error) {
      console.error('Erro ao reproduzir som de captura:', error);
      // Fallback para beep
      try {
        await this.playBeep(action === 'capture' ? 800 : 400, 100);
      } catch (beepError) {
        console.error('Erro ao reproduzir beep de fallback:', beepError);
      }
    }
  }

  /**
   * Reproduz um beep simples usando Web Audio API
   */
  private async playBeep(frequency: number, duration: number): Promise<void> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.error('Erro ao reproduzir beep:', error);
    }
  }

  /**
   * Verifica se um arquivo existe (método simples)
   */
  private fileExists(url: string): boolean {
    // Método simples - na prática, você pode implementar uma verificação mais robusta
    // Por enquanto, vamos assumir que os arquivos não existem e usar o fallback
    return false;
  }

  getAvailableTracks(): AudioTrack[] {
    return [...this.tracks];
  }

  getOpeningTracks(): AudioTrack[] {
    return this.tracks.filter(track => track.id.startsWith('opening-'));
  }

  getDefaultTrackForLanguage(language: string): AudioTrack | null {
    const langMap: { [key: string]: string } = {
      'pt-BR': 'opening-br',
      'en-US': 'opening-en',
      'es-ES': 'opening-es',
      'ja-JP': 'opening-jp'
    };

    const trackId = langMap[language] || 'opening-br'; // Default to BR
    return this.tracks.find(track => track.id === trackId) || null;
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
