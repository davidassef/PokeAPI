import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração da Suíte Completa de Testes E2E
 * PokeAPI Sync - Testes Abrangentes e Detalhados
 */
export default defineConfig({
  testDir: './comprehensive-tests',
  
  /* Configurações de execução */
  fullyParallel: false, // Executar sequencialmente para melhor controle
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  
  /* Configurações de relatório */
  reporter: [
    ['html', { 
      outputFolder: 'test-results/comprehensive-report',
      open: 'never'
    }],
    ['json', { 
      outputFile: 'test-results/comprehensive-results.json' 
    }],
    ['junit', { 
      outputFile: 'test-results/comprehensive-junit.xml' 
    }],
    ['list']
  ],
  
  /* Configurações globais */
  use: {
    /* URL base da aplicação */
    baseURL: 'http://localhost:8100',
    
    /* Configurações de trace e screenshots */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    /* Timeouts */
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    /* Configurações de rede */
    ignoreHTTPSErrors: true,
  },

  /* Configuração de projetos para diferentes cenários */
  projects: [
    {
      name: '01-navigation',
      testMatch: '01-navigation.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
    
    {
      name: '02-search-filters',
      testMatch: '02-search-filters.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
      dependencies: ['01-navigation'],
    },
    
    {
      name: '03-pokemon-modal',
      testMatch: '03-pokemon-modal.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
      dependencies: ['02-search-filters'],
    },
    
    {
      name: '04-favorites-capture',
      testMatch: '04-favorites-capture.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
      dependencies: ['03-pokemon-modal'],
    },
    
    {
      name: '05-responsiveness-mobile',
      testMatch: '05-responsiveness.spec.ts',
      use: { 
        ...devices['iPhone 12'],
      },
      dependencies: ['04-favorites-capture'],
    },
    
    {
      name: '05-responsiveness-tablet',
      testMatch: '05-responsiveness.spec.ts',
      use: { 
        ...devices['iPad Pro'],
      },
      dependencies: ['05-responsiveness-mobile'],
    },
    
    {
      name: '06-performance',
      testMatch: '06-performance.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
      dependencies: ['05-responsiveness-tablet'],
    },
    
    {
      name: '07-integration',
      testMatch: '07-integration.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
      dependencies: ['06-performance'],
    },
    
    {
      name: '08-accessibility',
      testMatch: '08-accessibility.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
      dependencies: ['07-integration'],
    },
  ],

  /* Configuração do servidor web local */
  webServer: {
    command: 'npm start',
    url: 'http://localhost:8100',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
