import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CacheService } from '../../../core/services/cache.service';

interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  hits: number;
  misses: number;
  evictions: number;
}

@Component({
  selector: 'app-cache-stats',
  templateUrl: './cache-stats.component.html',
  styleUrls: ['./cache-stats.component.scss']
})
export class CacheStatsComponent implements OnInit, OnDestroy {
  stats: CacheStats = {
    totalItems: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    hits: 0,
    misses: 0,
    evictions: 0
  };

  private destroy$ = new Subject<void>();

  constructor(private cacheService: CacheService) {}

  ngOnInit() {
    // Inscrever para atualizações de estatísticas
    this.cacheService.stats$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(stats => {
      this.stats = stats;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Formata tamanho em bytes para exibição
   */
  formatSize(bytes: number): string {
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
   * Obtém cor para taxa de hit
   */
  getHitRateColor(): string {
    if (this.stats.hitRate >= 80) return 'success';
    if (this.stats.hitRate >= 60) return 'warning';
    return 'danger';
  }

  /**
   * Limpa o cache
   */
  clearCache() {
    this.cacheService.clear();
  }

  /**
   * Força limpeza de itens expirados
   */
  cleanup() {
    this.cacheService.cleanup();
  }
}
