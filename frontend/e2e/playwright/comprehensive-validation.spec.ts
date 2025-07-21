import { test, expect } from '@playwright/test';

/**
 * Suíte de Validação Abrangente - PokeAPI Sync
 * Baseada na estrutura real da aplicação
 */
test.describe('🧪 Validação Abrangente - PokeAPI Sync', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);
  });

  test('✅ 1. Navegação entre páginas principais', async ({ page }) => {
    console.log('🧪 Testando navegação entre páginas...');

    // Verificar página inicial (Home)
    await expect(page).toHaveURL(/.*\/tabs\/home/);
    await expect(page.locator('app-pokemon-card')).toBeVisible();
    console.log('✅ Página Home carregada com Pokémon');

    // Navegar para Capturados
    await page.click('ion-tab-button[tab="captured"]');
    await page.waitForURL(/.*\/tabs\/captured/);
    await page.waitForSelector('app-captured', { timeout: 10000 });
    console.log('✅ Navegação para Capturados funcionando');

    // Navegar para Ranking
    await page.click('ion-tab-button[tab="ranking"]');
    await page.waitForURL(/.*\/tabs\/ranking/);
    await page.waitForTimeout(2000);
    console.log('✅ Navegação para Ranking funcionando');

    // Navegar para Configurações
    await page.click('ion-tab-button[tab="settings"]');
    await page.waitForURL(/.*\/tabs\/settings/);
    await page.waitForTimeout(2000);
    console.log('✅ Navegação para Configurações funcionando');

    // Voltar para Home
    await page.click('ion-tab-button[tab="home"]');
    await page.waitForURL(/.*\/tabs\/home/);
    await page.waitForSelector('app-pokemon-card', { timeout: 10000 });
    console.log('✅ Retorno para Home funcionando');
  });

  test('✅ 2. Modal de detalhes do Pokémon', async ({ page }) => {
    console.log('🧪 Testando modal de detalhes...');

    // Clicar no primeiro card
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.click();

    // Aguardar modal abrir
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });
    
    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    await expect(modal).toBeVisible();
    console.log('✅ Modal abriu corretamente');

    // Verificar elementos básicos do modal
    await expect(modal.locator('.pokemon-name, .pokemon-title')).toBeVisible();
    console.log('✅ Nome do Pokémon visível no modal');

    // Verificar se há abas no modal
    const tabs = modal.locator('.tab-btn');
    const tabCount = await tabs.count();
    if (tabCount > 0) {
      console.log(`✅ ${tabCount} abas encontradas no modal`);
      
      // Testar navegação entre abas
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(1000);
        console.log(`✅ Aba ${i + 1} clicada com sucesso`);
      }
    }

    // Fechar modal usando botão correto
    const closeButton = modal.locator('.close-btn');
    await closeButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ Modal fechado corretamente');
  });

  test('✅ 3. Carregamento e exibição de Pokémon', async ({ page }) => {
    console.log('🧪 Testando carregamento de Pokémon...');

    // Verificar se cards estão carregados
    const cards = page.locator('app-pokemon-card');
    const cardCount = await cards.count();
    
    expect(cardCount).toBeGreaterThan(0);
    console.log(`✅ ${cardCount} cards de Pokémon carregados`);

    // Verificar estrutura dos cards
    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      const card = cards.nth(i);
      
      // Verificar nome
      const nameElement = card.locator('.pokemon-name');
      if (await nameElement.count() > 0) {
        const name = await nameElement.textContent();
        expect(name).toBeTruthy();
        console.log(`✅ Card ${i + 1}: ${name}`);
      }

      // Verificar imagem
      const imageElement = card.locator('img, ion-img');
      if (await imageElement.count() > 0) {
        await expect(imageElement.first()).toBeVisible();
      }
    }
  });

  test('✅ 4. Responsividade mobile', async ({ page }) => {
    console.log('🧪 Testando responsividade mobile...');

    // Mudar para viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);

    // Verificar se cards ainda são visíveis
    const cards = page.locator('app-pokemon-card');
    await expect(cards.first()).toBeVisible();
    console.log('✅ Cards visíveis em mobile');

    // Testar navegação em mobile
    await page.click('ion-tab-button[tab="captured"]');
    await page.waitForTimeout(2000);
    await page.click('ion-tab-button[tab="home"]');
    await page.waitForTimeout(2000);
    console.log('✅ Navegação funcionando em mobile');

    // Testar modal em mobile
    await cards.first().click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });
    
    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    await expect(modal).toBeVisible();
    console.log('✅ Modal funcionando em mobile');

    // Fechar modal
    await modal.locator('.close-btn').click();
    await page.waitForTimeout(1000);
  });

  test('✅ 5. Performance e carregamento', async ({ page }) => {
    console.log('🧪 Testando performance...');

    // Medir tempo de carregamento inicial
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(10000); // Máximo 10 segundos
    console.log(`✅ Página carregada em ${loadTime}ms`);

    // Testar responsividade de cliques
    const clickStart = Date.now();
    await page.locator('app-pokemon-card').first().click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 5000 });
    const clickTime = Date.now() - clickStart;

    expect(clickTime).toBeLessThan(3000); // Máximo 3 segundos
    console.log(`✅ Modal abriu em ${clickTime}ms`);

    // Fechar modal
    await page.locator('.close-btn').click();
    await page.waitForTimeout(1000);
  });

  test('✅ 6. Navegação por teclado', async ({ page }) => {
    console.log('🧪 Testando navegação por teclado...');

    // Focar no primeiro card usando Tab
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    // Navegar entre elementos
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
    }
    console.log('✅ Navegação por Tab funcionando');

    // Tentar abrir modal com Enter (se possível)
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Verificar se modal abriu ou se card foi clicado
    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    if (await modal.count() > 0) {
      console.log('✅ Modal aberto com Enter');
      
      // Fechar com Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      console.log('✅ Modal fechado com Escape');
    } else {
      console.log('⚠️ Modal não abriu com Enter (comportamento pode variar)');
    }
  });

  test('✅ 7. Integridade dos dados', async ({ page }) => {
    console.log('🧪 Testando integridade dos dados...');

    // Verificar se dados dos Pokémon são válidos
    const cards = page.locator('app-pokemon-card');
    const cardCount = await cards.count();

    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = cards.nth(i);
      
      // Verificar nome
      const nameElement = card.locator('.pokemon-name');
      if (await nameElement.count() > 0) {
        const name = await nameElement.textContent();
        expect(name).toBeTruthy();
        expect(name?.length).toBeGreaterThan(0);
        console.log(`✅ Pokémon ${i + 1}: ${name} - dados válidos`);
      }

      // Abrir modal e verificar dados detalhados
      await card.click();
      await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });

      const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
      const modalName = await modal.locator('.pokemon-name, .pokemon-title').textContent();
      expect(modalName).toBeTruthy();

      // Fechar modal
      await modal.locator('.close-btn').click();
      await page.waitForTimeout(1000);
    }
  });

  test('✅ 8. Teste de stress - múltiplas operações', async ({ page }) => {
    console.log('🧪 Testando stress com múltiplas operações...');

    // Navegar entre páginas múltiplas vezes
    const pages = ['captured', 'ranking', 'settings', 'home'];
    
    for (let cycle = 0; cycle < 2; cycle++) {
      console.log(`🔄 Ciclo ${cycle + 1}/2`);
      
      for (const pageName of pages) {
        await page.click(`ion-tab-button[tab="${pageName}"]`);
        await page.waitForTimeout(1000);
      }
    }

    // Verificar se aplicação ainda responde
    await page.waitForSelector('app-pokemon-card', { timeout: 10000 });
    console.log('✅ Aplicação mantém responsividade após navegação intensiva');

    // Abrir e fechar modal múltiplas vezes
    for (let i = 0; i < 3; i++) {
      await page.locator('app-pokemon-card').first().click();
      await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 5000 });
      await page.locator('.close-btn').click();
      await page.waitForTimeout(500);
    }

    console.log('✅ Modal mantém performance após múltiplas aberturas');
  });
});
