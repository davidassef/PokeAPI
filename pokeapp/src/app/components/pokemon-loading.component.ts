// 🎮 Pokemon Loading Component
// Loading states temáticos e animados para melhor UX

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export interface LoadingConfig {
  type: 'pokeball' | 'pikachu' | 'loading' | 'search' | 'favorite';
  message?: string;
  subMessage?: string;
  showProgress?: boolean;
  progress?: number;
}

@Component({
  selector: 'app-pokemon-loading',
  templateUrl: './pokemon-loading.component.html',
  styleUrls: ['./pokemon-loading.component.scss'],
  imports: [CommonModule, IonicModule],
  standalone: true,
})
export class PokemonLoadingComponent implements OnInit {
  @Input() config: LoadingConfig = { type: 'pokeball' };
  @Input() isVisible: boolean = true;

  // Frases motivacionais para loading
  private loadingPhrases = [
    'Explorando o mundo Pokémon...',
    'Procurando Pokémon selvagens...',
    'Consultando a Pokédex...',
    'Preparando sua aventura...',
    'Carregando dados dos Pokémon...',
    'Sincronizando com o Professor Oak...',
    'Atualizando a Pokédex Nacional...',
    'Conectando com o Centro Pokémon...',
  ];

  currentPhrase = '';
  showSecondaryAnimation = false;

  constructor() {}

  ngOnInit() {
    this.setRandomPhrase();
    this.startSecondaryAnimation();
  }

  private setRandomPhrase() {
    if (!this.config.message) {
      const randomIndex = Math.floor(Math.random() * this.loadingPhrases.length);
      this.currentPhrase = this.loadingPhrases[randomIndex];
    } else {
      this.currentPhrase = this.config.message;
    }
  }

  private startSecondaryAnimation() {
    setTimeout(() => {
      this.showSecondaryAnimation = true;
    }, 1000);
  }

  getLoadingIcon(): string {
    switch (this.config.type) {
      case 'search':
        return 'search-outline';
      case 'favorite':
        return 'heart-outline';
      case 'loading':
      default:
        return 'refresh-outline';
    }
  }

  getAnimationClass(): string {
    return `loading-${this.config.type}`;
  }
}
