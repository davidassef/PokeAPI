import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { APP_TRANSLATIONS } from '../data/app-translations.data';

@Injectable({
  providedIn: 'root',
})
export class LocalizationService {
  private currentLanguageSubject = new BehaviorSubject<string>('pt');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor() {
    // Carrega idioma salvo no localStorage
    const savedLanguage = localStorage.getItem('app-language');
    if (savedLanguage && this.isLanguageSupported(savedLanguage)) {
      this.currentLanguageSubject.next(savedLanguage);
    }
  }

  /**
   * Obtém tradução para uma chave específica
   */
  translate(key: string, params?: Record<string, any>): string {
    const currentLanguage = this.currentLanguageSubject.value;
    const translations = APP_TRANSLATIONS[currentLanguage] || APP_TRANSLATIONS['pt'];

    let translation = translations[key] || key;

    // Substitui parâmetros na tradução
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{${param}}`, params[param]);
      });
    }

    return translation;
  }

  /**
   * Define o idioma atual
   */
  setLanguage(language: string): void {
    if (this.isLanguageSupported(language)) {
      this.currentLanguageSubject.next(language);
      localStorage.setItem('app-language', language);
    }
  }

  /**
   * Obtém o idioma atual
   */
  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  /**
   * Obtém lista de idiomas suportados
   */
  getSupportedLanguages(): string[] {
    return Object.keys(APP_TRANSLATIONS);
  }

  /**
   * Verifica se um idioma é suportado
   */
  private isLanguageSupported(language: string): boolean {
    return Object.keys(APP_TRANSLATIONS).includes(language);
  }
}