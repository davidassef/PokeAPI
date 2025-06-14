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
  @Input() currentPage: 'home' | 'favorites' | 'settings' = 'home';
  @Input() showBackButton: boolean = false;

  currentLanguage = 'pt';
  isAudioEnabled = false;
  isAudioPlaying = false;

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
