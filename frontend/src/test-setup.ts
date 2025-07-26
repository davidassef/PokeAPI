/**
 * Test Setup Configuration para PokeAPIApp
 * 
 * Este arquivo configura o ambiente de testes para o Angular
 * com Jasmine e Karma.
 */

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// Configurar o ambiente de teste do Angular
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

// Configurações globais para testes
declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    keys(): string[];
    <T>(id: string): T;
  };
};

// Configurar mocks globais
beforeEach(() => {
  // Mock do localStorage
  let store: { [key: string]: string } = {};
  
  spyOn(localStorage, 'getItem').and.callFake((key: string): string | null => {
    return store[key] || null;
  });
  
  spyOn(localStorage, 'setItem').and.callFake((key: string, value: string): void => {
    store[key] = value;
  });
  
  spyOn(localStorage, 'removeItem').and.callFake((key: string): void => {
    delete store[key];
  });
  
  spyOn(localStorage, 'clear').and.callFake((): void => {
    store = {};
  });
  
  // Mock do sessionStorage
  let sessionStore: { [key: string]: string } = {};
  
  spyOn(sessionStorage, 'getItem').and.callFake((key: string): string | null => {
    return sessionStore[key] || null;
  });
  
  spyOn(sessionStorage, 'setItem').and.callFake((key: string, value: string): void => {
    sessionStore[key] = value;
  });
  
  spyOn(sessionStorage, 'removeItem').and.callFake((key: string): void => {
    delete sessionStore[key];
  });
  
  spyOn(sessionStorage, 'clear').and.callFake((): void => {
    sessionStore = {};
  });
});

// Configurar console para testes
const originalConsole = console;

beforeEach(() => {
  // Silenciar logs durante os testes (opcional)
  // spyOn(console, 'log').and.stub();
  // spyOn(console, 'warn').and.stub();
  // spyOn(console, 'error').and.stub();
});

afterEach(() => {
  // Restaurar console original se necessário
  // console = originalConsole;
});

// Helpers para testes
export class TestHelpers {
  /**
   * Cria um mock de usuário para testes
   */
  static createMockUser(overrides: any = {}) {
    return {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }
  
  /**
   * Cria um mock de Pokémon para testes
   */
  static createMockPokemon(overrides: any = {}) {
    return {
      id: 1,
      name: 'bulbasaur',
      types: [{ type: { name: 'grass', url: '' }, slot: 1 }],
      sprites: {
        front_default: 'test-image.png',
        front_shiny: 'test-shiny.png',
        back_default: 'test-back.png',
        back_shiny: 'test-back-shiny.png',
        other: {
          'official-artwork': { front_default: 'test-artwork.png' },
          home: { front_default: 'test-home.png', front_shiny: 'test-home-shiny.png' }
        }
      },
      height: 7,
      weight: 69,
      base_experience: 64,
      order: 1,
      abilities: [],
      stats: [],
      moves: [],
      species: { name: 'bulbasaur', url: '' },
      ...overrides
    };
  }
  
  /**
   * Cria um mock de resposta HTTP para testes
   */
  static createMockHttpResponse(data: any, status: number = 200) {
    return {
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      body: data,
      headers: new Headers(),
      url: 'http://test.com',
      ok: status >= 200 && status < 300
    };
  }
  
  /**
   * Simula um delay para testes assíncronos
   */
  static async delay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Cria um mock de evento para testes
   */
  static createMockEvent(type: string, data: any = {}) {
    return {
      type,
      target: {
        value: '',
        ...data
      },
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation'),
      ...data
    };
  }
}

// Matchers customizados para testes
beforeEach(() => {
  jasmine.addMatchers({
    toBeValidPokemon: () => ({
      compare: (actual: any) => {
        const pass = actual && 
                    typeof actual.id === 'number' && 
                    typeof actual.name === 'string' &&
                    Array.isArray(actual.types);
        
        return {
          pass,
          message: pass ? 
            `Expected ${actual} not to be a valid Pokemon` :
            `Expected ${actual} to be a valid Pokemon with id, name, and types`
        };
      }
    }),
    
    toBeValidUser: () => ({
      compare: (actual: any) => {
        const pass = actual && 
                    typeof actual.id === 'number' && 
                    typeof actual.email === 'string' &&
                    typeof actual.name === 'string';
        
        return {
          pass,
          message: pass ? 
            `Expected ${actual} not to be a valid User` :
            `Expected ${actual} to be a valid User with id, email, and name`
        };
      }
    })
  });
});

// Configurar timeout para testes assíncronos
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

// Exportar helpers para uso em testes
export { TestHelpers as default };
