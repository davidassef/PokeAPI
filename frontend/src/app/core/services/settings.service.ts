import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { AppSettings } from '../../models/app.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly SETTINGS_KEY = 'app-settings';  private settingsSubject = new BehaviorSubject<AppSettings>({
    language: 'pt-BR',
    theme: 'light',
    darkMode: false,
    soundEnabled: true,
    musicEnabled: true,
    vibrationEnabled: true,
    pokemonPerPage: 20,
    showShinyChance: true,
    autoPlayMusic: false,
    favoriteType: 'all'
  });

  public settings$ = this.settingsSubject.asObservable();

  constructor(
    private storage: Storage,
    private translate: TranslateService
  ) {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    try {
      const settings = await this.storage.get(this.SETTINGS_KEY);
      if (settings) {
        this.settingsSubject.next(settings);
        this.applySettings(settings);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const currentSettings = this.settingsSubject.value;
      const newSettings = { ...currentSettings, ...settings };

      await this.storage.set(this.SETTINGS_KEY, newSettings);
      this.settingsSubject.next(newSettings);
      this.applySettings(newSettings);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      throw error;
    }
  }  async updateLanguage(language: 'pt-BR' | 'en-US' | 'es-ES'): Promise<void> {
    await this.storage.set('app-language', language);
    await this.saveSettings({ language });
    this.translate.use(language);
  }

  async updateTheme(theme: 'light' | 'dark' | 'auto'): Promise<void> {
    await this.saveSettings({ theme });
    this.applyTheme(theme);
  }

  private applySettings(settings: AppSettings): void {
    this.applyTheme(settings.theme);
    this.translate.use(settings.language);
  }

  private applyTheme(theme: 'light' | 'dark' | 'auto'): void {
    const body = document.body;

    // Remove classes de tema existentes
    body.classList.remove('dark-theme', 'light-theme');

    if (theme === 'auto') {
      // Detectar preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
    } else {
      body.classList.add(`${theme}-theme`);
    }
  }

  getCurrentSettings(): AppSettings {
    return this.settingsSubject.value;
  }

  async resetSettings(): Promise<void> {    const defaultSettings: AppSettings = {
      language: 'pt-BR',
      theme: 'light',
      darkMode: false,
      soundEnabled: true,
      musicEnabled: true,
      vibrationEnabled: true,
      pokemonPerPage: 20,
      showShinyChance: true,
      autoPlayMusic: false,
      favoriteType: 'all'
    };

    await this.storage.remove(this.SETTINGS_KEY);
    await this.storage.remove('app-language');
    this.settingsSubject.next(defaultSettings);
    this.applySettings(defaultSettings);
  }

  async exportSettings(): Promise<string> {
    const settings = this.getCurrentSettings();
    return JSON.stringify(settings, null, 2);
  }

  async importSettings(settingsJson: string): Promise<void> {
    try {
      const settings = JSON.parse(settingsJson) as AppSettings;
      await this.saveSettings(settings);
    } catch (error) {
      console.error('Erro ao importar configurações:', error);
      throw new Error('Formato de configurações inválido');
    }
  }
}
