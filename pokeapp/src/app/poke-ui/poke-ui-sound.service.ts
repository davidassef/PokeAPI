/**
 * Serviço responsável pela reprodução de efeitos sonoros em microinterações.
 * Gerencia sons para diferentes ações como captura, favoritos, modais e erros.
 */
import { Injectable } from '@angular/core';

export type SoundType = 'catch' | 'favorite' | 'modal' | 'error';

@Injectable({ providedIn: 'root' })
export class PokeUiSoundService {

  /**
   * Reproduz um efeito sonoro específico com base no tipo fornecido.
   * @param sound Tipo de som a ser reproduzido ('catch', 'favorite', 'modal', 'error')
   */
  play(sound: SoundType): void {
    const sounds: Record<SoundType, string> = {
      catch: 'assets/sounds/catch.mp3',
      favorite: 'assets/sounds/favorite.mp3',
      modal: 'assets/sounds/modal.mp3',
      error: 'assets/sounds/error.mp3',
    };

    try {
      const audio = new Audio(sounds[sound]);
      audio.volume = 0.25;
      audio.play().catch(error => {
        console.warn('Erro ao reproduzir som:', error);
      });
    } catch (error) {
      console.warn('Erro ao criar áudio:', error);
    }
  }
}
