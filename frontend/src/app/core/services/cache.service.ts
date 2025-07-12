import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

/**
 * Interface para itens do cache
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
  size: number;
}

/**
 * Interface para configuração do cache
 */
interface CacheConfig {
  maxSize: number; // Tamanho máximo em MB
  defaultTTL: number; // TTL padrão em milissegundos
  cleanupInterval: number; // Intervalo de limpeza em milissegundos
}

/**
 * Interface para estatísticas do cache
 */
interface CacheStats {
  totalItems: number;
  totalSize: number; // em bytes
  hitRate: number;
  missRate: number;
  hits: number;
  misses: number;
  evictions: number;
}

/**
 * Serviço de cache inteligente com TTL, LRU e compressão
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private accessOrder = new Map<string, number>(); // Para LRU
  private accessCounter = 0;
  
  private config: CacheConfig = {
    maxSize: 50, // 50MB
    defaultTTL: 30 * 60 * 1000, // 30 minutos
    cleanupInterval: 5 * 60 * 1000 // 5 minutos
  };

  private stats: CacheStats = {
    totalItems: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    hits: 0,
    misses: 0,
    evictions: 0
  };

  private statsSubject = new BehaviorSubject<CacheStats>(this.stats);
  public stats$ = this.statsSubject.asObservable();

  private cleanupTimer: any;

  constructor() {
    this.startCleanupTimer();
    this.loadFromLocalStorage();
  }

  /**
   * Obtém um item do cache ou executa a função de fallback
   */
  get<T>(key: string, fallback?: () => Observable<T>, ttl?: number): Observable<T> {
    const item = this.cache.get(key);
    
    if (item && !this.isExpired(item)) {
      // Cache hit
      this.updateAccessOrder(key);
      this.stats.hits++;
      this.updateStats();
      console.log(`🎯 Cache HIT: ${key}`);
      return of(item.data);
    }

    // Cache miss
    this.stats.misses++;
    this.updateStats();
    console.log(`❌ Cache MISS: ${key}`);

    if (fallback) {
      return fallback().pipe(
        tap(data => {
          this.set(key, data, ttl);
        }),
        catchError(error => {
          console.error(`Error in cache fallback for key ${key}:`, error);
          throw error;
        })
      );
    }

    throw new Error(`Cache miss and no fallback provided for key: ${key}`);
  }

  /**
   * Define um item no cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const timeToLive = ttl || this.config.defaultTTL;
    const size = this.calculateSize(data);

    // Verificar se há espaço suficiente
    this.ensureSpace(size);

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + timeToLive,
      key,
      size
    };

    // Remover item existente se houver
    if (this.cache.has(key)) {
      const oldItem = this.cache.get(key)!;
      this.stats.totalSize -= oldItem.size;
    } else {
      this.stats.totalItems++;
    }

    this.cache.set(key, item);
    this.updateAccessOrder(key);
    this.stats.totalSize += size;
    this.updateStats();

    console.log(`💾 Cache SET: ${key} (${this.formatSize(size)})`);
    this.saveToLocalStorage();
  }

  /**
   * Remove um item do cache
   */
  delete(key: string): boolean {
    const item = this.cache.get(key);
    if (item) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.stats.totalItems--;
      this.stats.totalSize -= item.size;
      this.updateStats();
      console.log(`🗑️ Cache DELETE: ${key}`);
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.stats.totalItems = 0;
    this.stats.totalSize = 0;
    this.stats.evictions = 0;
    this.updateStats();
    console.log('🧹 Cache CLEARED');
    localStorage.removeItem('pokeapi_cache');
  }

  /**
   * Verifica se uma chave existe no cache e não expirou
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    return item ? !this.isExpired(item) : false;
  }

  /**
   * Obtém as chaves do cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Obtém o tamanho atual do cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Configura o cache
   */
  configure(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ Cache configured:', this.config);
  }

  /**
   * Força limpeza de itens expirados
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Cache cleanup: removed ${keysToDelete.length} expired items`);
    }
  }

  /**
   * Verifica se um item expirou
   */
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() > item.expiresAt;
  }

  /**
   * Atualiza a ordem de acesso para LRU
   */
  private updateAccessOrder(key: string): void {
    this.accessOrder.set(key, ++this.accessCounter);
  }

  /**
   * Garante que há espaço suficiente no cache
   */
  private ensureSpace(requiredSize: number): void {
    const maxSizeBytes = this.config.maxSize * 1024 * 1024; // Converter MB para bytes
    
    while (this.stats.totalSize + requiredSize > maxSizeBytes && this.cache.size > 0) {
      this.evictLRU();
    }
  }

  /**
   * Remove o item menos recentemente usado (LRU)
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestAccess = Infinity;

    for (const [key, accessTime] of this.accessOrder.entries()) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      console.log(`🚮 Cache EVICT (LRU): ${oldestKey}`);
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Calcula o tamanho aproximado de um objeto em bytes
   */
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      // Fallback para estimativa simples
      return JSON.stringify(data).length * 2; // Aproximação UTF-16
    }
  }

  /**
   * Formata tamanho em bytes para exibição
   */
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Atualiza estatísticas
   */
  private updateStats(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    this.stats.missRate = total > 0 ? (this.stats.misses / total) * 100 : 0;
    this.statsSubject.next({ ...this.stats });
  }

  /**
   * Inicia timer de limpeza automática
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Salva cache no localStorage (apenas chaves importantes)
   */
  private saveToLocalStorage(): void {
    try {
      const importantKeys = Array.from(this.cache.keys())
        .filter(key => key.startsWith('pokemon_') || key.startsWith('ranking_'))
        .slice(0, 100); // Limitar a 100 itens mais importantes

      const cacheData = importantKeys.reduce((acc, key) => {
        const item = this.cache.get(key);
        if (item && !this.isExpired(item)) {
          acc[key] = item;
        }
        return acc;
      }, {} as Record<string, CacheItem<any>>);

      localStorage.setItem('pokeapi_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  /**
   * Carrega cache do localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const cacheData = localStorage.getItem('pokeapi_cache');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        
        for (const [key, item] of Object.entries(parsed)) {
          const cacheItem = item as CacheItem<any>;
          if (!this.isExpired(cacheItem)) {
            this.cache.set(key, cacheItem);
            this.updateAccessOrder(key);
            this.stats.totalItems++;
            this.stats.totalSize += cacheItem.size;
          }
        }
        
        this.updateStats();
        console.log(`📥 Cache loaded: ${this.stats.totalItems} items (${this.formatSize(this.stats.totalSize)})`);
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  /**
   * Cleanup ao destruir o serviço
   */
  ngOnDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}
