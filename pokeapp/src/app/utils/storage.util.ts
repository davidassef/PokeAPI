// Utilitário para persistência local (localStorage)
// Segue princípios de código limpo e testabilidade

export class StorageUtil {
  static get<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return fallback;
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silencia apenas erros de quota
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silencia apenas erros de quota
    }
  }
}
