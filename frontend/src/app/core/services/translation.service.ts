import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

export interface TranslationRequest {
  q: string;
  source: string;
  target: string;
}

export interface TranslationResponse {
  translatedText: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  // LibreTranslate - API pública gratuita
  private readonly LIBRE_TRANSLATE_URL = 'https://libretranslate.de/translate';
  
  // Fallback para Google Translate (gratuito com limites)
  private readonly GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';
  
  // Cache para evitar traduções repetidas
  private translationCache = new Map<string, string>();
  
  // Limite de cache para evitar uso excessivo de memória
  private readonly MAX_CACHE_SIZE = 1000;

  constructor(
    private http: HttpClient,
    private translate: TranslateService
  ) {}

  /**
   * Traduz texto para o idioma atual do app
   */
  translateText(text: string, sourceLang: string = 'en'): Observable<string> {
    const currentLang = this.translate.currentLang || 'pt-BR';
    
    // Se o idioma atual é inglês, não precisa traduzir
    if (currentLang === 'en-US' || sourceLang === 'en') {
      return of(text);
    }
    
    // Se o idioma atual é espanhol e o texto já é em espanhol, não traduz
    if (currentLang === 'es-ES' && sourceLang === 'es') {
      return of(text);
    }
    
    // Verificar cache primeiro
    const cacheKey = `${text}_${sourceLang}_${currentLang}`;
    if (this.translationCache.has(cacheKey)) {
      return of(this.translationCache.get(cacheKey)!);
    }
    
    // Determinar idioma de destino
    const targetLang = this.getTargetLanguage(currentLang);
    
    // Tentar LibreTranslate primeiro
    return this.translateWithLibreTranslate(text, sourceLang, targetLang).pipe(
      catchError(() => {
        // Fallback para Google Translate
        return this.translateWithGoogleTranslate(text, sourceLang, targetLang);
      }),
      map(translatedText => {
        // Adicionar ao cache
        this.addToCache(cacheKey, translatedText);
        return translatedText;
      }),
      catchError(() => {
        // Se falhar, retornar texto original
        console.warn('Falha na tradução, retornando texto original:', text);
        return of(text);
      })
    );
  }

  /**
   * Traduz usando LibreTranslate
   */
  private translateWithLibreTranslate(text: string, source: string, target: string): Observable<string> {
    const request: TranslationRequest = {
      q: text,
      source: source,
      target: target
    };

    return this.http.post<TranslationResponse>(this.LIBRE_TRANSLATE_URL, request).pipe(
      map(response => response.translatedText)
    );
  }

  /**
   * Traduz usando Google Translate (fallback)
   */
  private translateWithGoogleTranslate(text: string, source: string, target: string): Observable<string> {
    const params = {
      client: 'gtx',
      sl: source,
      tl: target,
      dt: 't',
      q: text
    };

    return this.http.get(this.GOOGLE_TRANSLATE_URL, { params }).pipe(
      map((response: any) => {
        // Google Translate retorna array aninhado
        return response[0][0][0] || text;
      })
    );
  }

  /**
   * Converte código de idioma do app para código da API de tradução
   */
  private getTargetLanguage(appLang: string): string {
    switch (appLang) {
      case 'pt-BR':
        return 'pt';
      case 'es-ES':
        return 'es';
      case 'en-US':
        return 'en';
      default:
        return 'pt';
    }
  }

  /**
   * Adiciona tradução ao cache
   */
  private addToCache(key: string, value: string): void {
    // Limpar cache se estiver muito grande
    if (this.translationCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.translationCache.keys().next().value;
      this.translationCache.delete(firstKey);
    }
    
    this.translationCache.set(key, value);
  }

  /**
   * Limpa o cache de traduções
   */
  clearCache(): void {
    this.translationCache.clear();
  }

  /**
   * Verifica se o serviço está disponível
   */
  checkServiceAvailability(): Observable<boolean> {
    return this.http.get(this.LIBRE_TRANSLATE_URL, { 
      params: { q: 'test', source: 'en', target: 'pt' },
      observe: 'response'
    }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
} 