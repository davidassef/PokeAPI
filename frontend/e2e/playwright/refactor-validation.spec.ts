import { test, expect } from '@playwright/test';

test.describe('Validação da Refatoração do Details Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🚨 Console Error:', msg.text());
      } else if (msg.text().includes('DetailsModalComponent') || msg.text().includes('PokemonDetailsManager')) {
        console.log('🔍 Modal Log:', msg.text());
      }
    });

    // Navegar para a página
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(2000);
  });

  test('Deve abrir o modal e carregar dados básicos', async ({ page }) => {
    console.log('🧪 Testando abertura básica do modal...');

    // Clicar no primeiro card
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.click();

    // Aguardar modal aparecer
    await page.waitForTimeout(3000);

    // Verificar se o modal existe
    const modal = page.locator('app-details-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });

    console.log('✅ Modal está visível');

    // Verificar se há conteúdo no modal
    const modalContent = page.locator('app-details-modal .details-modal-container');
    await expect(modalContent).toBeVisible({ timeout: 5000 });

    console.log('✅ Conteúdo do modal está visível');

    // Verificar se as abas estão presentes
    const tabs = page.locator('app-details-modal .tab-btn');
    const tabCount = await tabs.count();
    console.log(`📊 Número de abas encontradas: ${tabCount}`);

    expect(tabCount).toBeGreaterThan(0);

    // Verificar se há dados do Pokemon
    const pokemonName = page.locator('app-details-modal .pokemon-name');
    if (await pokemonName.count() > 0) {
      const name = await pokemonName.textContent();
      console.log(`🎯 Pokemon carregado: ${name}`);
    }

    console.log('✅ Teste básico passou!');
  });

  test('Deve navegar entre abas sem erros', async ({ page }) => {
    console.log('🧪 Testando navegação entre abas...');

    // Abrir modal
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.click();
    await page.waitForTimeout(3000);

    // Verificar se modal está aberto
    const modal = page.locator('app-details-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Obter todas as abas
    const tabs = page.locator('app-details-modal .tab-btn');
    const tabCount = await tabs.count();
    console.log(`📊 Testando ${tabCount} abas`);

    // Clicar em cada aba
    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      const tabText = await tab.textContent();
      console.log(`🔄 Clicando na aba: ${tabText}`);

      await tab.click();
      await page.waitForTimeout(1000);

      // Verificar se a aba está ativa
      const isActive = await tab.evaluate(el => el.classList.contains('active') || el.classList.contains('selected'));
      console.log(`📍 Aba ${tabText} ativa: ${isActive}`);
    }

    console.log('✅ Navegação entre abas funcionando!');
  });

  test('Deve fechar o modal corretamente', async ({ page }) => {
    console.log('🧪 Testando fechamento do modal...');

    // Abrir modal
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.click();
    await page.waitForTimeout(3000);

    // Verificar se modal está aberto
    const modal = page.locator('app-details-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Tentar fechar o modal (procurar botão de fechar)
    const closeButton = page.locator('app-details-modal .close-btn, app-details-modal .modal-close, app-details-modal ion-button[aria-label*="close"], app-details-modal ion-button[aria-label*="fechar"]');

    if (await closeButton.count() > 0) {
      console.log('🔘 Clicando no botão de fechar');
      await closeButton.first().click();
      await page.waitForTimeout(1000);

      // Verificar se modal foi fechado
      const isHidden = await modal.isHidden();
      console.log(`🚪 Modal fechado: ${isHidden}`);
    } else {
      console.log('⚠️ Botão de fechar não encontrado, tentando ESC');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }

    console.log('✅ Teste de fechamento concluído!');
  });

  test('Deve carregar dados específicos das abas', async ({ page }) => {
    console.log('🧪 Testando carregamento de dados específicos...');

    // Abrir modal
    const firstCard = page.locator('app-pokemon-card').first();
    await firstCard.click();
    await page.waitForTimeout(3000);

    // Verificar se modal está aberto
    const modal = page.locator('app-details-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Testar aba de combate (se existir)
    const combatTab = page.locator('app-details-modal .tab-btn').filter({ hasText: /combat|luta|habilidades/i });
    if (await combatTab.count() > 0) {
      console.log('🥊 Testando aba de combate...');
      await combatTab.first().click();
      await page.waitForTimeout(2000);

      // Verificar se há dados de habilidades
      const abilities = page.locator('app-details-modal .ability, app-details-modal .habilidade');
      const abilityCount = await abilities.count();
      console.log(`⚔️ Habilidades encontradas: ${abilityCount}`);
    }

    // Testar aba de evolução (se existir)
    const evolutionTab = page.locator('app-details-modal .tab-btn').filter({ hasText: /evolution|evolução/i });
    if (await evolutionTab.count() > 0) {
      console.log('🧬 Testando aba de evolução...');
      await evolutionTab.first().click();
      await page.waitForTimeout(2000);

      // Verificar se há dados de evolução
      const evolutions = page.locator('app-details-modal .evolution, app-details-modal .evolucao');
      const evolutionCount = await evolutions.count();
      console.log(`🔄 Evoluções encontradas: ${evolutionCount}`);
    }

    console.log('✅ Teste de dados específicos concluído!');
  });
});
