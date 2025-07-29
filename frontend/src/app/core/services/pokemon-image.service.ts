/**
 * Serviço para gerenciamento de imagens dos Pokémons através do backend.
 *
 * Este serviço substitui a dependência direta de URLs externas (GitHub, PokeAPI)
 * por um sistema robusto que utiliza o cache de imagens do backend, melhorando
 * a confiabilidade e performance do carregamento de imagens.
 *
 * Funcionalidades:
 * - Carregamento de imagens através do backend
 * - Cache local no browser
 * - Fallback para placeholders
 * - Preload de imagens em lote
 * - Monitoramento de estatísticas
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap, retry, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Interface para informações de uma imagem de Pokémon.
 */
export interface PokemonImageInfo {
  pokemon_id: number;
  images: {
    [key: string]: {
      available: boolean;
      file_size: number;
      download_attempts: number;
      last_attempt: string | null;
      created_at: string;
      url: string;
    };
  };
  total_images: number;
}

/**
 * Interface para estatísticas do cache de imagens.
 */
export interface ImageCacheStats {
  cache_stats: {
    total_entries: number;
    downloaded: number;
    failed: number;
    pending: number;
    total_size_mb: number;
    cache_directory: string;
  };
  service_info: {
    max_download_attempts: number;
    retry_delay_hours: number;
    timeout_seconds: number;
    supported_types: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class PokemonImageService {

  // ===== CONFIGURAÇÃO =====

  /** URL base da API de imagens */
  private readonly apiUrl = `${environment.apiUrl}/images`;

  /** Tipos de imagem suportados */
  private readonly supportedTypes = [
    'official-artwork',
    'sprite',
    'sprite-shiny',
    'home',
    'home-shiny'
  ];

  /** Configurações de timeout e retry */
  private readonly config = {
    timeout: 15000,        // 15 segundos
    retryAttempts: 2,      // 2 tentativas
    cacheMaxAge: 86400000  // 24 horas em ms
  };

  // ===== CACHE LOCAL =====

  /** Cache de URLs de imagens no browser */
  private imageUrlCache = new Map<string, string>();

  /** Cache de timestamps para controle de expiração */
  private cacheTimestamps = new Map<string, number>();

  /** Subject para estatísticas do cache */
  private cacheStatsSubject = new BehaviorSubject<ImageCacheStats | null>(null);

  /** Observable público para estatísticas */
  public cacheStats$ = this.cacheStatsSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log(`[PokemonImageService] Inicializado com URL: ${this.apiUrl}`);
    this.loadCacheStats();
  }

  /**
   * Obtém a URL de uma imagem de Pokémon com sistema robusto de fallback.
   *
   * Utiliza o cache local primeiro, depois faz requisição ao backend.
   * O backend serve imagens cacheadas ou faz download em background.
   *
   * @param pokemonId - ID do Pokémon (1-1010+)
   * @param imageType - Tipo de imagem desejada
   * @param forceRefresh - Força atualização ignorando cache local
   * @returns Observable com a URL da imagem
   */
  getPokemonImageUrl(pokemonId: number, imageType: string = 'official-artwork', forceRefresh: boolean = false): Observable<string> {
    // Validação básica
    if (pokemonId < 1 || pokemonId > 1010) {
      console.warn(`[PokemonImageService] ID inválido: ${pokemonId}`);
      return of(this.getPlaceholderUrl(pokemonId, imageType));
    }

    if (!this.supportedTypes.includes(imageType)) {
      console.warn(`[PokemonImageService] Tipo não suportado: ${imageType}`);
      return of(this.getPlaceholderUrl(pokemonId, imageType));
    }

    const cacheKey = `${pokemonId}_${imageType}`;

    // Verifica cache local primeiro (se não forçar refresh)
    if (!forceRefresh && this.isInCache(cacheKey)) {
      const cachedUrl = this.imageUrlCache.get(cacheKey)!;
      console.debug(`[PokemonImageService] ✅ Cache hit: ${cacheKey}`);
      return of(cachedUrl);
    }

    console.info(`[PokemonImageService] 🔄 Carregando imagem: ${cacheKey}`);

    // Faz requisição ao backend
    const backendUrl = `${this.apiUrl}/pokemon/${pokemonId}?image_type=${imageType}`;

    return this.http.get(backendUrl, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      timeout(this.config.timeout),
      retry({
        count: this.config.retryAttempts,
        delay: (error, retryCount) => {
          console.warn(`[PokemonImageService] 🔄 Retry ${retryCount}/${this.config.retryAttempts} para ${cacheKey}`);
          // Delay exponencial: 1s, 2s, 4s...
          const delay = Math.pow(2, retryCount - 1) * 1000;
          return new Promise(resolve => setTimeout(resolve, delay));
        }
      }),
      map(response => {
        // Verifica se é placeholder
        const isPlaceholder = response.headers.get('X-Placeholder') === 'true';

        if (isPlaceholder) {
          console.debug(`[PokemonImageService] 📋 Placeholder recebido: ${cacheKey}`);
          // Agenda tentativa de download em background
          this.scheduleBackgroundDownload(pokemonId, imageType);
          return this.getPlaceholderUrl(pokemonId, imageType);
        }

        // Verifica se o blob é válido
        const blob = response.body!;
        if (!blob || blob.size < 500) {
          console.warn(`[PokemonImageService] ⚠️ Blob inválido ou muito pequeno: ${cacheKey}`);
          return this.getPlaceholderUrl(pokemonId, imageType);
        }

        // Cria URL do blob para a imagem
        const imageUrl = URL.createObjectURL(blob);

        // Armazena no cache
        this.cacheImageUrl(cacheKey, imageUrl);

        console.info(`[PokemonImageService] ✅ Imagem carregada: ${cacheKey} (${blob.size} bytes)`);
        return imageUrl;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`[PokemonImageService] ❌ Erro ao carregar ${cacheKey}:`, error);

        // Log detalhado do erro
        if (error.status === 0) {
          console.error(`[PokemonImageService] Erro de rede ou CORS para ${cacheKey}`);
        } else if (error.status >= 500) {
          console.error(`[PokemonImageService] Erro do servidor (${error.status}) para ${cacheKey}`);
        } else if (error.status === 404) {
          console.error(`[PokemonImageService] Imagem não encontrada (404) para ${cacheKey}`);
        }

        // Agenda tentativa de download em background para próxima vez
        this.scheduleBackgroundDownload(pokemonId, imageType);

        // Retorna placeholder em caso de erro
        const placeholderUrl = this.getPlaceholderUrl(pokemonId, imageType);
        return of(placeholderUrl);
      })
    );
  }

  /**
   * Obtém informações detalhadas sobre as imagens de um Pokémon.
   *
   * @param pokemonId - ID do Pokémon
   * @returns Observable com informações das imagens
   */
  getPokemonImageInfo(pokemonId: number): Observable<PokemonImageInfo> {
    const url = `${this.apiUrl}/pokemon/${pokemonId}/info`;

    return this.http.get<PokemonImageInfo>(url).pipe(
      timeout(this.config.timeout),
      catchError((error: HttpErrorResponse) => {
        console.error(`[PokemonImageService] Erro ao obter info do Pokémon ${pokemonId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Solicita preload de imagens de múltiplos Pokémons.
   *
   * @param pokemonIds - Lista de IDs dos Pokémons
   * @param imageTypes - Tipos de imagem a precarregar (opcional)
   * @returns Observable com confirmação do preload
   */
  preloadPokemonImages(pokemonIds: number[], imageTypes?: string[]): Observable<any> {
    const url = `${this.apiUrl}/preload`;
    const body = {
      pokemon_ids: pokemonIds,
      image_types: imageTypes || ['official-artwork']
    };

    return this.http.post(url, body).pipe(
      timeout(this.config.timeout),
      tap(response => {
        console.log(`[PokemonImageService] Preload solicitado:`, response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`[PokemonImageService] Erro no preload:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Carrega estatísticas do cache de imagens.
   *
   * @returns Observable com estatísticas do cache
   */
  loadCacheStats(): Observable<ImageCacheStats> {
    const url = `${this.apiUrl}/cache/stats`;

    return this.http.get<ImageCacheStats>(url).pipe(
      timeout(this.config.timeout),
      tap(stats => {
        this.cacheStatsSubject.next(stats);
        console.debug(`[PokemonImageService] Estatísticas atualizadas:`, stats);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`[PokemonImageService] Erro ao carregar estatísticas:`, error);
        return of({
          cache_stats: {
            total_entries: 0,
            downloaded: 0,
            failed: 0,
            pending: 0,
            total_size_mb: 0,
            cache_directory: ''
          },
          service_info: {
            max_download_attempts: 3,
            retry_delay_hours: 24,
            timeout_seconds: 30,
            supported_types: this.supportedTypes
          }
        });
      })
    );
  }

  /**
   * Limpa o cache local de imagens.
   */
  clearLocalCache(): void {
    // Revoga URLs de blob para liberar memória
    for (const url of this.imageUrlCache.values()) {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }

    this.imageUrlCache.clear();
    this.cacheTimestamps.clear();

    console.log(`[PokemonImageService] Cache local limpo`);
  }

  /**
   * Obtém estatísticas do cache local.
   *
   * @returns Estatísticas do cache local
   */
  getLocalCacheStats(): { size: number; oldestEntry: Date | null; newestEntry: Date | null } {
    const timestamps = Array.from(this.cacheTimestamps.values());

    return {
      size: this.imageUrlCache.size,
      oldestEntry: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null,
      newestEntry: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null
    };
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Verifica se uma imagem está no cache local e ainda é válida.
   */
  private isInCache(cacheKey: string): boolean {
    if (!this.imageUrlCache.has(cacheKey)) {
      return false;
    }

    const timestamp = this.cacheTimestamps.get(cacheKey);
    if (!timestamp) {
      return false;
    }

    // Verifica se não expirou
    const now = Date.now();
    const age = now - timestamp;

    if (age > this.config.cacheMaxAge) {
      // Remove entrada expirada
      const url = this.imageUrlCache.get(cacheKey);
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      this.imageUrlCache.delete(cacheKey);
      this.cacheTimestamps.delete(cacheKey);
      return false;
    }

    return true;
  }

  /**
   * Armazena uma URL de imagem no cache local.
   */
  private cacheImageUrl(cacheKey: string, imageUrl: string): void {
    this.imageUrlCache.set(cacheKey, imageUrl);
    this.cacheTimestamps.set(cacheKey, Date.now());
  }

  /**
   * Agenda download em background para uma imagem específica.
   *
   * @param pokemonId - ID do Pokémon
   * @param imageType - Tipo de imagem
   */
  private scheduleBackgroundDownload(pokemonId: number, imageType: string): void {
    // Evita múltiplas tentativas simultâneas
    const scheduleKey = `${pokemonId}_${imageType}`;
    if (this.pendingDownloads.has(scheduleKey)) {
      return;
    }

    this.pendingDownloads.add(scheduleKey);

    // Agenda para 5 segundos no futuro para não sobrecarregar
    setTimeout(() => {
      console.info(`[PokemonImageService] 🔄 Tentando download em background: ${scheduleKey}`);

      // Faz uma tentativa silenciosa de preload
      this.preloadPokemonImages([pokemonId], [imageType]).subscribe({
        next: (response) => {
          console.debug(`[PokemonImageService] ✅ Download em background agendado: ${scheduleKey}`);
        },
        error: (error) => {
          console.warn(`[PokemonImageService] ⚠️ Falha no agendamento de download: ${scheduleKey}`, error);
        },
        complete: () => {
          this.pendingDownloads.delete(scheduleKey);
        }
      });
    }, 5000);
  }

  /**
   * Força o download de uma imagem específica.
   *
   * @param pokemonId - ID do Pokémon
   * @param imageType - Tipo de imagem
   * @returns Observable com confirmação
   */
  forceDownloadImage(pokemonId: number, imageType: string = 'official-artwork'): Observable<any> {
    const url = `${this.apiUrl}/pokemon/${pokemonId}/force-download`;
    const body = { image_type: imageType };

    return this.http.post(url, body).pipe(
      timeout(this.config.timeout),
      tap(response => {
        console.log(`[PokemonImageService] 🔄 Download forçado solicitado:`, response);

        // Remove do cache local para forçar reload
        const cacheKey = `${pokemonId}_${imageType}`;
        if (this.imageUrlCache.has(cacheKey)) {
          const url = this.imageUrlCache.get(cacheKey)!;
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
          this.imageUrlCache.delete(cacheKey);
          this.cacheTimestamps.delete(cacheKey);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`[PokemonImageService] ❌ Erro no download forçado:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Gera URL de placeholder para um Pokémon.
   */
  private getPlaceholderUrl(pokemonId: number, imageType: string): string {
    // Retorna SVG placeholder inline
    const svg = `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2" rx="10"/>
        <circle cx="100" cy="80" r="30" fill="#ffffff" stroke="#333333" stroke-width="3"/>
        <path d="M70 80 L130 80" stroke="#333333" stroke-width="3"/>
        <circle cx="100" cy="80" r="8" fill="#ffffff" stroke="#333333" stroke-width="2"/>
        <text x="100" y="130" text-anchor="middle" font-family="Arial" font-size="12" fill="#6c757d">
          Pokémon #${pokemonId}
        </text>
        <text x="100" y="150" text-anchor="middle" font-family="Arial" font-size="10" fill="#adb5bd">
          ${imageType}
        </text>
      </svg>
    `)}`;

    return svg;
  }

  // ===== PROPRIEDADES PRIVADAS ADICIONAIS =====

  /** Set para controlar downloads pendentes */
  private pendingDownloads = new Set<string>();
}
