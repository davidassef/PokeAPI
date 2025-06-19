import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-floating-audio-player',
  templateUrl: './floating-audio-player.component.html',
  styleUrls: ['./floating-audio-player.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class FloatingAudioPlayerComponent implements OnInit, OnDestroy {
  isAudioEnabled = false;
  isAudioPlaying = false;
  isMuted = false;
  currentVolume = 0.5;
  isMinimized = false;

  private subscriptions = new Subscription();

  constructor(private audioService: AudioService) {}

  ngOnInit() {
    // Subscribe to audio state changes
    this.subscriptions.add(
      this.audioService.isEnabled$.subscribe(enabled => {
        this.isAudioEnabled = enabled;
      }),
    );

    this.subscriptions.add(
      this.audioService.isPlaying$.subscribe(playing => {
        this.isAudioPlaying = playing;
      }),
    );

    this.subscriptions.add(
      this.audioService.volume$.subscribe(volume => {
        this.currentVolume = volume;
        this.isMuted = volume === 0;
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
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
  }

  /**
   * Reinicia o áudio
   */
  restartAudio(): void {
    this.audioService.restart();
  }

  /**
   * Alterna estado minimizado do player
   */
  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
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
}
