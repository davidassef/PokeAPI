import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ViewedPokemonService } from './viewed-pokemon.service';
import { CapturedService } from './captured.service';
import { AuthService } from './auth.service';

export interface TrainerLevel {
  level: number;
  title: string;
  currentXP: number;
  requiredXP: number;
  progressPercentage: number;
  nextLevelXP: number;
}

export interface TrainerStats {
  viewedCount: number;
  capturedCount: number;
  totalXP: number;
  level: TrainerLevel;
}

@Injectable({
  providedIn: 'root'
})
export class TrainerLevelService {
  // Configuração do sistema de XP
  private readonly XP_PER_VIEWED = 10;    // XP por Pokémon visualizado
  private readonly XP_PER_CAPTURED = 50;  // XP por Pokémon capturado
  private readonly BASE_XP_REQUIRED = 100; // XP base para o nível 1
  private readonly XP_MULTIPLIER = 1.5;   // Multiplicador de XP por nível

  // Títulos por nível
  private readonly LEVEL_TITLES = [
    'Novato',           // Nível 1-5
    'Treinador',        // Nível 6-10
    'Especialista',     // Nível 11-15
    'Veterano',         // Nível 16-20
    'Elite',            // Nível 21-25
    'Mestre',           // Nível 26-30
    'Campeão',          // Nível 31-35
    'Lenda',            // Nível 36-40
    'Mito',             // Nível 41-45
    'Deus Pokémon'      // Nível 46+
  ];

  private trainerStatsSubject = new BehaviorSubject<TrainerStats>({
    viewedCount: 0,
    capturedCount: 0,
    totalXP: 0,
    level: this.calculateLevel(0)
  });

  public trainerStats$ = this.trainerStatsSubject.asObservable();

  constructor(
    private viewedPokemonService: ViewedPokemonService,
    private capturedService: CapturedService,
    private authService: AuthService
  ) {
    this.setupStatsSubscription();
  }

  /**
   * Configura a subscription para atualizar automaticamente as estatísticas
   */
  private setupStatsSubscription(): void {
    // Combina os observables de Pokémon visualizados e capturados
    combineLatest([
      this.viewedPokemonService.viewedPokemon$,
      this.capturedService.getCaptured()
    ]).pipe(
      map(([viewedData, capturedList]) => {
        const viewedCount = viewedData.viewedPokemonIds.size;
        const capturedCount = capturedList.length;
        const totalXP = this.calculateTotalXP(viewedCount, capturedCount);
        const level = this.calculateLevel(totalXP);

        return {
          viewedCount,
          capturedCount,
          totalXP,
          level
        };
      })
    ).subscribe(stats => {
      this.trainerStatsSubject.next(stats);
    });
  }

  /**
   * Calcula o XP total baseado nas estatísticas
   */
  private calculateTotalXP(viewedCount: number, capturedCount: number): number {
    return (viewedCount * this.XP_PER_VIEWED) + (capturedCount * this.XP_PER_CAPTURED);
  }

  /**
   * Calcula o nível baseado no XP total
   */
  private calculateLevel(totalXP: number): TrainerLevel {
    let level = 1;
    let requiredXP = this.BASE_XP_REQUIRED;
    let accumulatedXP = 0;

    // Encontra o nível atual
    while (totalXP >= accumulatedXP + requiredXP) {
      accumulatedXP += requiredXP;
      level++;
      requiredXP = Math.floor(this.BASE_XP_REQUIRED * Math.pow(this.XP_MULTIPLIER, level - 1));
    }

    const currentXP = totalXP - accumulatedXP;
    const nextLevelXP = requiredXP;
    const progressPercentage = Math.round((currentXP / nextLevelXP) * 100);
    const title = this.getLevelTitle(level);

    return {
      level,
      title,
      currentXP,
      requiredXP: nextLevelXP,
      progressPercentage,
      nextLevelXP
    };
  }

  /**
   * Retorna o título baseado no nível
   */
  private getLevelTitle(level: number): string {
    const titleIndex = Math.min(Math.floor((level - 1) / 5), this.LEVEL_TITLES.length - 1);
    return this.LEVEL_TITLES[titleIndex];
  }

  /**
   * Retorna as estatísticas atuais do treinador
   */
  getCurrentStats(): TrainerStats {
    return this.trainerStatsSubject.value;
  }

  /**
   * Retorna apenas o nível atual
   */
  getCurrentLevel(): TrainerLevel {
    return this.trainerStatsSubject.value.level;
  }

  /**
   * Retorna informações detalhadas sobre o sistema de progressão
   */
  getProgressionInfo(): string {
    return `Ganhe XP visualizando (${this.XP_PER_VIEWED} XP) e capturando (${this.XP_PER_CAPTURED} XP) Pokémon para subir de nível!`;
  }

  /**
   * Retorna a descrição completa do nível atual
   */
  getLevelDescription(): string {
    const stats = this.getCurrentStats();
    const level = stats.level;
    
    return `Nível ${level.level} - ${level.title}\n${level.currentXP}/${level.requiredXP} XP (${level.progressPercentage}%)`;
  }

  /**
   * Calcula quantos Pokémon precisam ser capturados para o próximo nível
   */
  getPokemonNeededForNextLevel(): { viewed: number; captured: number } {
    const stats = this.getCurrentStats();
    const xpNeeded = stats.level.requiredXP - stats.level.currentXP;
    
    return {
      viewed: Math.ceil(xpNeeded / this.XP_PER_VIEWED),
      captured: Math.ceil(xpNeeded / this.XP_PER_CAPTURED)
    };
  }
}
