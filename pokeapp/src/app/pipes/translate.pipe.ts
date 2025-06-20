import { Pipe, PipeTransform } from '@angular/core';
import { APP_TRANSLATIONS } from '../data/app-translations.data';

/**
 * Pipe de tradução simplificado e funcional
 * Corrige problemas de dependências não utilizadas
 */
@Pipe({
  name: 'translate',
  standalone: true,
})
export class TranslatePipe implements PipeTransform {
  private readonly defaultLanguage = 'pt';

  transform(key: string, language?: string): string {
    const lang = language || this.getStoredLanguage() || this.defaultLanguage;
    const translations = APP_TRANSLATIONS[lang as keyof typeof APP_TRANSLATIONS];
    
    if (!translations) {
      return key;
    }

    // Suporte para chaves aninhadas usando notação de ponto
    const value = this.getNestedProperty(translations, key);
    return value || key;
  }

  private getStoredLanguage(): string | null {
    try {
      return localStorage.getItem('app-language');
    } catch {
      return null;
    }
  }

  private getNestedProperty(obj: any, path: string): string | undefined {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
