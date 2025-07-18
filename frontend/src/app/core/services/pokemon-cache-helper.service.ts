import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { map, tap, catchError, takeUntil } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { PokeApiService } from './pokeapi.service';
import { environment } from '../../../environments/environment';

/**
 * Helper especializado para funcionalidades específicas de cache de Pokémon
 * Usa CacheService internamente e integra com PokeApiService
 * Mantém apenas funcionalidades únicas não disponíveis em outros serviços
 */
@Injectable({
  providedIn: 'root'
})
export class PokemonCacheHelper implements OnDestroy {
  private destroy$ = new Subject<void>();
  private config = {
    enableLogging: !environment.production,
    flavorTextTTL: 30 * 60 * 1000, // 30 minutos
    evolutionChainTTL: 20 * 60 * 1000 // 20 minutos
  };

  constructor(
    private cacheService: CacheService,
    private pokeApiService: PokeApiService,
    private http: HttpClient
  ) {
    if (this.config.enableLogging) {
      console.log('🗄️ PokemonCacheHelper inicializado');
    }
  }

  /**
   * Busca flavor texts por idioma (FUNCIONALIDADE ÚNICA)
   * Esta é uma funcionalidade específica que não existe no PokeApiService
   */
  getFlavorTexts(pokemonId: number, lang: string = 'pt-BR'): Observable<string[]> {
    const cacheKey = `flavor_${pokemonId}_${lang}`;

    return this.cacheService.get<string[]>(
      cacheKey,
      () => this.fetchFlavorTexts(pokemonId, lang),
      this.config.flavorTextTTL
    ).pipe(
      catchError(error => {
        if (this.config.enableLogging) {
          console.error(`❌ Erro ao buscar flavor texts: Pokémon ${pokemonId}`, error);
        }
        return of([]);
      })
    );
  }

  /**
   * Busca cadeia de evolução com cache otimizado (FUNCIONALIDADE ESPECÍFICA)
   * Mantida aqui pois tem lógica específica de cache
   */
  getEvolutionChain(url: string): Observable<any> {
    const cacheKey = `evolution_chain_${this.generateCacheKey(url)}`;

    return this.cacheService.get<any>(
      cacheKey,
      () => this.http.get<any>(url),
      this.config.evolutionChainTTL
    ).pipe(
      catchError(error => {
        if (this.config.enableLogging) {
          console.error(`❌ Erro ao buscar evolution chain: ${url}`, error);
        }
        throw error;
      })
    );
  }

  /**
   * Preload inteligente de Pokémons adjacentes (FUNCIONALIDADE ÚNICA)
   * Usa PokeApiService para consistência, mas mantém lógica específica
   */
  preloadAdjacentPokemon(currentId: number, currentLang: string = 'pt-BR', range: number = 2): void {
    const adjacentIds = this.getAdjacentIds(currentId, range);

    if (this.config.enableLogging) {
      console.log(`🔄 Iniciando preload adjacente para Pokémon ${currentId} (range: ${range})`);
    }

    adjacentIds.forEach(id => {
      // Usar PokeApiService para dados básicos (consistência)
      this.pokeApiService.getPokemon(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            if (this.config.enableLogging) {
              console.log(`✅ Pré-carregado: Pokémon ${id}`);
            }
          },
          error: () => {
            if (this.config.enableLogging) {
              console.log(`❌ Erro ao pré-carregar: Pokémon ${id}`);
            }
          }
        });

      // Usar PokeApiService para species (consistência)
      this.pokeApiService.getPokemonSpecies(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            if (this.config.enableLogging) {
              console.log(`✅ Pré-carregado: Espécie ${id}`);
            }
          },
          error: () => {
            if (this.config.enableLogging) {
              console.log(`❌ Erro ao pré-carregar: Espécie ${id}`);
            }
          }
        });

      // Pré-carregar flavor texts (funcionalidade única)
      const flavorKey = `flavor_${id}_${currentLang}`;
      if (!this.cacheService.has(flavorKey)) {
        this.getFlavorTexts(id, currentLang)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (flavors) => {
              if (this.config.enableLogging) {
                console.log(`✅ Pré-carregado: Flavor texts ${id} (${flavors.length} textos)`);
              }
            },
            error: () => {
              if (this.config.enableLogging) {
                console.log(`❌ Erro ao pré-carregar: Flavor texts ${id}`);
              }
            }
          });
      }
    });
  }

  /**
   * Preload em lote com delay (FUNCIONALIDADE ÚNICA)
   */
  preloadBatch(pokemonIds: number[], delayMs: number = 100): void {
    if (this.config.enableLogging) {
      console.log(`🔄 Iniciando preload em lote: ${pokemonIds.length} Pokémons`);
    }

    pokemonIds.forEach((id, index) => {
      const delay = index * delayMs;

      setTimeout(() => {
        // Usar PokeApiService para consistência
        this.pokeApiService.getPokemon(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              if (this.config.enableLogging) {
                console.log(`✅ Lote: Pokémon ${id} pré-carregado`);
              }
            },
            error: () => {
              if (this.config.enableLogging) {
                console.log(`❌ Lote: Erro ao pré-carregar Pokémon ${id}`);
              }
            }
          });

        this.pokeApiService.getPokemonSpecies(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              if (this.config.enableLogging) {
                console.log(`✅ Lote: Espécie ${id} pré-carregada`);
              }
            },
            error: () => {
              if (this.config.enableLogging) {
                console.log(`❌ Lote: Erro ao pré-carregar espécie ${id}`);
              }
            }
          });
      }, delay);
    });
  }

  /**
   * Estatísticas específicas de flavor texts (FUNCIONALIDADE ÚNICA)
   */
  getFlavorTextStats(): any {
    const cacheStats = this.cacheService.getStats();
    const allKeys = this.cacheService.keys();
    const flavorKeys = allKeys.filter(key => key.startsWith('flavor_'));

    const flavorsByLanguage: { [key: string]: number } = {};
    const uniquePokemonIds = new Set<number>();

    flavorKeys.forEach(key => {
      const parts = key.split('_');
      if (parts.length >= 3) {
        const pokemonId = parseInt(parts[1]);
        const language = parts.slice(2).join('_');

        uniquePokemonIds.add(pokemonId);
        flavorsByLanguage[language] = (flavorsByLanguage[language] || 0) + 1;
      }
    });

    return {
      totalFlavorEntries: flavorKeys.length,
      flavorsByLanguage,
      uniquePokemonCount: uniquePokemonIds.size,
      averageTextsPerPokemon: uniquePokemonIds.size > 0 ?
        Math.round((flavorKeys.length / uniquePokemonIds.size) * 100) / 100 : 0,
      cacheHitRate: cacheStats.hitRate,
      totalCacheSize: cacheStats.totalSize
    };
  }

  /**
   * Limpeza específica de flavor texts (FUNCIONALIDADE ÚNICA)
   */
  clearFlavorTexts(): void {
    const allKeys = this.cacheService.keys();
    const flavorKeys = allKeys.filter(key => key.startsWith('flavor_'));

    flavorKeys.forEach(key => this.cacheService.delete(key));

    if (this.config.enableLogging) {
      console.log(`🧹 Limpeza de flavor texts: ${flavorKeys.length} entradas removidas`);
    }
  }

  /**
   * Verifica se uma chave de cache existe
   */
  has(key: string): boolean {
    return this.cacheService.has(key);
  }

  /**
   * Obtém estatísticas gerais do cache (delegação para CacheService)
   */
  getStats(): any {
    return this.cacheService.getStats();
  }

  /**
   * Limpa todo o cache (delegação para CacheService)
   */
  clear(): void {
    this.cacheService.clear();
  }

  /**
   * Executa limpeza de entradas expiradas (delegação para CacheService)
   */
  cleanup(): void {
    this.cacheService.cleanup();
  }

  // MÉTODOS PRIVADOS

  /**
   * Busca flavor texts da API e processa
   */
  private fetchFlavorTexts(pokemonId: number, lang: string): Observable<string[]> {
    return this.pokeApiService.getPokemonSpecies(pokemonId).pipe(
      map(species => this.extractFlavorTextsFromSpecies(species, lang)),
      tap(flavorTexts => {
        if (this.config.enableLogging) {
          console.log(`💾 Flavor texts processados: Pokémon ${pokemonId} (${flavorTexts.length} textos)`);
        }
      })
    );
  }

  /**
   * Extrai flavor texts da resposta da species
   */
  private extractFlavorTextsFromSpecies(species: any, targetLang: string): string[] {
    if (!species?.flavor_text_entries) {
      return [];
    }

    const flavorTexts = species.flavor_text_entries
      .filter((entry: any) => entry.language.name === targetLang)
      .map((entry: any) => entry.flavor_text.replace(/\f/g, ' ').trim())
      .filter((text: string) => text.length > 0);

    // Remover duplicatas
    return [...new Set(flavorTexts)] as string[];
  }

  /**
   * Calcula IDs adjacentes para preload
   */
  private getAdjacentIds(currentId: number, range: number): number[] {
    const ids: number[] = [];
    const maxId = 1010; // Limite atual da PokeAPI

    for (let i = -range; i <= range; i++) {
      if (i === 0) continue; // Pular o ID atual

      const adjacentId = currentId + i;
      if (adjacentId >= 1 && adjacentId <= maxId) {
        ids.push(adjacentId);
      }
    }

    return ids;
  }

  /**
   * Gera chave de cache única
   */
  private generateCacheKey(url: string): string {
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.config.enableLogging) {
      console.log('🗄️ PokemonCacheHelper destruído - limpando recursos');
    }
  }
}
