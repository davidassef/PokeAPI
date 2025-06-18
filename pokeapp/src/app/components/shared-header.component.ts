import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { LocalizationService } from '../services/localization.service';
import { FavoritesService } from '../services/favorites.service';
import { AudioService } from '../services/audio.service';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-shared-header',
  templateUrl: './shared-header.component.html',
  styleUrls: ['./shared-header.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, TranslatePipe]
})
export class SharedHeaderComponent implements OnInit, OnDestroy {
  @Input() title: string = 'PokéDex';
  @Input() subtitle?: string = 'Explore & Discover';
  @Input() currentPage: 'home' | 'favorites' | 'settings' | 'details' = 'home';
  @Input() showBackButton: boolean = false;
  currentLanguage = 'pt';  isAudioEnabled = false;
  isAudioPlaying = false;
  isMuted = false;
  currentVolume = 0.5;
  audioVolume = 50; // Volume em porcentagem (0-100)

  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private localizationService: LocalizationService,
    private favoritesService: FavoritesService,
    private audioService: AudioService
  ) {
    this.currentLanguage = this.localizationService.getCurrentLanguage();
  }
  ngOnInit() {
    // Subscribe to audio state changes
    this.subscriptions.add(
      this.audioService.isEnabled$.subscribe(enabled => {
        this.isAudioEnabled = enabled;
      })
    );

    this.subscriptions.add(
      this.audioService.isPlaying$.subscribe(playing => {
        this.isAudioPlaying = playing;
      })
    );

    this.subscriptions.add(
      this.audioService.volume$.subscribe(volume => {
        this.currentVolume = volume;
        this.isMuted = volume === 0;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /**
   * Navega para a página especificada
   */
  navigateTo(page: string): void {
    switch (page) {
      case 'home':
        this.router.navigate(['/tabs/tab1']);
        break;
      case 'favorites':
        this.router.navigate(['/tabs/tab2']);
        break;
      case 'settings':
        this.router.navigate(['/tabs/tab3']);
        break;
    }
  }

  /**
   * Volta para página anterior
   */
  goBack(): void {
    this.router.navigate(['/tabs/tab1']);
  }
  /**
   * Alterna idioma da aplicação
   */
  toggleLanguage(): void {
    const languages = ['pt', 'en', 'es'];
    const currentIndex = languages.indexOf(this.currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    this.currentLanguage = languages[nextIndex];
    this.localizationService.setLanguage(this.currentLanguage);
  }
  /**
   * Alterna reprodução de áudio
   */
  toggleAudio(): void {
    this.audioService.toggle();
  }

  /**
   * Alterna play/pause do áudio
   */
  togglePlayPause(): void {
    if (this.isAudioPlaying) {
      this.audioService.pause();
    } else {
      this.audioService.play();
    }
  }

  /**
   * Alterna mute do áudio
   */
  toggleMute(): void {
    if (this.isMuted) {
      this.audioService.setVolume(this.currentVolume > 0 ? this.currentVolume : 0.5);
    } else {
      this.audioService.setVolume(0);
    }
  }  /**
   * Define o volume do áudio via slider
   */
  setVolume(event: any): void {
    const volume = event.detail.value / 100; // Converte de 0-100 para 0-1
    this.audioVolume = event.detail.value;
    this.currentVolume = volume;
    this.audioService.setVolume(volume);
  }

  /**
   * Aumenta o volume em 10%
   */
  increaseVolume(): void {
    const newVolume = Math.min(this.audioVolume + 10, 100);
    this.audioVolume = newVolume;
    this.currentVolume = newVolume / 100;
    this.audioService.setVolume(this.currentVolume);
  }

  /**
   * Diminui o volume em 10%
   */
  decreaseVolume(): void {
    const newVolume = Math.max(this.audioVolume - 10, 0);
    this.audioVolume = newVolume;
    this.currentVolume = newVolume / 100;
    this.audioService.setVolume(this.currentVolume);
  }

  /**
   * Reinicia o áudio
   */
  restartAudio(): void {
    this.audioService.restart();
  }

  /**
   * Retorna ícone apropriado para mute
   */
  getMuteIcon(): string {
    if (this.isMuted) {
      return 'volume-mute-outline';
    } else if (this.currentVolume > 0.5) {
      return 'volume-high-outline';
    } else {
      return 'volume-low-outline';
    }
  }

  /**
   * Obtém quantidade de favoritos
   */
  getFavoritesCount(): number {
    return this.favoritesService.getFavoritesCount();
  }

  /**
   * Rola para o topo da página
   */
  scrollToTop(): void {
    const content = document.querySelector('ion-content');
    if (content) {
      content.scrollToTop(500);
    }
  }
}
