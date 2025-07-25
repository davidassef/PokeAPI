import { test, expect, Page } from '@playwright/test';

/**
 * Testes para investigar o problema do sistema de capturados
 * Os pokémons são capturados, aparecem na página, mas depois "zeram" sozinhos
 */

test.describe('Sistema de Capturados - Investigação de Problemas', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Interceptar requisições para monitorar API calls
    await page.route('**/api/v1/favorites**', async route => {
      console.log(`[API] ${route.request().method()} ${route.request().url()}`);
      await route.continue();
    });

    await page.route('**/api/v1/auth/**', async route => {
      console.log(`[AUTH] ${route.request().method()} ${route.request().url()}`);
      await route.continue();
    });

    // Navegar para a aplicação
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');
  });

  test('Deve reproduzir o problema de capturados zerando', async () => {
    console.log('=== TESTE: Reproduzindo problema de capturados zerando ===');

    // 1. Fazer login (se necessário)
    await ensureLoggedIn(page);

    // 2. Navegar para home e capturar alguns pokémons
    await page.goto('http://localhost:4200/mobile/home');
    await page.waitForLoadState('networkidle');

    // Capturar 3 pokémons diferentes
    const pokemonCards = await page.locator('app-pokemon-card').first(3);
    const capturedPokemons = [];

    for (let i = 0; i < 3; i++) {
      const card = pokemonCards.nth(i);
      const pokemonName = await card.locator('.pokemon-name').textContent();

      // Clicar no botão de captura
      await card.locator('.capture-btn').click();
      await page.waitForTimeout(1000); // Aguardar processamento

      capturedPokemons.push(pokemonName);
      console.log(`[CAPTURA] Pokémon capturado: ${pokemonName}`);
    }

    // 3. Verificar se aparecem na página de capturados
    await page.goto('http://localhost:4200/mobile/captured');
    await page.waitForLoadState('networkidle');

    // Verificar se os pokémons capturados estão na página
    for (const pokemonName of capturedPokemons) {
      const pokemonElement = page.locator(`text=${pokemonName}`);
      await expect(pokemonElement).toBeVisible({ timeout: 5000 });
      console.log(`[VERIFICAÇÃO] ${pokemonName} encontrado na página de capturados`);
    }

    const initialCount = await page.locator('app-pokemon-card').count();
    console.log(`[ESTADO INICIAL] ${initialCount} pokémons capturados encontrados`);

    // 4. Aguardar um tempo para ver se os dados "zeram"
    console.log('[AGUARDANDO] Monitorando por 30 segundos para detectar perda de dados...');

    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(5000);

      // Verificar localStorage
      const localStorage = await page.evaluate(() => {
        const keys = Object.keys(localStorage);
        const relevantKeys = keys.filter(key =>
          key.includes('captured') ||
          key.includes('favorite') ||
          key.includes('jwt') ||
          key.includes('auth')
        );

        const data = {};
        relevantKeys.forEach(key => {
          data[key] = localStorage.getItem(key);
        });
        return data;
      });

      console.log(`[STORAGE ${i*5}s]`, Object.keys(localStorage));

      // Verificar se ainda há pokémons na página
      const currentCount = await page.locator('app-pokemon-card').count();
      console.log(`[CONTAGEM ${i*5}s] ${currentCount} pokémons na página`);

      if (currentCount < initialCount) {
        console.log(`[PROBLEMA DETECTADO] Contagem diminuiu de ${initialCount} para ${currentCount}`);
        break;
      }
    }

    // 5. Verificar estado final
    const finalCount = await page.locator('app-pokemon-card').count();
    console.log(`[ESTADO FINAL] ${finalCount} pokémons capturados`);

    // 6. Verificar console errors
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('error') || msg.text().includes('Error')) {
        consoleMessages.push(msg.text());
      }
    });

    console.log('[CONSOLE ERRORS]', consoleMessages);
  });

  test('Deve monitorar requisições de autenticação', async () => {
    console.log('=== TESTE: Monitorando requisições de autenticação ===');

    const authRequests = [];
    const favoriteRequests = [];

    // Interceptar e logar todas as requisições de auth
    await page.route('**/api/v1/auth/**', async route => {
      const request = route.request();
      authRequests.push({
        method: request.method(),
        url: request.url(),
        timestamp: new Date().toISOString()
      });
      await route.continue();
    });

    // Interceptar e logar todas as requisições de favorites
    await page.route('**/api/v1/favorites**', async route => {
      const request = route.request();
      favoriteRequests.push({
        method: request.method(),
        url: request.url(),
        timestamp: new Date().toISOString()
      });
      await route.continue();
    });

    await ensureLoggedIn(page);

    // Navegar entre páginas e monitorar requisições
    const pages = [
      'http://localhost:4200/mobile/home',
      'http://localhost:4200/mobile/captured',
      'http://localhost:4200/mobile/ranking'
    ];

    for (const pageUrl of pages) {
      console.log(`[NAVEGAÇÃO] Indo para ${pageUrl}`);
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    console.log('[AUTH REQUESTS]', authRequests);
    console.log('[FAVORITE REQUESTS]', favoriteRequests);

    // Verificar se há muitas requisições de refresh token
    const refreshRequests = authRequests.filter(req => req.url.includes('refresh'));
    if (refreshRequests.length > 2) {
      console.log(`[PROBLEMA] Muitas requisições de refresh token: ${refreshRequests.length}`);
    }
  });

  test('Deve verificar persistência de dados no localStorage', async () => {
    console.log('=== TESTE: Verificando persistência no localStorage ===');

    await ensureLoggedIn(page);

    // Capturar um pokémon
    await page.goto('http://localhost:4200/mobile/home');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('app-pokemon-card').first();
    const pokemonName = await firstCard.locator('.pokemon-name').textContent();

    await firstCard.locator('.capture-btn').click();
    await page.waitForTimeout(2000);

    // Verificar localStorage após captura
    const storageAfterCapture = await page.evaluate(() => {
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('captured') || key.includes('favorite') || key.includes('jwt'))) {
          storage[key] = localStorage.getItem(key);
        }
      }
      return storage;
    });

    console.log('[STORAGE APÓS CAPTURA]', Object.keys(storageAfterCapture));

    // Aguardar e verificar se dados persistem
    await page.waitForTimeout(10000);

    const storageAfterWait = await page.evaluate(() => {
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('captured') || key.includes('favorite') || key.includes('jwt'))) {
          storage[key] = localStorage.getItem(key);
        }
      }
      return storage;
    });

    console.log('[STORAGE APÓS ESPERA]', Object.keys(storageAfterWait));

    // Comparar se houve mudanças
    const keysAfterCapture = Object.keys(storageAfterCapture);
    const keysAfterWait = Object.keys(storageAfterWait);

    if (keysAfterCapture.length !== keysAfterWait.length) {
      console.log(`[PROBLEMA] Chaves do localStorage mudaram: ${keysAfterCapture.length} -> ${keysAfterWait.length}`);
    }

    // Verificar se dados específicos mudaram
    for (const key of keysAfterCapture) {
      if (storageAfterCapture[key] !== storageAfterWait[key]) {
        console.log(`[MUDANÇA] ${key} mudou:`, {
          antes: storageAfterCapture[key]?.substring(0, 100),
          depois: storageAfterWait[key]?.substring(0, 100)
        });
      }
    }
  });

  test('✅ NOVO: Deve manter capturas após erro 401/403', async () => {
    console.log('=== TESTE: Validando correção do problema de capturados zerando ===');

    await ensureLoggedIn(page);

    // 1. Capturar alguns pokémons
    await page.goto('http://localhost:4200/mobile/home');
    await page.waitForLoadState('networkidle');

    const pokemonCards = await page.locator('app-pokemon-card').first(2);
    const capturedNames = [];

    for (let i = 0; i < 2; i++) {
      const card = pokemonCards.nth(i);
      const name = await card.locator('.pokemon-name').textContent();
      await card.locator('.capture-btn').click();
      await page.waitForTimeout(1000);
      capturedNames.push(name);
      console.log(`[CAPTURA] ${name} capturado`);
    }

    // 2. Verificar se aparecem na página de capturados
    await page.goto('http://localhost:4200/mobile/captured');
    await page.waitForLoadState('networkidle');

    for (const name of capturedNames) {
      await expect(page.locator(`text=${name}`)).toBeVisible();
      console.log(`[VERIFICAÇÃO] ${name} encontrado na página`);
    }

    const initialCount = await page.locator('app-pokemon-card').count();
    console.log(`[ESTADO INICIAL] ${initialCount} pokémons capturados`);

    // 3. Simular erro 401 interceptando requisições
    await page.route('**/api/v1/favorites/my-favorites', async route => {
      console.log('[SIMULAÇÃO] Interceptando requisição e retornando 401');
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' })
      });
    });

    // 4. Forçar nova requisição (navegar para outra página e voltar)
    await page.goto('http://localhost:4200/mobile/home');
    await page.waitForTimeout(1000);
    await page.goto('http://localhost:4200/mobile/captured');
    await page.waitForLoadState('networkidle');

    // 5. Verificar se os pokémons ainda estão lá (correção aplicada)
    const finalCount = await page.locator('app-pokemon-card').count();
    console.log(`[ESTADO FINAL] ${finalCount} pokémons capturados`);

    // ✅ VALIDAÇÃO: Com a correção, os pokémons devem permanecer
    expect(finalCount).toBeGreaterThanOrEqual(initialCount);

    for (const name of capturedNames) {
      await expect(page.locator(`text=${name}`)).toBeVisible();
      console.log(`[✅ SUCESSO] ${name} ainda está presente após erro 401`);
    }

    console.log('[✅ CORREÇÃO VALIDADA] Pokémons mantidos após erro de autenticação');
  });
});

async function ensureLoggedIn(page: Page) {
  // Verificar se já está logado
  const isLoggedIn = await page.evaluate(() => {
    return localStorage.getItem('jwt_token') !== null;
  });

  if (!isLoggedIn) {
    console.log('[LOGIN] Fazendo login...');

    // Ir para página de login
    await page.goto('http://localhost:4200/login');
    await page.waitForLoadState('networkidle');

    // Fazer login (ajustar credenciais conforme necessário)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');
    console.log('[LOGIN] Login realizado');
  } else {
    console.log('[LOGIN] Já está logado');
  }
}
