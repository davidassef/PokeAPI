import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, Subject } from 'rxjs';
import { tap, catchError, shareReplay, takeUntil } from 'rxjs/operators';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
}

@Injectable({
  providedIn: 'root'
})
export class PokemonCacheService implements OnDestroy {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_CACHE_SIZE = 100; // Máximo 100 entradas

  // ✅ CORREÇÃO: Subject para cancelar subscriptions e cleanup
  private destroy$ = new Subject<void>();
  private cleanupInterval: any;

  // Estatísticas de cache
  private stats = {
    totalHits: 0,
    totalMisses: 0,
    totalRequests: 0
  };

  // Subject para notificar mudanças nas estatísticas
  private statsSubject = new BehaviorSubject<CacheStats>(this.getStats());
  public stats$ = this.statsSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('🗄️ PokemonCacheService inicializado');

    // ✅ CORREÇÃO: Limpeza automática com referência para cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanExpiredEntries();
    }, 2 * 60 * 1000);
  }

  // ✅ CORREÇÃO: Implementar OnDestroy para cleanup adequado
  ngOnDestroy(): void {
    console.log('🗄️ PokemonCacheService destruído - limpando recursos');

    // Cancelar todas as subscriptions
    this.destroy$.next();
    this.destroy$.complete();

    // Limpar interval de limpeza
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Limpar cache
    this.cache.clear();
  }

  /**
   * Busca dados com cache inteligente
   */
  get<T>(url: string, ttl: number = this.DEFAULT_TTL): Observable<T> {
    const cacheKey = this.generateCacheKey(url);
    const cachedEntry = this.cache.get(cacheKey);

    this.stats.totalRequests++;

    // Verificar se existe cache válido
    if (cachedEntry && this.isValidEntry(cachedEntry)) {
      console.log(`🎯 Cache HIT para: ${url}`);
      this.stats.totalHits++;
      this.updateStats();
      return of(cachedEntry.data);
    }

    // Cache miss - fazer requisição
    console.log(`🌐 Cache MISS para: ${url}`);
    this.stats.totalMisses++;
    this.updateStats();

    return this.http.get<T>(url).pipe(
      tap(data => {
        this.setCache(cacheKey, data, ttl);
        console.log(`💾 Dados armazenados no cache: ${cacheKey}`);
      }),
      catchError(error => {
        console.error(`❌ Erro ao buscar dados: ${url}`, error);
        throw error;
      }),
      shareReplay(1)
    );
  }

  /**
   * Busca dados do Pokémon com cache otimizado
   */
  getPokemon(id: number): Observable<any> {
    const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
    return this.get(url, 10 * 60 * 1000); // Cache por 10 minutos
  }

  /**
   * Busca dados da espécie com cache otimizado
   */
  getPokemonSpecies(id: number): Observable<any> {
    const url = `https://pokeapi.co/api/v2/pokemon-species/${id}`;
    return this.get(url, 15 * 60 * 1000); // Cache por 15 minutos
  }

  /**
   * Busca cadeia de evolução com cache otimizado
   */
  getEvolutionChain(url: string): Observable<any> {
    return this.get(url, 20 * 60 * 1000); // Cache por 20 minutos
  }

  /**
   * Cache especializado para flavor texts com TTL estendido
   */
  getFlavorTexts(pokemonId: number, lang: string = 'pt-BR'): Observable<string[]> {
    const cacheKey = `flavor_${pokemonId}_${lang}`;
    const cachedEntry = this.cache.get(cacheKey);

    this.stats.totalRequests++;

    // Verificar se existe cache válido
    if (cachedEntry && this.isValidEntry(cachedEntry)) {
      console.log(`🎯 Cache HIT para flavor texts: Pokémon ${pokemonId} (${lang})`);
      this.stats.totalHits++;
      this.updateStats();
      return of(cachedEntry.data);
    }

    // Cache miss - buscar dados da espécie e processar flavor texts
    console.log(`🌐 Cache MISS para flavor texts: Pokémon ${pokemonId} (${lang})`);
    this.stats.totalMisses++;
    this.updateStats();

    return this.getPokemonSpecies(pokemonId).pipe(
      tap(species => {
        const flavorTexts = this.extractFlavorTextsFromSpecies(species, lang);
        this.setCache(cacheKey, flavorTexts, 60 * 60 * 1000); // Cache por 1 hora
        console.log(`💾 Flavor texts armazenados no cache: ${cacheKey} (${flavorTexts.length} textos)`);
      }),
      catchError(error => {
        console.error(`❌ Erro ao buscar flavor texts: Pokémon ${pokemonId}`, error);
        throw error;
      })
    );
  }

  /**
   * Extrai e processa flavor texts de dados da espécie
   */
  private extractFlavorTextsFromSpecies(species: any, lang: string): string[] {
    if (!species.flavor_text_entries) {
      return [];
    }

    // Mapear idioma do translate para formato da PokeAPI
    const apiLangMap: { [key: string]: string[] } = {
      'pt-BR': ['pt-br', 'pt'],
      'pt': ['pt-br', 'pt'],
      'en-US': ['en'],
      'en': ['en'],
      'es': ['es'],
      'es-ES': ['es'],
      'ja-JP': ['ja'],
      'ja': ['ja']
    };

    const targetLanguages = apiLangMap[lang] || ['en'];

    // Buscar entradas no idioma específico
    let targetEntries = species.flavor_text_entries.filter((entry: any) =>
      targetLanguages.includes(entry.language.name)
    );

    // Se não encontrar no idioma específico, usar inglês como fallback
    if (targetEntries.length === 0 && !targetLanguages.includes('en')) {
      targetEntries = species.flavor_text_entries.filter((entry: any) => entry.language.name === 'en');
    }

    if (targetEntries.length === 0) {
      return [];
    }

    // Converter para array de strings e remover duplicatas
    const flavorStrings = targetEntries.map((entry: any) =>
      entry.flavor_text.replace(/\n/g, ' ').replace(/\f/g, ' ')
    );

    // Remover duplicatas baseado no conteúdo
    const uniqueFlavors = flavorStrings.filter((flavor: string, index: number, array: string[]) => {
      return array.findIndex((f: string) => f.trim() === flavor.trim()) === index;
    });

    return uniqueFlavors;
  }

  /**
   * Pré-carrega dados de Pokémon adjacentes incluindo flavor texts
   */
  preloadAdjacentPokemon(currentId: number, currentLang: string = 'pt-BR'): void {
    const adjacentIds = [
      Math.max(1, currentId - 1),
      currentId + 1,
      currentId + 2
    ].filter(id => id !== currentId && id <= 1010); // Limite da PokéAPI

    console.log(`🚀 Pré-carregando Pokémon adjacentes: ${adjacentIds.join(', ')}`);

    // ✅ CORREÇÃO: Usar takeUntil() para evitar vazamentos de memória
    adjacentIds.forEach(id => {
      // Pré-carregar apenas se não estiver no cache
      const pokemonKey = this.generateCacheKey(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const speciesKey = this.generateCacheKey(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
      const flavorKey = `flavor_${id}_${currentLang}`;

      if (!this.cache.has(pokemonKey)) {
        this.getPokemon(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => console.log(`✅ Pré-carregado: Pokémon ${id}`),
            error: () => console.log(`❌ Erro ao pré-carregar: Pokémon ${id}`)
          });
      }

      if (!this.cache.has(speciesKey)) {
        this.getPokemonSpecies(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => console.log(`✅ Pré-carregado: Espécie ${id}`),
            error: () => console.log(`❌ Erro ao pré-carregar: Espécie ${id}`)
          });
      }

      // Pré-carregar flavor texts se não estiverem no cache
      if (!this.cache.has(flavorKey)) {
        this.getFlavorTexts(id, currentLang)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (flavors) => console.log(`✅ Pré-carregado: Flavor texts ${id} (${flavors.length} textos)`),
            error: () => console.log(`❌ Erro ao pré-carregar: Flavor texts ${id}`)
          });
      }
    });
  }

  /**
   * ✅ CORREÇÃO: Pré-carrega flavor texts para múltiplos idiomas com takeUntil()
   */
  preloadFlavorTextsMultiLang(pokemonId: number, languages: string[] = ['pt-BR', 'en-US']): void {
    console.log(`🌐 Pré-carregando flavor texts multilíngue para Pokémon ${pokemonId}: ${languages.join(', ')}`);

    languages.forEach(lang => {
      const flavorKey = `flavor_${pokemonId}_${lang}`;

      if (!this.cache.has(flavorKey)) {
        this.getFlavorTexts(pokemonId, lang)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (flavors) => console.log(`✅ Pré-carregado: Flavor texts ${pokemonId} (${lang}) - ${flavors.length} textos`),
            error: () => console.log(`❌ Erro ao pré-carregar: Flavor texts ${pokemonId} (${lang})`)
          });
      }
    });
  }

  /**
   * ✅ NOVO: Método otimizado para pré-carregamento em lote
   */
  preloadBatch(pokemonIds: number[], priority: 'high' | 'low' = 'low'): void {
    if (pokemonIds.length === 0) return;

    console.log(`🚀 Pré-carregamento em lote: ${pokemonIds.length} Pokémon (prioridade: ${priority})`);

    // ✅ CORREÇÃO: Limitar pré-carregamento para evitar sobrecarga
    const maxBatchSize = priority === 'high' ? 5 : 3;
    const batchIds = pokemonIds.slice(0, maxBatchSize);

    batchIds.forEach((id, index) => {
      // ✅ CORREÇÃO: Delay escalonado para evitar sobrecarga da API
      const delay = priority === 'high' ? index * 100 : index * 500;

      setTimeout(() => {
        const pokemonKey = this.generateCacheKey(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const speciesKey = this.generateCacheKey(`https://pokeapi.co/api/v2/pokemon-species/${id}`);

        if (!this.cache.has(pokemonKey)) {
          this.getPokemon(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => console.log(`✅ Lote: Pokémon ${id} pré-carregado`),
              error: () => console.log(`❌ Lote: Erro ao pré-carregar Pokémon ${id}`)
            });
        }

        if (!this.cache.has(speciesKey)) {
          this.getPokemonSpecies(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => console.log(`✅ Lote: Espécie ${id} pré-carregada`),
              error: () => console.log(`❌ Lote: Erro ao pré-carregar espécie ${id}`)
            });
        }
      }, delay);
    });
  }

  /**
   * ✅ CORREÇÃO: Limpa cache expirado de forma mais eficiente
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    let removedCount = 0;
    const keysToRemove: string[] = [];

    // ✅ CORREÇÃO: Coletar chaves primeiro, depois remover (evita modificar Map durante iteração)
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToRemove.push(key);
      }
    }

    // ✅ CORREÇÃO: Remover em lote para melhor performance
    keysToRemove.forEach(key => {
      this.cache.delete(key);
      removedCount++;
    });

    if (removedCount > 0) {
      console.log(`🧹 Limpeza de cache: ${removedCount} entradas expiradas removidas (${this.cache.size} restantes)`);
      this.updateStats();
    }

    // Limitar tamanho do cache
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      this.evictOldestEntries();
    }
  }

  /**
   * ✅ CORREÇÃO: Remove entradas mais antigas de forma mais eficiente
   */
  private evictOldestEntries(): void {
    const entriesToRemove = this.cache.size - this.MAX_CACHE_SIZE;
    if (entriesToRemove <= 0) return;

    // ✅ CORREÇÃO: Usar algoritmo mais eficiente para encontrar entradas mais antigas
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, entriesToRemove);

    // ✅ CORREÇÃO: Remover em lote
    entries.forEach(([key]) => this.cache.delete(key));

    console.log(`🗑️ Cache LRU: Removidas ${entries.length} entradas antigas (tamanho: ${this.cache.size}/${this.MAX_CACHE_SIZE})`);
    this.updateStats();
  }

  /**
   * Gera chave única para o cache
   */
  private generateCacheKey(url: string): string {
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Verifica se entrada do cache é válida
   */
  private isValidEntry(entry: CacheEntry<any>): boolean {
    return Date.now() < entry.expiresAt;
  }

  /**
   * Armazena dados no cache
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl
    };

    this.cache.set(key, entry);
    this.updateStats();
  }

  /**
   * Obtém estatísticas do cache incluindo flavor texts
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.totalHits + this.stats.totalMisses;
    const hitRate = totalRequests > 0 ? (this.stats.totalHits / totalRequests) * 100 : 0;

    // Estimar uso de memória (aproximado)
    const memoryUsage = JSON.stringify(Array.from(this.cache.values())).length;

    return {
      totalEntries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalHits: this.stats.totalHits,
      totalMisses: this.stats.totalMisses,
      memoryUsage: Math.round(memoryUsage / 1024) // KB
    };
  }

  /**
   * Obtém estatísticas específicas de flavor texts
   */
  getFlavorTextStats(): {
    totalFlavorEntries: number;
    flavorsByLanguage: { [lang: string]: number };
    averageTextsPerPokemon: number;
  } {
    const flavorEntries = Array.from(this.cache.keys()).filter(key => key.startsWith('flavor_'));
    const flavorsByLanguage: { [lang: string]: number } = {};

    flavorEntries.forEach(key => {
      const parts = key.split('_');
      if (parts.length >= 3) {
        const lang = parts.slice(2).join('_'); // Reconstrói idioma (ex: pt-BR)
        flavorsByLanguage[lang] = (flavorsByLanguage[lang] || 0) + 1;
      }
    });

    const uniquePokemonIds = new Set(
      flavorEntries.map(key => key.split('_')[1]).filter(id => id)
    );

    return {
      totalFlavorEntries: flavorEntries.length,
      flavorsByLanguage,
      averageTextsPerPokemon: uniquePokemonIds.size > 0 ?
        Math.round((flavorEntries.length / uniquePokemonIds.size) * 100) / 100 : 0
    };
  }

  /**
   * Limpa apenas flavor texts do cache
   */
  clearFlavorTexts(): void {
    const flavorKeys = Array.from(this.cache.keys()).filter(key => key.startsWith('flavor_'));
    flavorKeys.forEach(key => this.cache.delete(key));

    console.log(`🧹 Limpeza de flavor texts: ${flavorKeys.length} entradas removidas`);
    this.updateStats();
  }

  /**
   * Atualiza estatísticas
   */
  private updateStats(): void {
    this.statsSubject.next(this.getStats());
  }

  /**
   * Limpa todo o cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache completamente limpo');
    this.updateStats();
  }

  /**
   * Obtém informações de debug do cache
   */
  getDebugInfo(): any {
    return {
      cacheSize: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      defaultTTL: this.DEFAULT_TTL,
      stats: this.getStats(),
      entries: Array.from(this.cache.keys())
    };
  }
}
