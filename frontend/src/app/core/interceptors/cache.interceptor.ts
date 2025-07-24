import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';

/**
 * Interceptor HTTP para cache automático de requisições
 */
@Injectable()
export class CacheInterceptor implements HttpInterceptor {

  // URLs que devem ser cacheadas
  private cacheableUrls = [
    '/pokemon/',
    '/pokemon-species/',
    '/type/',
    '/ability/',
    '/move/',
    '/item/',
    '/location/',
    '/region/',
    '/generation/'
  ];

  // URLs que NÃO devem ser cacheadas
  private nonCacheableUrls = [
    '/auth/',
    '/user/',
    '/captured/',
    '/favorites/',
    '/admin/'
  ];

  // TTL específico por tipo de recurso (em milissegundos)
  private ttlByResource: { [key: string]: number } = {
    '/pokemon/': 2 * 60 * 60 * 1000,        // 2 horas - dados estáticos
    '/pokemon-species/': 2 * 60 * 60 * 1000, // 2 horas - dados estáticos
    '/type/': 24 * 60 * 60 * 1000,          // 24 horas - dados muito estáticos
    '/ability/': 24 * 60 * 60 * 1000,       // 24 horas - dados muito estáticos
    '/move/': 24 * 60 * 60 * 1000,          // 24 horas - dados muito estáticos
    '/ranking/': 30 * 1000,                 // ✅ CORREÇÃO: 30 segundos - dados em tempo real
    '/item/': 12 * 60 * 60 * 1000,          // 12 horas - dados semi-estáticos
    '/location/': 12 * 60 * 60 * 1000,      // 12 horas - dados semi-estáticos
    '/region/': 24 * 60 * 60 * 1000,        // 24 horas - dados muito estáticos
    '/generation/': 24 * 60 * 60 * 1000     // 24 horas - dados muito estáticos
  };

  constructor(private cacheService: CacheService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Só cachear requisições GET
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    // Verificar se a URL deve ser cacheada
    if (!this.shouldCache(req.url)) {
      return next.handle(req);
    }

    // Gerar chave do cache
    const cacheKey = this.generateCacheKey(req);

    // Verificar se existe no cache
    if (this.cacheService.has(cacheKey)) {
      console.log(`🎯 HTTP Cache HIT: ${req.url}`);

      // Retornar do cache usando o método get
      return this.cacheService.get(cacheKey, () => {
        // Este fallback nunca deve ser chamado pois já verificamos que existe
        return next.handle(req);
      });
    }

    console.log(`❌ HTTP Cache MISS: ${req.url}`);

    // Fazer a requisição e cachear a resposta
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse && event.status === 200) {
          const ttl = this.getTTL(req.url);
          this.cacheService.set(cacheKey, event.body, ttl);
          console.log(`💾 HTTP Cache SET: ${req.url} (TTL: ${ttl / 1000}s)`);
        }
      }),
      catchError(error => {
        console.error(`❌ HTTP Error for ${req.url}:`, error);
        throw error;
      })
    );
  }

  /**
   * Verifica se uma URL deve ser cacheada
   */
  private shouldCache(url: string): boolean {
    // Verificar URLs que NÃO devem ser cacheadas
    if (this.nonCacheableUrls.some(pattern => url.includes(pattern))) {
      return false;
    }

    // Verificar URLs que DEVEM ser cacheadas
    return this.cacheableUrls.some(pattern => url.includes(pattern));
  }

  /**
   * Gera uma chave única para o cache baseada na requisição
   */
  private generateCacheKey(req: HttpRequest<any>): string {
    let key = `http_${req.method}_${req.url}`;

    // Incluir parâmetros de query na chave
    if (req.params.keys().length > 0) {
      const params = req.params.keys()
        .sort()
        .map(key => `${key}=${req.params.get(key)}`)
        .join('&');
      key += `?${params}`;
    }

    // Incluir headers relevantes (se houver)
    const relevantHeaders = ['accept-language', 'authorization'];
    relevantHeaders.forEach(headerName => {
      const headerValue = req.headers.get(headerName);
      if (headerValue) {
        key += `_${headerName}:${headerValue}`;
      }
    });

    return key;
  }

  /**
   * Obtém o TTL apropriado para uma URL
   */
  private getTTL(url: string): number {
    // Procurar por padrão específico
    for (const [pattern, ttl] of Object.entries(this.ttlByResource)) {
      if (url.includes(pattern)) {
        return ttl;
      }
    }

    // TTL padrão
    return 30 * 60 * 1000; // 30 minutos
  }

  /**
   * Invalida cache para URLs específicas
   */
  invalidateCache(urlPattern: string): void {
    const keys = this.cacheService.keys();
    const keysToDelete = keys.filter(key => key.includes(urlPattern));

    keysToDelete.forEach(key => {
      this.cacheService.delete(key);
    });

    if (keysToDelete.length > 0) {
      console.log(`🗑️ Cache invalidated: ${keysToDelete.length} items for pattern "${urlPattern}"`);
    }
  }

  /**
   * Invalida todo o cache HTTP
   */
  invalidateAllCache(): void {
    const keys = this.cacheService.keys();
    const httpKeys = keys.filter(key => key.startsWith('http_'));

    httpKeys.forEach(key => {
      this.cacheService.delete(key);
    });

    console.log(`🗑️ All HTTP cache invalidated: ${httpKeys.length} items`);
  }
}
