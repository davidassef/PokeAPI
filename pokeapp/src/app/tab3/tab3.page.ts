import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonRange,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  ToastController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  languageOutline,
  musicalNotesOutline,
  volumeHighOutline,
  volumeMuteOutline,
  volumeLowOutline,
  playOutline,
  pauseOutline,
  playSkipBackOutline,
  radioOutline,
  pauseCircleOutline,
  informationCircleOutline
} from 'ionicons/icons';

import { SharedHeaderComponent } from '../components/shared-header.component';
import { LocalizationService } from '../services/localization.service';
import { AudioService } from '../services/audio.service';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [
    IonContent,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonRange,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    SharedHeaderComponent,
    CommonModule,
    FormsModule,
    TranslatePipe
  ],
})
export class Tab3Page implements OnInit, OnDestroy {
  currentLanguage = 'pt';
  audioEnabled = true;
  audioVolume = 0.5;
  isPlaying = false;
  isMuted = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private localizationService: LocalizationService,
    private audioService: AudioService,
    private toastController: ToastController
  ) {
    addIcons({
      languageOutline,
      musicalNotesOutline,
      volumeHighOutline,
      volumeMuteOutline,
      volumeLowOutline,
      playOutline,
      pauseOutline,
      playSkipBackOutline,
      radioOutline,
      pauseCircleOutline,
      informationCircleOutline
    });
  }

  ngOnInit() {
    // Inscreve-se nos observables
    this.subscriptions.push(
      this.localizationService.currentLanguage$.subscribe(lang => {
        this.currentLanguage = lang;
      })
    );

    this.subscriptions.push(
      this.audioService.isEnabled$.subscribe(enabled => {
        this.audioEnabled = enabled;
      })
    );

    this.subscriptions.push(
      this.audioService.volume$.subscribe(volume => {
        this.audioVolume = volume;
      })
    );

    this.subscriptions.push(
      this.audioService.isPlaying$.subscribe(playing => {
        this.isPlaying = playing;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onLanguageChange(event: any) {
    const newLanguage = event.detail.value;
    this.localizationService.setLanguage(newLanguage);
    this.showToast('success.languageChanged');
  }

  onAudioToggle(event: any) {
    const enabled = event.detail.checked;
    this.audioService.setEnabled(enabled);
    this.showToast('success.audioToggled');
  }

  onVolumeChange(event: any) {
    const volume = event.detail.value / 100;
    this.audioVolume = volume;
    if (!this.isMuted) {
      this.audioService.setVolume(volume);
    }
  }

  togglePlayPause() {
    this.audioService.toggle();
  }

  restartMusic() {
    this.audioService.restart();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.audioService.setVolume(0);
    } else {
      this.audioService.setVolume(this.audioVolume);
    }
  }

  private async showToast(messageKey: string) {
    const message = this.localizationService.translate(messageKey);
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    toast.present();
  }

  getLanguageDisplayName(language: string): string {
    const names: { [key: string]: string } = {
      'pt': 'Português',
      'en': 'English',
      'es': 'Español'
    };
    return names[language] || language;
  }
}
