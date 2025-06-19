/**
 * Interfaces para elementos de UI e configurações
 */

export interface QuickFilter {
  id: string;
  label: string;
  icon: string;
  active: boolean;
  color: string;
  backgroundColor: string;
  textColor: string;
  filterFunction?: (pokemon: any) => boolean;
}

export interface AudioSettings {
  enabled: boolean;
  volume: number;
  currentTrack?: string;
}

export interface AppSettings {
  language: string;
  audio: AudioSettings;
  theme?: 'light' | 'dark';
}

export interface ToastOptions {
  message: string;
  duration?: number;
  color?: 'success' | 'warning' | 'danger' | 'primary';
  position?: 'top' | 'bottom' | 'middle';
}

export interface LoadingOptions {
  message?: string;
  spinner?: 'bubbles' | 'circles' | 'dots';
  duration?: number;
}
