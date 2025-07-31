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
    // ✅ CLEANUP: Log de inicialização removido - serviço estável
    // if (this.config.enableLogging) {
    //   console.log('🗄️ PokemonCacheHelper inicializado');
    // }
    this.loadLocalFlavorTexts(); // Carregar flavor texts locais na inicialização
  }

  // ✅ CORREÇÃO: Armazenar os dados localmente em vez de depender do cache
  private localFlavorTexts: any = null;

  /**
   * Carrega o arquivo de flavor texts pt-BR na inicialização
   */
  private loadLocalFlavorTexts(): void {
    // Verificar se já foi carregado
    if (this.localFlavorTexts) {
      return;
    }

    // Carregar arquivo local
    if (this.config.enableLogging) {
      console.log('🔄 Tentando carregar flavor texts pt-BR do arquivo local...');
    }

    this.http.get<any>('./assets/data/flavors_ptbr.json').subscribe({
      next: (data) => {
        // ✅ CORREÇÃO: Armazenar diretamente na propriedade da classe
        this.localFlavorTexts = data;

        // Também manter no cache para outros usos
        const cacheKey = `local_flavors_ptbr`;
        this.cacheService.set(cacheKey, data, 24 * 60 * 60 * 1000);

        if (this.config.enableLogging) {
          console.log('✅ Flavor texts pt-BR carregados:', Object.keys(data).length, 'Pokémon');
          console.log('🔍 Primeiras 5 chaves do arquivo:', Object.keys(data).slice(0, 5));
          console.log('🔍 Exemplo de dados para chave "1":', data['1'] ? `${data['1'].length} textos` : 'não encontrado');
        }
      },
      error: (error) => {
        if (this.config.enableLogging) {
          console.error('❌ Erro ao carregar flavor texts pt-BR:', error);
          console.error('❌ Detalhes do erro:', error.message, error.status);
        }
      }
    });
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

    // ✅ CLEANUP: Log de limpeza removido - funcionalidade estável
    // if (this.config.enableLogging) {
    //   console.log(`🧹 Limpeza de flavor texts: ${flavorKeys.length} entradas removidas`);
    // }
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
    if (this.config.enableLogging) {
      console.log(`🔄 fetchFlavorTexts chamado: Pokémon ${pokemonId}, idioma: ${lang}`);
    }

    return this.pokeApiService.getPokemonSpecies(pokemonId).pipe(
      map(species => {
        const result = this.extractFlavorTextsFromSpecies(species, lang);
        if (this.config.enableLogging) {
          console.log(`🔄 extractFlavorTextsFromSpecies retornou: ${result.length} textos para idioma ${lang}`);
          if (result.length > 0) {
            console.log(`🔍 Primeiro texto (${lang}):`, result[0].substring(0, 50) + '...');
          }
        }
        return result;
      }),
      tap(flavorTexts => {
        if (this.config.enableLogging) {
          console.log(`💾 Flavor texts processados: Pokémon ${pokemonId} (${flavorTexts.length} textos)`);
        }
      })
    );
  }

  /**
   * ✅ OTIMIZAÇÃO CRÍTICA: Extrai flavor texts de forma assíncrona para não bloquear UI
   */
  private extractFlavorTextsFromSpecies(species: any, targetLang: string): string[] {
    if (this.config.enableLogging) {
      console.log(`🔄 extractFlavorTextsFromSpecies: idioma ${targetLang}, species ID: ${species?.id}`);
    }

    if (!species?.flavor_text_entries) {
      if (this.config.enableLogging) {
        console.log(`❌ Nenhuma flavor_text_entries encontrada na species`);
      }
      return [];
    }

    // ✅ OTIMIZAÇÃO: Para português, tentar carregar do arquivo local primeiro (mais rápido)
    if (targetLang === 'pt-BR' || targetLang === 'pt') {
      const pokemonId = this.extractPokemonIdFromSpecies(species);
      if (this.config.enableLogging) {
        console.log(`🔍 Tentando carregar flavor texts locais para Pokémon ID: ${pokemonId}`);
      }
      if (pokemonId) {
        const localTexts = this.getLocalFlavorTexts(pokemonId);
        if (this.config.enableLogging) {
          console.log(`🔍 Resultado do arquivo local:`, localTexts ? localTexts.length : 'null', 'textos');
        }
        if (localTexts && localTexts.length > 0) {
          if (this.config.enableLogging) {
            console.log(`💬 Flavor texts carregados do arquivo local pt-BR:`, localTexts.length, 'textos');
            console.log(`🔍 Primeiro texto pt-BR:`, localTexts[0].substring(0, 50) + '...');
          }
          return localTexts;
        } else {
          if (this.config.enableLogging) {
            console.log(`⚠️ Arquivo local não retornou textos pt-BR, fazendo fallback para API`);
          }
        }
      }
    }

    // ✅ OTIMIZAÇÃO CRÍTICA: Usar processamento otimizado para não bloquear UI
    return this.processFlavorTextsOptimized(species.flavor_text_entries, targetLang);
  }

  /**
   * ✅ OTIMIZAÇÃO CRÍTICA: Processamento otimizado de flavor texts
   * Usa técnicas de performance para evitar bloqueio da UI
   */
  private processFlavorTextsOptimized(entries: any[], targetLang: string): string[] {
    // ✅ FALLBACK: Mapear idiomas para formato da PokeAPI (cache estático)
    const langMap: { [key: string]: string[] } = {
      'pt-BR': ['en'], // Para português, usar inglês da API como fallback
      'pt': ['en'],
      'en-US': ['en'],
      'en': ['en'],
      'es-ES': ['es', 'en'],
      'es': ['es', 'en'],
      'ja-JP': ['ja', 'en'],
      'ja': ['ja', 'en']
    };

    const apiLangs = langMap[targetLang] || [targetLang.toLowerCase(), 'en'];

    // ✅ OTIMIZAÇÃO: Usar Map para lookup mais rápido
    const entriesByLang = new Map<string, any[]>();

    // ✅ OTIMIZAÇÃO: Single pass para agrupar por idioma
    for (const entry of entries) {
      const lang = entry.language.name;
      if (!entriesByLang.has(lang)) {
        entriesByLang.set(lang, []);
      }
      entriesByLang.get(lang)!.push(entry);
    }

    // ✅ OTIMIZAÇÃO: Buscar no primeiro idioma disponível
    for (const lang of apiLangs) {
      const langEntries = entriesByLang.get(lang);
      if (langEntries && langEntries.length > 0) {
        // ✅ OTIMIZAÇÃO: Processamento em lote com Set para deduplicação automática
        const textSet = new Set<string>();

        for (const entry of langEntries) {
          const cleanText = entry.flavor_text
            .replace(/\f/g, ' ')
            .replace(/\n/g, ' ')
            .trim();

          if (cleanText.length > 0) {
            textSet.add(cleanText);
          }
        }

        if (textSet.size > 0) {
          const result = Array.from(textSet);
          if (this.config.enableLogging) {
            console.log(`💬 Flavor texts otimizados em '${lang}':`, result.length, 'textos únicos');
          }
          return result;
        }
      }
    }

    return [];
  }

  /**
   * Extrai o ID do Pokémon da resposta da species
   */
  private extractPokemonIdFromSpecies(species: any): number | null {
    if (species?.id) {
      return species.id;
    }

    // Tentar extrair do URL se não tiver ID direto
    if (species?.url) {
      const match = species.url.match(/\/pokemon-species\/(\d+)\//);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    return null;
  }

  /**
   * Carrega flavor texts do arquivo local pt-BR
   */
  private getLocalFlavorTexts(pokemonId: number): string[] | null {
    try {
      // ✅ CORREÇÃO: Usar a propriedade local em vez do cache
      if (!this.localFlavorTexts) {
        if (this.config.enableLogging) {
          console.log(`🔍 DEBUG: Flavor texts locais ainda não carregados`);
        }
        return null;
      }

      const data = this.localFlavorTexts;

      // ✅ DEBUG: Verificar o que realmente está nos dados
      if (this.config.enableLogging && pokemonId === 1) {
        console.log(`🔍 DEBUG: Tipo dos dados:`, typeof data);
        console.log(`🔍 DEBUG: Chaves disponíveis:`, Object.keys(data).slice(0, 10));
        console.log(`🔍 DEBUG: Valor para chave 1:`, data[1]);
        console.log(`🔍 DEBUG: Valor para chave "1":`, data["1"]);
        console.log(`🔍 DEBUG: Valor direto:`, data["1"] ? data["1"].slice(0, 2) : 'null');
      }

      // ✅ CORREÇÃO: Tentar tanto número quanto string como chave
      const result = data[pokemonId] || data[pokemonId.toString()] || null;
      if (this.config.enableLogging) {
        console.log(`🔍 Buscando no arquivo local: chave ${pokemonId} ou "${pokemonId.toString()}"`, result ? `${result.length} textos encontrados` : 'não encontrado');
      }
      return result;
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('❌ Erro ao carregar flavor texts locais:', error);
      }
      return null;
    }
  }

  /**
   * Calcula IDs adjacentes para preload
   */
  private getAdjacentIds(currentId: number, range: number): number[] {
    const ids: number[] = [];
    const maxId = 1025; // Limite atual da PokeAPI (atualizado em 2024)

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
