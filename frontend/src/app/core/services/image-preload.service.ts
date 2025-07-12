import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

/**
 * Interface para estatísticas de preload
 */
interface PreloadStats {
  totalRequested: number;
  totalLoaded: number;
  totalFailed: number;
  cacheHits: number;
  averageLoadTime: number;
  successRate: number;
}

/**
 * Interface para item de preload
 */
interface PreloadItem {
  url: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  loadTime?: number;
  status: 'pending' | 'loading' | 'loaded' | 'failed';
}

/**
 * Serviço para preload inteligente de imagens
 * - Priorização baseada na visibilidade
 * - Cache de imagens carregadas
 * - Estatísticas de performance
 * - Throttling para evitar sobrecarga
 */
@Injectable({
  providedIn: 'root'
})
export class ImagePreloadService {
  private imageCache = new Map<string, HTMLImageElement>();
  private preloadQueue: PreloadItem[] = [];
  private isProcessing = false;
  private maxConcurrentLoads = 3;
  private currentLoads = 0;

  private stats: PreloadStats = {
    totalRequested: 0,
    totalLoaded: 0,
    totalFailed: 0,
    cacheHits: 0,
    averageLoadTime: 0,
    successRate: 0
  };

  private statsSubject = new BehaviorSubject<PreloadStats>(this.stats);
  public stats$ = this.statsSubject.asObservable();

  constructor() {
    this.startProcessingQueue();
  }

  /**
   * Precarrega uma imagem com prioridade
   */
  preload(url: string, priority: 'high' | 'medium' | 'low' = 'medium'): Observable<boolean> {
    // Verificar se já está no cache
    if (this.imageCache.has(url)) {
      this.stats.cacheHits++;
      this.updateStats();
      console.log(`🎯 Image cache hit: ${url}`);
      return of(true);
    }

    // Verificar se já está na fila
    const existingItem = this.preloadQueue.find(item => item.url === url);
    if (existingItem) {
      // Atualizar prioridade se for maior
      if (this.getPriorityValue(priority) > this.getPriorityValue(existingItem.priority)) {
        existingItem.priority = priority;
        this.sortQueue();
      }
      return this.waitForLoad(url);
    }

    // Adicionar à fila
    const item: PreloadItem = {
      url,
      priority,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.preloadQueue.push(item);
    this.sortQueue();
    this.stats.totalRequested++;
    this.updateStats();

    console.log(`📥 Image queued for preload: ${url} (priority: ${priority})`);

    return this.waitForLoad(url);
  }

  /**
   * Precarrega múltiplas imagens
   */
  preloadBatch(urls: string[], priority: 'high' | 'medium' | 'low' = 'medium'): Observable<boolean[]> {
    const preloadObservables = urls.map(url => this.preload(url, priority));
    return from(Promise.all(preloadObservables.map(obs =>
      obs.toPromise().then(result => result || false)
    )));
  }

  /**
   * Verifica se uma imagem está no cache
   */
  isInCache(url: string): boolean {
    return this.imageCache.has(url);
  }

  /**
   * Obtém uma imagem do cache
   */
  getFromCache(url: string): HTMLImageElement | null {
    return this.imageCache.get(url) || null;
  }

  /**
   * Remove uma imagem do cache
   */
  removeFromCache(url: string): boolean {
    return this.imageCache.delete(url);
  }

  /**
   * Limpa todo o cache
   */
  clearCache(): void {
    this.imageCache.clear();
    console.log('🧹 Image cache cleared');
  }

  /**
   * Obtém estatísticas do serviço
   */
  getStats(): PreloadStats {
    return { ...this.stats };
  }

  /**
   * Obtém o tamanho atual do cache
   */
  getCacheSize(): number {
    return this.imageCache.size;
  }

  /**
   * Obtém o tamanho da fila de preload
   */
  getQueueSize(): number {
    return this.preloadQueue.length;
  }

  /**
   * Prioriza o preload de imagens visíveis
   */
  prioritizeVisible(urls: string[]): void {
    urls.forEach(url => {
      const item = this.preloadQueue.find(item => item.url === url);
      if (item && item.priority !== 'high') {
        item.priority = 'high';
      }
    });
    this.sortQueue();
  }

  /**
   * Processa a fila de preload
   */
  private startProcessingQueue(): void {
    setInterval(() => {
      this.processQueue();
    }, 100); // Verificar a cada 100ms
  }

  /**
   * Processa itens da fila
   */
  private processQueue(): void {
    if (this.isProcessing || this.currentLoads >= this.maxConcurrentLoads) {
      return;
    }

    const nextItem = this.preloadQueue.find(item => item.status === 'pending');
    if (!nextItem) {
      return;
    }

    this.loadImage(nextItem);
  }

  /**
   * Carrega uma imagem
   */
  private async loadImage(item: PreloadItem): Promise<void> {
    item.status = 'loading';
    this.currentLoads++;
    const startTime = Date.now();

    try {
      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${item.url}`));

        // Timeout para evitar travamento
        setTimeout(() => {
          reject(new Error(`Image load timeout: ${item.url}`));
        }, 15000);

        img.src = item.url;
      });

      // Sucesso
      item.status = 'loaded';
      item.loadTime = Date.now() - startTime;
      this.imageCache.set(item.url, img);
      this.stats.totalLoaded++;

      console.log(`✅ Image preloaded: ${item.url} (${item.loadTime}ms)`);

    } catch (error) {
      // Erro
      item.status = 'failed';
      this.stats.totalFailed++;

      console.error(`❌ Image preload failed: ${item.url}`, error);
    } finally {
      this.currentLoads--;
      this.removeFromQueue(item.url);
      this.updateStats();
    }
  }

  /**
   * Aguarda o carregamento de uma imagem
   */
  private waitForLoad(url: string): Observable<boolean> {
    return new Observable(observer => {
      const checkStatus = () => {
        const item = this.preloadQueue.find(item => item.url === url);

        if (!item) {
          // Não está na fila, verificar cache
          if (this.imageCache.has(url)) {
            observer.next(true);
            observer.complete();
          } else {
            observer.next(false);
            observer.complete();
          }
          return;
        }

        if (item.status === 'loaded') {
          observer.next(true);
          observer.complete();
        } else if (item.status === 'failed') {
          observer.next(false);
          observer.complete();
        } else {
          // Ainda carregando, verificar novamente
          setTimeout(checkStatus, 100);
        }
      };

      checkStatus();
    });
  }

  /**
   * Remove item da fila
   */
  private removeFromQueue(url: string): void {
    const index = this.preloadQueue.findIndex(item => item.url === url);
    if (index !== -1) {
      this.preloadQueue.splice(index, 1);
    }
  }

  /**
   * Ordena a fila por prioridade
   */
  private sortQueue(): void {
    this.preloadQueue.sort((a, b) => {
      const priorityDiff = this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority);
      if (priorityDiff !== 0) return priorityDiff;

      // Se mesma prioridade, ordenar por timestamp (FIFO)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Obtém valor numérico da prioridade
   */
  private getPriorityValue(priority: 'high' | 'medium' | 'low'): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  /**
   * Atualiza estatísticas
   */
  private updateStats(): void {
    const total = this.stats.totalLoaded + this.stats.totalFailed;
    this.stats.successRate = total > 0 ? (this.stats.totalLoaded / total) * 100 : 0;

    // Calcular tempo médio de carregamento
    const loadedItems = Array.from(this.imageCache.values());
    if (loadedItems.length > 0) {
      // Esta é uma aproximação, pois não temos acesso direto aos tempos
      this.stats.averageLoadTime = 1000; // Placeholder
    }

    this.statsSubject.next({ ...this.stats });
  }

  /**
   * Configura o número máximo de carregamentos simultâneos
   */
  setMaxConcurrentLoads(max: number): void {
    this.maxConcurrentLoads = Math.max(1, Math.min(max, 10));
    console.log(`⚙️ Max concurrent loads set to: ${this.maxConcurrentLoads}`);
  }

  /**
   * Limpa itens antigos da fila (mais de 5 minutos)
   */
  cleanupOldItems(): void {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const initialLength = this.preloadQueue.length;

    this.preloadQueue = this.preloadQueue.filter(item =>
      item.timestamp > fiveMinutesAgo || item.status === 'loading'
    );

    const removed = initialLength - this.preloadQueue.length;
    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} old preload items`);
    }
  }
}
