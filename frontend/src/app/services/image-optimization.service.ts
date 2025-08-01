import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';

/**
 * Serviço para otimização e cache de imagens de Pokémon.
 * 
 * Este serviço implementa:
 * - Carregamento otimizado de imagens com diferentes tamanhos
 * - Cache em memória e persistente
 * - Detecção de conexão lenta para ajuste de qualidade
 * - Placeholders personalizados baseados no ID do Pokémon
 * - Suporte a formatos modernos (WebP)
 * - Gerenciamento automático de cache
 */
@Injectable({
  providedIn: 'root'
})
export class ImageOptimizationService {
  private imageCache: Map<string, string> = new Map();
  private localCache: Storage | null = null;
  private readonly CACHE_KEY_PREFIX = 'img_cache_';
  private readonly MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms
  private readonly MAX_CACHE_SIZE = 100; // Máximo de imagens em cache

  constructor(
    private http: HttpClient,
    private storage: Storage
  ) {
    this.initStorage();
  }

  /**
   * Inicializa o sistema de cache persistente
   */
  async initStorage() {
    this.localCache = await this.storage.create();
    this.loadCachedImages();
  }

  /**
   * Carrega imagens otimizadas com cache, lazy loading e fallback.
   * 
   * Este método implementa uma estratégia completa de otimização:
   * 1. Verifica cache em memória primeiro
   * 2. Detecta qualidade de conexão
   * 3. Gera URL otimizada baseada no tamanho e dispositivo
   * 4. Armazena no cache após carregamento
   * 5. Fallback para URL original em caso de erro
   * 
   * @param url URL da imagem original da PokeAPI
   * @param size Tamanho desejado: 'small' (150px), 'medium' (300px), 'large' (600px)
   * @returns Observable com a URL da imagem otimizada ou em cache
   */
  getOptimizedImage(url: string, size: 'small' | 'medium' | 'large'): Observable<string> {
    // Se já temos no cache de memória, retorna imediatamente
    if (this.imageCache.has(url)) {
      return of(this.imageCache.get(url) as string);
    }

    // Determina qualidade baseada no tamanho e dispositivo
    const quality = this.getQualityForSize(size);

    // Verifica se está em rede lenta (simulação/detecção)
    const isSlowConnection = this.detectSlowConnection();

    // URL otimizada (usando serviço de otimização como exemplo)
    // Em produção, seria integrado com um serviço real como Cloudinary, Imgix, etc.
    const optimizedUrl = this.getOptimizedUrl(url, size, quality, isSlowConnection);

    return this.http.get(optimizedUrl, { responseType: 'blob' })
      .pipe(
        map(blob => URL.createObjectURL(blob)),
        tap(objectUrl => {
          // Armazena no cache de memória
          this.imageCache.set(url, objectUrl);

          // Armazena no cache persistente
          this.cacheBlobUrl(this.CACHE_KEY_PREFIX + url, objectUrl);

          // Gerencia tamanho do cache
          this.manageCacheSize();
        }),
        catchError(() => {
          console.warn('Failed to load optimized image, falling back to original');
          return of(url); // Fallback para URL original
        })
      );
  }

  /**
   * Cria um placeholder personalizado baseado no ID do Pokémon.
   * 
   * Gera um SVG colorido que serve como placeholder enquanto a imagem
   * real carrega, mantendo consistência visual baseada no ID do Pokémon.
   * 
   * @param pokemonId ID do Pokémon para gerar cor consistente
   * @returns URL de data URI com SVG placeholder colorido
   */
  createPlaceholder(pokemonId: number): string {
    // Gera cor baseada no ID do Pokemon para consistência visual
    const hue = (pokemonId * 137.5) % 360;
    const saturation = 75;
    const lightness = 85;

    // Cria SVG simples como placeholder
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="hsl(${hue}, ${saturation}%, ${lightness}%)" />
        <circle cx="100" cy="100" r="50" fill="rgba(255,255,255,0.5)" />
        <circle cx="100" cy="100" r="25" fill="rgba(0,0,0,0.2)" />
      </svg>
    `;

    // Converte para data URI
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  }

  /**
   * Pré-carrega imagens para Pokémons importantes.
   * 
   * Útil para carregar imagens de favoritos ou Pokémons
   * recentemente visualizados em background.
   * 
   * @param urls Lista de URLs para pré-carregar
   */
  preloadImages(urls: string[]): void {
    urls.forEach(url => {
      this.getOptimizedImage(url, 'small').subscribe();
    });
  }

  /**
   * Verifica se o dispositivo está em conexão lenta.
   * 
   * Usa a Network Information API para detectar qualidade
   * da conexão e ajustar estratégia de carregamento.
   * 
   * @returns true se conexão for lenta (3G, 2G ou < 1.5Mbps)
   */
  private detectSlowConnection(): boolean {
    // Na prática, usar Network Information API
    // https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
    // Simulação para exemplo:
    const connection = (navigator as any).connection;
    if (connection) {
      return connection.effectiveType === '3g' ||
             connection.effectiveType === '2g' ||
             connection.downlink < 1.5;
    }
    return false; // Fallback - assume conexão boa
  }

  /**
   * Determina qualidade ideal baseada no tamanho e dispositivo.
   * 
   * @param size Tamanho da imagem
   * @returns Qualidade em porcentagem (65-90%)
   */
  private getQualityForSize(size: string): number {
    switch (size) {
      case 'small': return 65;
      case 'medium': return 80;
      case 'large': return 90;
      default: return 80;
    }
  }

  /**
   * Gera URL otimizada para a imagem.
   * 
   * Em produção, integraria com serviço real de otimização
   * como Cloudinary, Imgix, ou similar.
   * 
   * @param url URL original da imagem
   * @param size Tamanho desejado
   * @param quality Qualidade da imagem
   * @param isSlowConnection Se a conexão é lenta
   * @returns URL otimizada
   */
  private getOptimizedUrl(url: string, size: string, quality: number, isSlowConnection: boolean): string {
    // Em produção: integrar com serviço real de otimização de imagens
    // Exemplo com serviço fictício:
    const width = this.getSizeInPixels(size, isSlowConnection);
    const format = this.supportsWebP() ? 'webp' : 'jpg';

    // Simulação - em produção usar serviço real
    // return `https://image-optimizer.example/convert?url=${encodeURIComponent(url)}&width=${width}&format=${format}&quality=${quality}`;

    // Para o exemplo, retornamos a URL original:
    return url;
  }

  /**
   * Verifica suporte a WebP no navegador.
   * 
   * @returns true se o navegador suporta WebP
   */
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false;
  }

  /**
   * Converte tamanho em pixels baseado no dispositivo e conexão.
   * 
   * @param size Tamanho desejado
   * @param isSlowConnection Se a conexão é lenta
   * @returns Largura em pixels
   */
  private getSizeInPixels(size: string, isSlowConnection: boolean): number {
    // Reduz tamanho para conexões lentas
    const reductionFactor = isSlowConnection ? 0.7 : 1;

    switch (size) {
      case 'small': return Math.floor(150 * reductionFactor);
      case 'medium': return Math.floor(300 * reductionFactor);
      case 'large': return Math.floor(600 * reductionFactor);
      default: return Math.floor(300 * reductionFactor);
    }
  }

  /**
   * Armazena URL de blob no cache persistente.
   * 
   * Converte blob para base64 e armazena com timestamp
   * para controle de expiração.
   * 
   * @param key Chave do cache
   * @param blobUrl URL do blob a ser armazenado
   */
  private async cacheBlobUrl(key: string, blobUrl: string): Promise<void> {
    if (!this.localCache) return;

    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const cacheItem = {
          data: base64data,
          timestamp: Date.now()
        };
        await this.localCache?.set(key, JSON.stringify(cacheItem));
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error caching image:', error);
    }
  }

  /**
   * Carrega imagens do cache persistente para o cache de memória.
   * 
   * Remove itens expirados automaticamente durante o carregamento.
   */
  private async loadCachedImages(): Promise<void> {
    if (!this.localCache) return;

    // Lista todas as chaves armazenadas
    const keys = await this.localCache.keys();
    const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));

    for (const key of cacheKeys) {
      const cacheItemStr = await this.localCache.get(key);
      if (!cacheItemStr) continue;

      try {
        const cacheItem = JSON.parse(cacheItemStr);
        const timestamp = cacheItem.timestamp || 0;
        const originalUrl = key.substring(this.CACHE_KEY_PREFIX.length);

        // Verifica idade do cache
        if (Date.now() - timestamp <= this.MAX_CACHE_AGE_MS) {
          this.imageCache.set(originalUrl, cacheItem.data);
        } else {
          // Remove itens expirados
          await this.localCache.remove(key);
        }
      } catch (error) {
        console.error('Error parsing cached image:', error);
        await this.localCache.remove(key);
      }
    }
  }

  /**
   * Gerencia tamanho do cache, remove itens mais antigos se necessário.
   * 
   * Mantém o cache dentro do limite máximo removendo 20% dos
   * itens mais antigos quando necessário.
   */
  private async manageCacheSize(): Promise<void> {
    if (!this.localCache) return;

    if (this.imageCache.size <= this.MAX_CACHE_SIZE) return;

    // Remove 20% dos itens mais antigos
    const keysToRemove = Math.floor(this.MAX_CACHE_SIZE * 0.2);
    const keys = Array.from(this.imageCache.keys());

    // Em produção, remover baseado em timestamp armazenado
    // Aqui estamos apenas removendo os primeiros da lista
    for (let i = 0; i < keysToRemove; i++) {
      const key = keys[i];
      this.imageCache.delete(key);
      await this.localCache.remove(this.CACHE_KEY_PREFIX + key);
    }
  }

  /**
   * Limpa todo o cache de imagens
   */
  public async clearImageCache(): Promise<void> {
    this.imageCache.clear();

    if (!this.localCache) return;

    const keys = await this.localCache.keys();
    for (const key of keys) {
      if (key.startsWith(this.CACHE_KEY_PREFIX)) {
        await this.localCache.remove(key);
      }
    }
  }
}
