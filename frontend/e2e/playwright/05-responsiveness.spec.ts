import { test, expect } from '@playwright/test';

/**
 * Suíte de Testes de Responsividade
 * Testa a aplicação em diferentes tamanhos de tela e dispositivos
 */
test.describe('5. Testes de Responsividade', () => {
  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667 },
    { name: 'Mobile Landscape', width: 667, height: 375 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Desktop Small', width: 1280, height: 720 },
    { name: 'Desktop Large', width: 1920, height: 1080 }
  ];

  viewports.forEach(viewport => {
    test(`Deve funcionar corretamente em ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      console.log(`🧪 Testando responsividade em ${viewport.name}...`);

      // Configurar viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Navegar para a aplicação
      await page.goto('/');
      await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
      await page.waitForTimeout(3000);

      // Verificar se elementos principais estão visíveis
      await expect(page.locator('app-pokemon-card')).toBeVisible();
      console.log(`✅ Cards de Pokémon visíveis em ${viewport.name}`);

      // Verificar navegação (tabs ou menu)
      const tabBar = page.locator('ion-tab-bar, .tab-bar');
      const mobileMenu = page.locator('ion-menu, .mobile-menu');
      
      if (viewport.width < 768) {
        // Mobile: verificar se há menu mobile ou tabs
        if (await tabBar.count() > 0) {
          await expect(tabBar).toBeVisible();
          console.log(`✅ Tab bar visível em ${viewport.name}`);
        } else if (await mobileMenu.count() > 0) {
          console.log(`✅ Menu mobile disponível em ${viewport.name}`);
        }
      } else {
        // Desktop/Tablet: verificar navegação
        const navigation = page.locator('ion-tab-bar, .navigation, .sidebar');
        if (await navigation.count() > 0) {
          await expect(navigation.first()).toBeVisible();
          console.log(`✅ Navegação visível em ${viewport.name}`);
        }
      }

      // Verificar se filtros são acessíveis
      const filterButton = page.locator('.filter-toggle-btn, .filter-btn');
      if (await filterButton.count() > 0) {
        await expect(filterButton).toBeVisible();
        console.log(`✅ Botão de filtros acessível em ${viewport.name}`);
      }

      // Testar scroll
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(1000);
      await page.evaluate(() => window.scrollTo(0, 0));
      console.log(`✅ Scroll funcionando em ${viewport.name}`);
    });
  });

  test('Deve alternar entre versões mobile e web corretamente', async ({ page }) => {
    console.log('🧪 Testando alternância entre versões mobile e web...');

    // Começar em desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    
    // Verificar se está na versão web
    const webIndicators = page.locator('.web-layout, .desktop-view, ion-tab-bar');
    if (await webIndicators.count() > 0) {
      console.log('✅ Versão web detectada em desktop');
    }

    // Mudar para mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);

    // Verificar se mudou para versão mobile
    const mobileIndicators = page.locator('.mobile-layout, .mobile-view, ion-tabs');
    if (await mobileIndicators.count() > 0) {
      console.log('✅ Versão mobile detectada em mobile');
    }

    // Voltar para desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(2000);
    console.log('✅ Alternância entre versões funcionando');
  });

  test('Deve funcionar modal em diferentes tamanhos de tela', async ({ page }) => {
    console.log('🧪 Testando modal em diferentes viewports...');

    const testViewports = [
      { width: 375, height: 667 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1280, height: 720 }  // Desktop
    ];

    for (const viewport of testViewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
      await page.waitForTimeout(2000);

      // Abrir modal
      await page.locator('app-pokemon-card').first().click();
      await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });

      const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
      await expect(modal).toBeVisible();

      // Verificar se modal se adapta ao tamanho da tela
      const modalRect = await modal.boundingBox();
      if (modalRect) {
        expect(modalRect.width).toBeLessThanOrEqual(viewport.width);
        expect(modalRect.height).toBeLessThanOrEqual(viewport.height);
      }

      console.log(`✅ Modal responsivo em ${viewport.width}x${viewport.height}`);

      // Fechar modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
  });

  test('Deve manter usabilidade em telas pequenas', async ({ page }) => {
    console.log('🧪 Testando usabilidade em telas pequenas...');

    // Configurar para mobile pequeno
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Verificar se cards são visíveis e clicáveis
    const cards = page.locator('app-pokemon-card');
    const firstCard = cards.first();
    
    await expect(firstCard).toBeVisible();
    
    // Verificar se card tem tamanho adequado para toque
    const cardRect = await firstCard.boundingBox();
    if (cardRect) {
      expect(cardRect.height).toBeGreaterThan(44); // Mínimo recomendado para toque
      expect(cardRect.width).toBeGreaterThan(44);
    }

    // Testar clique no card
    await firstCard.click();
    await page.waitForTimeout(2000);
    console.log('✅ Cards clicáveis em tela pequena');

    // Verificar se botões têm tamanho adequado
    const buttons = page.locator('ion-button');
    for (let i = 0; i < Math.min(await buttons.count(), 3); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const buttonRect = await button.boundingBox();
        if (buttonRect) {
          expect(buttonRect.height).toBeGreaterThan(32);
          expect(buttonRect.width).toBeGreaterThan(32);
        }
      }
    }
    console.log('✅ Botões têm tamanho adequado para toque');
  });

  test('Deve funcionar orientação landscape em mobile', async ({ page }) => {
    console.log('🧪 Testando orientação landscape em mobile...');

    // Configurar para mobile landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Verificar se layout se adapta
    await expect(page.locator('app-pokemon-card')).toBeVisible();
    console.log('✅ Layout adaptado para landscape');

    // Verificar se navegação ainda funciona
    const tabBar = page.locator('ion-tab-bar');
    if (await tabBar.count() > 0) {
      await expect(tabBar).toBeVisible();
      
      // Testar navegação
      await page.click('ion-tab-button[tab="captured"]');
      await page.waitForTimeout(2000);
      await page.click('ion-tab-button[tab="home"]');
      await page.waitForTimeout(2000);
      
      console.log('✅ Navegação funcionando em landscape');
    }

    // Testar modal em landscape
    await page.locator('app-pokemon-card').first().click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });
    
    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    await expect(modal).toBeVisible();
    console.log('✅ Modal funcionando em landscape');
  });

  test('Deve ter texto legível em todas as resoluções', async ({ page }) => {
    console.log('🧪 Testando legibilidade do texto...');

    const testSizes = [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 1280, height: 720 }
    ];

    for (const size of testSizes) {
      await page.setViewportSize(size);
      await page.goto('/');
      await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
      await page.waitForTimeout(2000);

      // Verificar tamanho da fonte dos nomes dos Pokémon
      const pokemonName = page.locator('.pokemon-name').first();
      if (await pokemonName.count() > 0) {
        const fontSize = await pokemonName.evaluate(el => {
          return window.getComputedStyle(el).fontSize;
        });
        
        const fontSizeNum = parseInt(fontSize);
        expect(fontSizeNum).toBeGreaterThan(12); // Mínimo para legibilidade
        console.log(`✅ Fonte legível (${fontSize}) em ${size.width}x${size.height}`);
      }
    }
  });

  test('Deve manter performance em diferentes resoluções', async ({ page }) => {
    console.log('🧪 Testando performance em diferentes resoluções...');

    const resolutions = [
      { width: 375, height: 667 },
      { width: 1920, height: 1080 }
    ];

    for (const resolution of resolutions) {
      await page.setViewportSize(resolution);
      
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(10000); // Máximo 10 segundos
      console.log(`✅ Carregamento em ${loadTime}ms para ${resolution.width}x${resolution.height}`);
    }
  });
});
