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

/**
 * ✅ CORREÇÃO CRÍTICA: Interface para histórico de XP persistente
 */
export interface XPHistory {
  userId: string;
  viewedPokemonXP: Set<number>; // IDs dos pokémons que já deram XP por visualização
  capturedPokemonXP: Set<number>; // IDs dos pokémons que já deram XP por captura
  totalAccumulatedXP: number; // XP total acumulado (nunca diminui)
  lastUpdated: string;
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

  // ✅ CORREÇÃO CRÍTICA: Chave para persistir histórico de XP
  private readonly XP_HISTORY_KEY = 'trainer_xp_history';

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

  // ✅ CORREÇÃO CRÍTICA: Histórico de XP persistente
  private xpHistory: XPHistory = {
    userId: '',
    viewedPokemonXP: new Set<number>(),
    capturedPokemonXP: new Set<number>(),
    totalAccumulatedXP: 0,
    lastUpdated: new Date().toISOString()
  };

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
    this.loadXPHistory();
    this.setupStatsSubscription();
    this.setupAuthStateListener();
  }

  /**
   * ✅ CORREÇÃO CRÍTICA: Configura subscription com sistema de XP persistente
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

        // ✅ CORREÇÃO: Atualizar XP baseado em histórico, não contagem atual
        this.updateXPFromCurrentData(viewedData.viewedPokemonIds, capturedList.map(c => c.pokemon_id));

        const totalXP = this.xpHistory.totalAccumulatedXP;
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
   * ✅ CORREÇÃO CRÍTICA: Carrega histórico de XP do localStorage
   */
  private loadXPHistory(): void {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        console.log('[TrainerLevelService] Usuário não autenticado, usando histórico vazio');
        return;
      }

      const storageKey = `${this.XP_HISTORY_KEY}_${currentUser.id}`;
      const storedHistory = localStorage.getItem(storageKey);

      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        this.xpHistory = {
          userId: parsedHistory.userId,
          viewedPokemonXP: new Set(parsedHistory.viewedPokemonXP || []),
          capturedPokemonXP: new Set(parsedHistory.capturedPokemonXP || []),
          totalAccumulatedXP: parsedHistory.totalAccumulatedXP || 0,
          lastUpdated: parsedHistory.lastUpdated || new Date().toISOString()
        };
        console.log(`[TrainerLevelService] ✅ Histórico carregado: ${this.xpHistory.totalAccumulatedXP} XP total`);
      } else {
        // Inicializa histórico para usuário atual
        this.xpHistory.userId = currentUser.id;
        this.saveXPHistory();
        console.log('[TrainerLevelService] Novo histórico criado para usuário:', currentUser.id);
      }
    } catch (error) {
      console.error('[TrainerLevelService] ❌ Erro ao carregar histórico de XP:', error);
      this.resetXPHistory();
    }
  }

  /**
   * ✅ CORREÇÃO CRÍTICA: Salva histórico de XP no localStorage
   */
  private saveXPHistory(): void {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return;

      const storageKey = `${this.XP_HISTORY_KEY}_${currentUser.id}`;
      const historyToSave = {
        userId: this.xpHistory.userId,
        viewedPokemonXP: Array.from(this.xpHistory.viewedPokemonXP),
        capturedPokemonXP: Array.from(this.xpHistory.capturedPokemonXP),
        totalAccumulatedXP: this.xpHistory.totalAccumulatedXP,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(storageKey, JSON.stringify(historyToSave));
      console.log(`[TrainerLevelService] 💾 Histórico salvo: ${this.xpHistory.totalAccumulatedXP} XP`);
    } catch (error) {
      console.error('[TrainerLevelService] ❌ Erro ao salvar histórico de XP:', error);
    }
  }

  /**
   * ✅ CORREÇÃO CRÍTICA: Atualiza XP baseado nos dados atuais (sem diminuir)
   */
  private updateXPFromCurrentData(viewedIds: Set<number>, capturedIds: number[]): void {
    let xpGained = 0;

    // Adiciona XP por pokémons visualizados (apenas novos)
    viewedIds.forEach(pokemonId => {
      if (!this.xpHistory.viewedPokemonXP.has(pokemonId)) {
        this.xpHistory.viewedPokemonXP.add(pokemonId);
        xpGained += this.XP_PER_VIEWED;
      }
    });

    // Adiciona XP por pokémons capturados (apenas novos)
    capturedIds.forEach(pokemonId => {
      if (!this.xpHistory.capturedPokemonXP.has(pokemonId)) {
        this.xpHistory.capturedPokemonXP.add(pokemonId);
        xpGained += this.XP_PER_CAPTURED;
      }
    });

    // ✅ CORREÇÃO: XP nunca diminui, apenas aumenta
    if (xpGained > 0) {
      this.xpHistory.totalAccumulatedXP += xpGained;
      this.saveXPHistory();
      console.log(`[TrainerLevelService] ✅ XP ganho: +${xpGained} (Total: ${this.xpHistory.totalAccumulatedXP})`);
    }
  }

  /**
   * ✅ CORREÇÃO CRÍTICA: Reseta histórico de XP
   */
  private resetXPHistory(): void {
    const currentUser = this.authService.getCurrentUser();
    this.xpHistory = {
      userId: currentUser?.id || '',
      viewedPokemonXP: new Set<number>(),
      capturedPokemonXP: new Set<number>(),
      totalAccumulatedXP: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * ✅ CORREÇÃO CRÍTICA: Listener para mudanças de autenticação
   */
  private setupAuthStateListener(): void {
    this.authService.getAuthState().subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.loadXPHistory();
      } else {
        // ✅ CORREÇÃO: Não resetar XP no logout, apenas parar de atualizar
        console.log('[TrainerLevelService] Logout detectado, mantendo XP atual');
      }
    });
  }

  /**
   * ✅ OBSOLETO: Método antigo mantido para compatibilidade
   */
  private calculateTotalXP(viewedCount: number, capturedCount: number): number {
    // Este método não é mais usado, mas mantido para compatibilidade
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
