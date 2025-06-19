import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LocalizationService } from './localization.service';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audio: HTMLAudioElement | null = null;
  private isEnabledSubject = new BehaviorSubject<boolean>(true);
  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  private volumeSubject = new BehaviorSubject<number>(0.5);

  public isEnabled$ = this.isEnabledSubject.asObservable();
  public isPlaying$ = this.isPlayingSubject.asObservable();
  public volume$ = this.volumeSubject.asObservable();

  // Mapeamento de idiomas para URLs de música
  private audioTracks: { [key: string]: string } = {
    'pt': 'https://www.soundjay.com/misc/sounds/pokemon-theme.mp3', // Placeholder - substitua por URLs reais
    'en': 'https://www.soundjay.com/misc/sounds/pokemon-theme-en.mp3',
    'es': 'https://www.soundjay.com/misc/sounds/pokemon-theme-es.mp3',
  };

  constructor(private localizationService: LocalizationService) {
    this.loadSettings();
    this.setupLanguageChangeListener();
  }

  private loadSettings(): void {
    // Carrega configurações do localStorage
    const savedEnabled = localStorage.getItem('audioEnabled');
    const savedVolume = localStorage.getItem('audioVolume');

    if (savedEnabled !== null) {
      this.isEnabledSubject.next(JSON.parse(savedEnabled));
    }

    if (savedVolume !== null) {
      this.volumeSubject.next(parseFloat(savedVolume));
    }
  }

  private setupLanguageChangeListener(): void {
    // Escuta mudanças de idioma para trocar a música
    this.localizationService.currentLanguage$.subscribe(language => {
      this.loadAudioForLanguage(language);
    });
  }
  private loadAudioForLanguage(language: string): void {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }

    // Cria novo elemento de áudio
    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.volume = this.volumeSubject.value;

    // Mapeia idiomas para arquivos de áudio reais
    let audioFile = '';
    switch (language) {
      case 'pt':
        audioFile = 'Pokémon - INTRO BR.mp3';
        break;
      case 'en':
        audioFile = 'Pokémon INTRO EN.mp3';
        break;
      case 'es':
        audioFile = 'Pokémon - INTRO ES.mp3';
        break;
      default:
        audioFile = 'Pokémon INTRO EN.mp3';
    }

    this.audio.src = `assets/audio/${audioFile}`;

    // Event listeners
    this.audio.addEventListener('loadeddata', () => {
      if (this.isEnabledSubject.value) {
        this.play();
      }
    });

    this.audio.addEventListener('play', () => {
      this.isPlayingSubject.next(true);
    });

    this.audio.addEventListener('pause', () => {
      this.isPlayingSubject.next(false);
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Audio loading failed:', e);
      // Fallback para arquivo inglês se não conseguir carregar
      if (this.audio && !this.audio.src.includes('EN.mp3')) {
        this.audio.src = 'assets/audio/Pokémon INTRO EN.mp3';
      }
    });

    // Tenta carregar o áudio
    this.audio.load();
  }

  /**
   * Pausa o áudio
   */
  public pause(): void {
    if (this.audio) {
      this.audio.pause();
      this.isPlayingSubject.next(false);
    }
  }

  /**
   * Retoma/inicia a reprodução
   */
  public play(): void {
    if (this.audio && this.isEnabledSubject.value) {
      this.audio.play().catch(error => {
        console.warn('Erro ao reproduzir áudio:', error);
      });
    }
  }

  /**
   * Alterna entre play/pause
   */
  public toggle(): void {
    if (this.isPlayingSubject.value) {
      this.pause();
    } else {
      this.play();
    }
  }

  public restart(): void {
    if (this.audio) {
      this.audio.currentTime = 0;
      if (this.isEnabledSubject.value) {
        this.play();
      }
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabledSubject.next(enabled);
    localStorage.setItem('audioEnabled', JSON.stringify(enabled));

    if (enabled) {
      this.play();
    } else {
      this.pause();
    }
  }

  public setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.volumeSubject.next(clampedVolume);
    localStorage.setItem('audioVolume', clampedVolume.toString());

    if (this.audio) {
      this.audio.volume = clampedVolume;
    }
  }

  public getCurrentVolume(): number {
    return this.volumeSubject.value;
  }

  public isEnabled(): boolean {
    return this.isEnabledSubject.value;
  }

  public isPlaying(): boolean {
    return this.isPlayingSubject.value;
  }
}
