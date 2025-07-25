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

  test('Deve verificar sincronização do ranking', async () => {
    console.log('=== TESTE: Verificando sincronização do estado de captura no ranking ===');

    await ensureLoggedIn(page);

    // 1. Ir para o ranking e identificar um pokémon
    await page.goto('http://localhost:4200/mobile/ranking');
    await page.waitForLoadState('networkidle');

    const firstRankingCard = page.locator('app-pokemon-card').first();
    const pokemonName = await firstRankingCard.locator('.pokemon-name').textContent();
    
    // Verificar estado inicial da pokébola (deve estar vazia)
    const initialCaptureBtn = firstRankingCard.locator('.capture-btn');
    const initialState = await initialCaptureBtn.getAttribute('class');
    console.log(`[RANKING] Estado inicial da pokébola para ${pokemonName}: ${initialState}`);

    // 2. Capturar o pokémon
    await initialCaptureBtn.click();
    await page.waitForTimeout(2000);

    // 3. Verificar se a pokébola mudou de estado no ranking
    const updatedState = await initialCaptureBtn.getAttribute('class');
    console.log(`[RANKING] Estado após captura para ${pokemonName}: ${updatedState}`);

    // ✅ VALIDAÇÃO: O estado deve ter mudado
    expect(updatedState).not.toBe(initialState);

    // 4. Navegar para página de capturados e verificar
    await page.goto('http://localhost:4200/mobile/captured');
    await page.waitForLoadState('networkidle');

    await expect(page.locator(`text=${pokemonName}`)).toBeVisible();
    console.log(`[✅ SUCESSO] ${pokemonName} encontrado na página de capturados`);

    // 5. Voltar ao ranking e verificar se ainda está capturado
    await page.goto('http://localhost:4200/mobile/ranking');
    await page.waitForLoadState('networkidle');

    const finalRankingCard = page.locator('app-pokemon-card').first();
    const finalCaptureBtn = finalRankingCard.locator('.capture-btn');
    const finalState = await finalCaptureBtn.getAttribute('class');
    
    console.log(`[RANKING] Estado final da pokébola para ${pokemonName}: ${finalState}`);
    
    // ✅ VALIDAÇÃO: Deve manter o estado capturado
    expect(finalState).toBe(updatedState);
    console.log('[✅ SINCRONIZAÇÃO VALIDADA] Estado de captura sincronizado no ranking');
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
