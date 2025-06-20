import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LocalizationService } from '../services/localization.service';
import { AudioService } from '../services/audio.service';
import { TranslatePipe } from '../pipes/translate.pipe';

/**
 * Página de configurações do aplicativo Pokémon.
 * Permite ao usuário personalizar preferências globais como idioma e áudio.
 */
@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslatePipe,
  ],
})
export class Tab3Page implements OnInit {

  /**
   * Idioma atualmente selecionado.
   */
  currentLanguage = 'pt';

  /**
   * Indica se o áudio está habilitado.
   */
  audioEnabled = true;

  /**
   * Volume do áudio (0 a 1).
   */
  audioVolume = 0.5;

  /**
   * Lista de idiomas disponíveis.
   */
  availableLanguages = [
    { code: 'pt', name: 'Português' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
  ];

  /**
   * Construtor da página de configurações.
   */
  constructor(
    private localizationService: LocalizationService,
    private audioService: AudioService
  ) {}

  /**
   * Método de inicialização do componente.
   */
  ngOnInit(): void {
    this.loadCurrentSettings();
  }

  /**
   * Carrega configurações atuais dos serviços.
   */
  private loadCurrentSettings(): void {
    this.localizationService.currentLanguage$.subscribe(language => {
      this.currentLanguage = language;
    });

    this.audioService.isEnabled$.subscribe(enabled => {
      this.audioEnabled = enabled;
    });

    this.audioService.volume$.subscribe(volume => {
      this.audioVolume = volume;
    });
  }

  /**
   * Altera o idioma da aplicação.
   */
  onLanguageChange(event: any): void {
    const newLanguage = event.detail.value;
    this.localizationService.setLanguage(newLanguage);
  }

  /**
   * Altera o estado do áudio.
   */
  onAudioToggle(event: any): void {
    const enabled = event.detail.checked;
    this.audioService.setEnabled(enabled);
  }

  /**
   * Altera o volume do áudio.
   */
  onVolumeChange(event: any): void {
    const volume = event.detail.value / 100;
    this.audioService.setVolume(volume);
  }

}
