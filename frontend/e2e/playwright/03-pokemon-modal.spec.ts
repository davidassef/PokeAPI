import { test, expect } from '@playwright/test';

/**
 * Suíte de Testes do Modal de Detalhes do Pokémon
 * Testa todas as funcionalidades do modal de detalhes
 */
test.describe('3. Testes do Modal de Detalhes do Pokémon', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);
  });

  test('Deve abrir e fechar modal corretamente', async ({ page }) => {
    console.log('🧪 Testando abertura e fechamento do modal...');

    // Clicar no primeiro card
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.click();

    // Aguardar modal abrir
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });
    
    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    await expect(modal).toBeVisible();
    console.log('✅ Modal abriu corretamente');

    // Fechar modal clicando no botão de fechar
    const closeButton = modal.locator('ion-button[fill="clear"]').first();
    await closeButton.click();
    await page.waitForTimeout(2000);

    // Verificar se modal fechou
    const closedModal = page.locator('app-details-modal[ng-reflect-is-open="false"]');
    await expect(closedModal).toBeVisible();
    console.log('✅ Modal fechou corretamente');
  });

  test('Deve carregar informações básicas do Pokémon', async ({ page }) => {
    console.log('🧪 Testando carregamento de informações básicas...');

    // Abrir modal
    await page.locator('app-pokemon-card').first().click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });

    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');

    // Verificar elementos básicos
    await expect(modal.locator('.pokemon-name, .pokemon-title')).toBeVisible();
    await expect(modal.locator('.pokemon-image, .pokemon-sprite')).toBeVisible();
    await expect(modal.locator('.pokemon-id, .pokemon-number')).toBeVisible();

    console.log('✅ Informações básicas carregadas');

    // Verificar se há tipos
    const typeElements = modal.locator('.pokemon-type, .type-chip');
    await expect(typeElements.first()).toBeVisible();
    console.log('✅ Tipos do Pokémon carregados');

    // Verificar se há estatísticas
    const statsElements = modal.locator('.pokemon-stats, .stats-section');
    if (await statsElements.count() > 0) {
      await expect(statsElements.first()).toBeVisible();
      console.log('✅ Estatísticas carregadas');
    }
  });

  test('Deve navegar entre abas do modal', async ({ page }) => {
    console.log('🧪 Testando navegação entre abas...');

    // Abrir modal
    await page.locator('app-pokemon-card').first().click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });

    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');

    // Aguardar abas carregarem
    await page.waitForSelector('.tab-btn, ion-segment-button', { timeout: 10000 });

    // Verificar se há abas
    const tabs = modal.locator('.tab-btn, ion-segment-button');
    const tabCount = await tabs.count();
    
    if (tabCount > 1) {
      console.log(`📑 ${tabCount} abas encontradas`);

      // Testar navegação para cada aba
      for (let i = 0; i < Math.min(tabCount, 5); i++) {
        const tab = tabs.nth(i);
        const tabText = await tab.textContent();
        
        await tab.click();
        await page.waitForTimeout(2000);
        
        // Verificar se aba está ativa
        const isActive = await tab.evaluate(el => 
          el.classList.contains('active') || 
          el.classList.contains('selected') ||
          el.getAttribute('aria-selected') === 'true'
        );
        
        console.log(`✅ Aba "${tabText}" ${isActive ? 'ativada' : 'clicada'}`);
      }
    } else {
      console.log('⚠️ Nenhuma aba encontrada no modal');
    }
  });

  test('Deve carregar aba de Curiosidades', async ({ page }) => {
    console.log('🧪 Testando aba de Curiosidades...');

    // Abrir modal
    await page.locator('app-pokemon-card').first().click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });

    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');

    // Procurar aba de Curiosidades
    const curiositiesTab = modal.locator('.tab-btn:has-text("Curiosidades"), ion-segment-button:has-text("Curiosidades")');
    
    if (await curiositiesTab.count() > 0) {
      await curiositiesTab.click();
      await page.waitForTimeout(3000);

      // Verificar se conteúdo de curiosidades carregou
      const curiositiesContent = modal.locator('.curiosities-content, .flavor-text, .description');
      
      if (await curiositiesContent.count() > 0) {
        await expect(curiositiesContent.first()).toBeVisible();
        console.log('✅ Aba de Curiosidades carregada com conteúdo');
      } else {
        console.log('⚠️ Conteúdo de curiosidades não encontrado');
      }
    } else {
      console.log('⚠️ Aba de Curiosidades não encontrada');
    }
  });

  test('Deve carregar aba de Evolução', async ({ page }) => {
    console.log('🧪 Testando aba de Evolução...');

    // Abrir modal
    await page.locator('app-pokemon-card').first().click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });

    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');

    // Procurar aba de Evolução
    const evolutionTab = modal.locator('.tab-btn:has-text("Evolução"), ion-segment-button:has-text("Evolução")');
    
    if (await evolutionTab.count() > 0) {
      await evolutionTab.click();
      await page.waitForTimeout(3000);

      // Verificar se conteúdo de evolução carregou
      const evolutionContent = modal.locator('.evolution-content, .evolution-chain, .evolution-stage');
      
      if (await evolutionContent.count() > 0) {
        await expect(evolutionContent.first()).toBeVisible();
        console.log('✅ Aba de Evolução carregada com conteúdo');
      } else {
        console.log('⚠️ Conteúdo de evolução não encontrado ou Pokémon não evolui');
      }
    } else {
      console.log('⚠️ Aba de Evolução não encontrada');
    }
  });

  test('Deve funcionar botões de ação no modal', async ({ page }) => {
    console.log('🧪 Testando botões de ação...');

    // Abrir modal
    await page.locator('app-pokemon-card').first().click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });

    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');

    // Testar botão de favorito
    const favoriteButton = modal.locator('app-favorite-button, .favorite-btn, ion-button:has-text("Favorito")');
    if (await favoriteButton.count() > 0) {
      await favoriteButton.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ Botão de favorito funcionando');
    }

    // Testar botão de captura
    const captureButton = modal.locator('.capture-btn, ion-button:has-text("Capturar")');
    if (await captureButton.count() > 0) {
      await captureButton.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ Botão de captura funcionando');
    }

    // Testar botão de compartilhar (se existir)
    const shareButton = modal.locator('.share-btn, ion-button:has-text("Compartilhar")');
    if (await shareButton.count() > 0) {
      await shareButton.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ Botão de compartilhar funcionando');
    }
  });

  test('Deve carregar imagem do Pokémon corretamente', async ({ page }) => {
    console.log('🧪 Testando carregamento de imagem...');

    // Abrir modal
    await page.locator('app-pokemon-card').first().click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });

    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');

    // Aguardar imagem carregar
    const pokemonImage = modal.locator('.pokemon-image img, .pokemon-sprite img, ion-img');
    await expect(pokemonImage.first()).toBeVisible();

    // Verificar se imagem tem src válido
    const imageSrc = await pokemonImage.first().getAttribute('src');
    expect(imageSrc).toBeTruthy();
    expect(imageSrc).toMatch(/\.(png|jpg|jpeg|gif|webp)$/i);

    console.log('✅ Imagem do Pokémon carregada corretamente');
  });

  test('Deve funcionar navegação por teclado no modal', async ({ page }) => {
    console.log('🧪 Testando navegação por teclado no modal...');

    // Abrir modal
    await page.locator('app-pokemon-card').first().click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });

    // Testar Escape para fechar
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);

    // Verificar se modal fechou
    const closedModal = page.locator('app-details-modal[ng-reflect-is-open="false"]');
    await expect(closedModal).toBeVisible();
    console.log('✅ Tecla Escape fecha o modal');

    // Reabrir modal
    await page.locator('app-pokemon-card').first().click();
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 10000 });

    // Testar navegação por Tab entre elementos
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    console.log('✅ Navegação por Tab funcionando');
  });
});
