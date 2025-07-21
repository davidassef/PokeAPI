import { test, expect } from '@playwright/test';

/**
 * Teste de Debug para Investigar Estrutura da Aplicação
 */
test.describe('Debug - Estrutura da Aplicação', () => {
  test('Deve investigar estrutura da aplicação', async ({ page }) => {
    console.log('🔍 Investigando estrutura da aplicação...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(5000);

    // Investigar estrutura das páginas
    console.log('\n📋 Investigando tabs disponíveis...');
    const tabs = await page.locator('ion-tab-button').all();
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const tabValue = await tab.getAttribute('tab');
      const tabText = await tab.textContent();
      console.log(`Tab ${i}: ${tabValue} - "${tabText}"`);
    }

    // Testar navegação para captured
    console.log('\n🧪 Testando navegação para captured...');
    await page.click('ion-tab-button[tab="captured"]');
    await page.waitForTimeout(3000);
    
    // Investigar conteúdo da página captured
    const capturedSelectors = [
      '.captured-content',
      '.captured-page',
      'app-captured',
      'ion-content',
      '.content',
      'main'
    ];

    for (const selector of capturedSelectors) {
      const element = page.locator(selector);
      const count = await element.count();
      if (count > 0) {
        console.log(`✅ Seletor encontrado: ${selector} (${count} elementos)`);
      } else {
        console.log(`❌ Seletor não encontrado: ${selector}`);
      }
    }

    // Investigar estrutura geral da página
    console.log('\n📊 Estrutura geral da página captured:');
    const bodyHTML = await page.locator('body').innerHTML();
    const lines = bodyHTML.split('\n').slice(0, 20);
    lines.forEach((line, index) => {
      if (line.trim()) {
        console.log(`${index + 1}: ${line.trim().substring(0, 100)}...`);
      }
    });

    // Voltar para home e investigar filtros
    console.log('\n🏠 Voltando para home...');
    await page.click('ion-tab-button[tab="home"]');
    await page.waitForTimeout(3000);

    // Investigar botões de filtro
    console.log('\n🔍 Investigando botões de filtro...');
    const filterSelectors = [
      '.filter-toggle-btn',
      '.filter-btn',
      'ion-button:has-text("Filtros")',
      'ion-button:has-text("Filter")',
      '[data-testid="filter-button"]',
      '.search-filter-toggle'
    ];

    for (const selector of filterSelectors) {
      const element = page.locator(selector);
      const count = await element.count();
      if (count > 0) {
        console.log(`✅ Botão de filtro encontrado: ${selector} (${count} elementos)`);
        const text = await element.first().textContent();
        console.log(`   Texto: "${text}"`);
      } else {
        console.log(`❌ Botão de filtro não encontrado: ${selector}`);
      }
    }

    // Investigar modal
    console.log('\n🔍 Testando abertura de modal...');
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.click();
    await page.waitForTimeout(3000);

    // Investigar seletores de modal
    const modalSelectors = [
      'app-details-modal[ng-reflect-is-open="true"]',
      'app-details-modal',
      'ion-modal',
      '.modal',
      '[role="dialog"]'
    ];

    for (const selector of modalSelectors) {
      const element = page.locator(selector);
      const count = await element.count();
      if (count > 0) {
        console.log(`✅ Modal encontrado: ${selector} (${count} elementos)`);
        const isVisible = await element.first().isVisible();
        console.log(`   Visível: ${isVisible}`);
      } else {
        console.log(`❌ Modal não encontrado: ${selector}`);
      }
    }

    // Investigar botões de fechar modal
    console.log('\n🔍 Investigando botões de fechar modal...');
    const closeSelectors = [
      'app-details-modal ion-button[fill="clear"]',
      'ion-button:has-text("Fechar")',
      'ion-button:has-text("Close")',
      '.close-btn',
      '.modal-close',
      'ion-button[aria-label="close"]'
    ];

    for (const selector of closeSelectors) {
      const element = page.locator(selector);
      const count = await element.count();
      if (count > 0) {
        console.log(`✅ Botão de fechar encontrado: ${selector} (${count} elementos)`);
      } else {
        console.log(`❌ Botão de fechar não encontrado: ${selector}`);
      }
    }

    console.log('\n✅ Investigação concluída!');
  });
});
