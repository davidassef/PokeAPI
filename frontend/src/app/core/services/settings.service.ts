import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { AppSettings } from '../../models/app.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly SETTINGS_KEY = 'app-settings';
  private settingsSubject = new BehaviorSubject<AppSettings>({
    language: 'pt-BR',
    theme: 'light',
    darkMode: false,
    soundEnabled: true,
    musicEnabled: true,
    vibrationEnabled: true,
    pokemonPerPage: 20,
    autoPlayMusic: false,
    favoriteType: 'all',
    musicVolume: 0.7,
    soundVolume: 0.5
  });

  public settings$ = this.settingsSubject.asObservable();
  private storageReady: Promise<void>;

  constructor(
    private storage: Storage,
    private translate: TranslateService
  ) {
    this.storageReady = this.initStorage();
    this.loadSettings();
  }

  private async initStorage(): Promise<void> {
    await this.storage.create();
  }

  async loadSettings(): Promise<void> {
    await this.storageReady;
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
    await this.storageReady;
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
  }

  async updateLanguage(language: 'pt-BR' | 'en-US' | 'es-ES' | 'ja-JP'): Promise<void> {
    await this.storageReady;
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
    body.classList.remove('dark-theme', 'light-theme');
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
    } else {
      body.classList.add(`${theme}-theme`);
    }
  }

  getCurrentSettings(): AppSettings {
    return this.settingsSubject.value;
  }

  async resetSettings(): Promise<void> {
    await this.storageReady;
    const defaultSettings: AppSettings = {
      language: 'pt-BR',
      theme: 'light',
      darkMode: false,
      soundEnabled: true,
      musicEnabled: true,
      vibrationEnabled: true,
      pokemonPerPage: 20,
      autoPlayMusic: false,
      favoriteType: 'all',
      musicVolume: 0.7,
      soundVolume: 0.5
    };
    await this.storage.remove(this.SETTINGS_KEY);
    this.settingsSubject.next(defaultSettings);
    this.applySettings(defaultSettings);
  }

  async exportSettings(): Promise<string> {
    await this.storageReady;
    const settings = this.getCurrentSettings();
    return JSON.stringify(settings, null, 2);
  }

  async importSettings(settingsJson: string): Promise<void> {
    await this.storageReady;
    try {
      const settings = JSON.parse(settingsJson) as AppSettings;
      await this.saveSettings(settings);
    } catch (error) {
      console.error('Erro ao importar configurações:', error);
      throw new Error('Formato de configurações inválido');
    }
  }
}
