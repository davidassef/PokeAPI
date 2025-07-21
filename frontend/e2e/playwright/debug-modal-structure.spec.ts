import { test, expect } from '@playwright/test';

/**
 * Teste de Debug para Investigar Estrutura do Modal
 */
test.describe('Debug - Estrutura do Modal', () => {
  test('Deve investigar estrutura detalhada do modal', async ({ page }) => {
    console.log('🔍 Investigando estrutura detalhada do modal...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Clicar no primeiro card
    console.log('📋 Clicando no primeiro card...');
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.click();
    await page.waitForTimeout(3000);

    // Investigar modal
    console.log('\n🔍 Investigando modal...');
    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    const modalExists = await modal.count() > 0;
    console.log(`Modal existe: ${modalExists}`);

    if (modalExists) {
      // Investigar conteúdo do modal
      console.log('\n📊 Conteúdo do modal:');
      const modalHTML = await modal.innerHTML();
      const lines = modalHTML.split('\n').slice(0, 30);
      lines.forEach((line, index) => {
        if (line.trim()) {
          console.log(`${index + 1}: ${line.trim().substring(0, 120)}...`);
        }
      });

      // Investigar seletores de nome
      console.log('\n🏷️ Investigando seletores de nome do Pokémon...');
      const nameSelectors = [
        '.pokemon-name',
        '.pokemon-title',
        'h1',
        'h2',
        'h3',
        '.name',
        '.title',
        '[data-testid="pokemon-name"]'
      ];

      for (const selector of nameSelectors) {
        const element = modal.locator(selector);
        const count = await element.count();
        if (count > 0) {
          const text = await element.first().textContent();
          console.log(`✅ ${selector}: "${text}" (${count} elementos)`);
        } else {
          console.log(`❌ ${selector}: não encontrado`);
        }
      }

      // Investigar botões de fechar
      console.log('\n🔍 Investigando botões de fechar...');
      const closeSelectors = [
        '.close-btn',
        '.close-button',
        'ion-button[fill="clear"]',
        'ion-button:has-text("Fechar")',
        'ion-button:has-text("Close")',
        '[aria-label="close"]',
        '[data-testid="close-button"]'
      ];

      for (const selector of closeSelectors) {
        const element = modal.locator(selector);
        const count = await element.count();
        if (count > 0) {
          const isVisible = await element.first().isVisible();
          const text = await element.first().textContent();
          console.log(`✅ ${selector}: "${text}" (${count} elementos, visível: ${isVisible})`);
        } else {
          console.log(`❌ ${selector}: não encontrado`);
        }
      }

      // Investigar abas
      console.log('\n📑 Investigando abas...');
      const tabSelectors = [
        '.tab-btn',
        '.tab-button',
        'ion-segment-button',
        '[role="tab"]',
        '.nav-tab'
      ];

      for (const selector of tabSelectors) {
        const element = modal.locator(selector);
        const count = await element.count();
        if (count > 0) {
          console.log(`✅ ${selector}: ${count} elementos`);
          for (let i = 0; i < Math.min(count, 5); i++) {
            const text = await element.nth(i).textContent();
            console.log(`   Aba ${i + 1}: "${text}"`);
          }
        } else {
          console.log(`❌ ${selector}: não encontrado`);
        }
      }

      // Tentar fechar modal com diferentes métodos
      console.log('\n🔧 Testando métodos de fechamento...');
      
      // Método 1: Escape
      console.log('Tentando Escape...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      
      const modalAfterEscape = await page.locator('app-details-modal[ng-reflect-is-open="true"]').count();
      if (modalAfterEscape === 0) {
        console.log('✅ Modal fechado com Escape');
        return;
      } else {
        console.log('❌ Modal não fechou com Escape');
      }

      // Método 2: Clicar fora
      console.log('Tentando clicar fora do modal...');
      await page.click('body', { position: { x: 10, y: 10 } });
      await page.waitForTimeout(1000);
      
      const modalAfterClickOutside = await page.locator('app-details-modal[ng-reflect-is-open="true"]').count();
      if (modalAfterClickOutside === 0) {
        console.log('✅ Modal fechado clicando fora');
        return;
      } else {
        console.log('❌ Modal não fechou clicando fora');
      }

      // Método 3: Botão close-btn (forçar)
      console.log('Tentando botão .close-btn (forçar)...');
      const closeBtn = modal.locator('.close-btn');
      if (await closeBtn.count() > 0) {
        try {
          await closeBtn.click({ force: true });
          await page.waitForTimeout(1000);
          
          const modalAfterCloseBtn = await page.locator('app-details-modal[ng-reflect-is-open="true"]').count();
          if (modalAfterCloseBtn === 0) {
            console.log('✅ Modal fechado com .close-btn (forçado)');
            return;
          } else {
            console.log('❌ Modal não fechou com .close-btn (forçado)');
          }
        } catch (error) {
          console.log(`❌ Erro ao clicar em .close-btn: ${error}`);
        }
      }

      // Método 4: Qualquer botão no modal
      console.log('Tentando qualquer botão no modal...');
      const anyButton = modal.locator('ion-button').first();
      if (await anyButton.count() > 0) {
        try {
          await anyButton.click({ force: true });
          await page.waitForTimeout(1000);
          console.log('✅ Clicou em algum botão do modal');
        } catch (error) {
          console.log(`❌ Erro ao clicar em botão: ${error}`);
        }
      }

    } else {
      console.log('❌ Modal não foi encontrado após clicar no card');
      
      // Investigar se há outros tipos de modal
      console.log('\n🔍 Procurando outros tipos de modal...');
      const otherModalSelectors = [
        'ion-modal',
        '.modal',
        '[role="dialog"]',
        'app-details-modal',
        '.pokemon-modal'
      ];

      for (const selector of otherModalSelectors) {
        const element = page.locator(selector);
        const count = await element.count();
        if (count > 0) {
          console.log(`✅ Encontrado: ${selector} (${count} elementos)`);
        } else {
          console.log(`❌ Não encontrado: ${selector}`);
        }
      }
    }

    console.log('\n✅ Investigação do modal concluída!');
  });
});
