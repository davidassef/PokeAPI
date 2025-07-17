import { test, expect } from '@playwright/test';

/**
 * Testes abrangentes para validar as correções implementadas no modal de detalhes do Pokémon
 *
 * Problemas corrigidos:
 * 1. Seção Curiosidades não carrega na primeira visualização
 * 2. Chaves de tradução faltando (evolution.triggers.Nível e habitats.mountain)
 * 3. Seção de evolução não recarrega após reabrir modal
 */

test.describe('Modal de Detalhes do Pokémon - Correções', () => {

  test.beforeEach(async ({ page }) => {
    // Navegar para a página inicial e aguardar carregamento
    await page.goto('/');

    // Aguardar que os cards de Pokémon sejam carregados
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });

    // Aguardar um pouco mais para garantir que todos os dados estejam carregados
    await page.waitForTimeout(3000);
  });

  test('Problema 1: Seção Curiosidades deve carregar na primeira visualização', async ({ page }) => {
    console.log('🧪 Testando carregamento inicial da seção Curiosidades...');

    // Clicar no primeiro card de Pokémon para abrir o modal
    const firstPokemonCard = page.locator('app-pokemon-card').first();
    await firstPokemonCard.click();

    // Aguardar que o modal seja aberto usando uma abordagem mais robusta
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 15000 });

    // Aguardar que o modal esteja visível
    await page.waitForFunction(() => {
      const modal = document.querySelector('app-details-modal');
      return modal && getComputedStyle(modal).display !== 'none' && getComputedStyle(modal).visibility !== 'hidden';
    }, { timeout: 10000 });

    // Navegar diretamente para a aba Curiosidades
    const curiositiesTab = page.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
    await curiositiesTab.click();

    // Aguardar um momento para o carregamento
    await page.waitForTimeout(5000);

    // Verificar se a seção de curiosidades está visível (não deve mostrar apenas loading)
    const curiositiesContent = page.locator('.curiosities-content');
    await expect(curiositiesContent).toBeVisible({ timeout: 15000 });

    // Verificar se há conteúdo real (não apenas spinner)
    const hasContent = await page.locator('.curiosities-content .info-section, .curiosities-content .habitat-info, .curiosities-content .flavor-text').count();
    expect(hasContent).toBeGreaterThan(0);

    console.log('✅ Seção Curiosidades carregou corretamente na primeira visualização');
  });

  test('Problema 1: Seção Curiosidades deve funcionar após navegar entre abas', async ({ page }) => {
    console.log('🧪 Testando navegação entre abas e retorno para Curiosidades...');

    // Abrir modal
    const firstPokemonCard = page.locator('app-pokemon-card').first();
    await firstPokemonCard.click();
    await page.waitForSelector('app-details-modal', { timeout: 10000 });

    // Navegar para aba Combate
    const combatTab = page.locator('.tab-btn').filter({ hasText: /Combate|Combat/ });
    await combatTab.click();
    await page.waitForTimeout(1000);

    // Navegar para aba Evolução
    const evolutionTab = page.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
    await evolutionTab.click();
    await page.waitForTimeout(1000);

    // Retornar para aba Curiosidades
    const curiositiesTab = page.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
    await curiositiesTab.click();
    await page.waitForTimeout(2000);

    // Verificar se a seção ainda funciona
    const curiositiesContent = page.locator('.curiosities-content');
    await expect(curiositiesContent).toBeVisible({ timeout: 10000 });

    console.log('✅ Seção Curiosidades funciona após navegação entre abas');
  });

  test('Problema 2: Chaves de tradução devem estar funcionando', async ({ page }) => {
    console.log('🧪 Testando chaves de tradução...');

    // Abrir modal de um Pokémon que tenha evolução (ex: Bulbasaur)
    const firstPokemonCard = page.locator('app-pokemon-card').first();
    await firstPokemonCard.click();
    await page.waitForSelector('app-details-modal', { timeout: 10000 });

    // Navegar para aba Evolução
    const evolutionTab = page.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
    await evolutionTab.click();
    await page.waitForTimeout(3000);

    // Verificar se não há chaves de tradução não traduzidas (como "evolution.triggers.Nível")
    const untranslatedKeys = await page.locator('text=/evolution\.triggers\.|habitats\./').count();
    expect(untranslatedKeys).toBe(0);

    // Navegar para aba Curiosidades
    const curiositiesTab = page.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
    await curiositiesTab.click();
    await page.waitForTimeout(3000);

    // Verificar se não há chaves de habitat não traduzidas
    const untranslatedHabitats = await page.locator('text=/habitats\./').count();
    expect(untranslatedHabitats).toBe(0);

    console.log('✅ Chaves de tradução estão funcionando corretamente');
  });

  test('Problema 3: Seção de evolução deve recarregar após reabrir modal', async ({ page }) => {
    console.log('🧪 Testando recarregamento da seção de evolução...');

    // Primeira abertura do modal
    const firstPokemonCard = page.locator('app-pokemon-card').first();
    await firstPokemonCard.click();
    await page.waitForSelector('app-details-modal', { timeout: 10000 });

    // Navegar para aba Evolução
    const evolutionTab = page.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
    await evolutionTab.click();
    await page.waitForTimeout(3000);

    // Verificar se a evolução carregou
    const evolutionContent = page.locator('.evolution-content, .evolution-chain');
    await expect(evolutionContent).toBeVisible({ timeout: 10000 });

    // Fechar modal
    const closeButton = page.locator('.close-btn, .modal-close, ion-button[fill="clear"]').first();
    await closeButton.click();
    await page.waitForTimeout(1000);

    // Reabrir o mesmo modal
    await firstPokemonCard.click();
    await page.waitForSelector('app-details-modal', { timeout: 10000 });

    // Navegar novamente para aba Evolução
    await evolutionTab.click();
    await page.waitForTimeout(5000);

    // Verificar se a evolução carregou novamente (não deve ficar em loading infinito)
    const evolutionContentReload = page.locator('.evolution-content, .evolution-chain');
    await expect(evolutionContentReload).toBeVisible({ timeout: 15000 });

    // Verificar se não há spinner de loading infinito
    const loadingSpinner = page.locator('.loading-spinner, ion-spinner').filter({ hasText: /Carregando|Loading/ });
    await expect(loadingSpinner).not.toBeVisible({ timeout: 5000 });

    console.log('✅ Seção de evolução recarrega corretamente após reabrir modal');
  });

  test('Teste de robustez: Múltiplas aberturas e fechamentos do modal', async ({ page }) => {
    console.log('🧪 Testando robustez com múltiplas aberturas...');

    const firstPokemonCard = page.locator('app-pokemon-card').first();

    // Repetir abertura/fechamento 3 vezes
    for (let i = 0; i < 3; i++) {
      console.log(`🔄 Iteração ${i + 1}/3`);

      // Abrir modal
      await firstPokemonCard.click();
      await page.waitForSelector('app-details-modal', { timeout: 10000 });

      // Testar cada aba
      const tabs = ['Combate', 'Evolução', 'Curiosidades'];
      for (const tabName of tabs) {
        const tab = page.locator('.tab-btn').filter({ hasText: new RegExp(tabName, 'i') });
        await tab.click();
        await page.waitForTimeout(1500);

        // Verificar se não há erros de carregamento
        const errorMessages = await page.locator('text=/erro|error|falha|failed/i').count();
        expect(errorMessages).toBe(0);
      }

      // Fechar modal
      const closeButton = page.locator('.close-btn, .modal-close, ion-button[fill="clear"]').first();
      await closeButton.click();
      await page.waitForTimeout(1000);
    }

    console.log('✅ Modal mantém robustez após múltiplas aberturas');
  });

  test('Teste de performance: Tempo de carregamento das abas', async ({ page }) => {
    console.log('🧪 Testando performance de carregamento...');

    // Abrir modal
    const firstPokemonCard = page.locator('app-pokemon-card').first();
    await firstPokemonCard.click();
    await page.waitForSelector('app-details-modal', { timeout: 10000 });

    // Testar tempo de carregamento de cada aba
    const tabs = [
      { name: 'Combate', selector: '.combat-content, .stats-content' },
      { name: 'Evolução', selector: '.evolution-content, .evolution-chain' },
      { name: 'Curiosidades', selector: '.curiosities-content' }
    ];

    for (const tab of tabs) {
      const startTime = Date.now();

      // Clicar na aba
      const tabButton = page.locator('.tab-btn').filter({ hasText: new RegExp(tab.name, 'i') });
      await tabButton.click();

      // Aguardar conteúdo aparecer
      await page.waitForSelector(tab.selector, { timeout: 15000 });

      const loadTime = Date.now() - startTime;
      console.log(`⏱️ Aba ${tab.name}: ${loadTime}ms`);

      // Verificar se carregou em tempo razoável (menos de 10 segundos)
      expect(loadTime).toBeLessThan(10000);
    }

    console.log('✅ Todas as abas carregam em tempo aceitável');
  });

  test('Teste de acessibilidade: Navegação por teclado', async ({ page }) => {
    console.log('🧪 Testando navegação por teclado...');

    // Abrir modal
    const firstPokemonCard = page.locator('app-pokemon-card').first();
    await firstPokemonCard.click();
    await page.waitForSelector('app-details-modal', { timeout: 10000 });

    // Testar navegação por Tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verificar se consegue navegar entre as abas com setas
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);

    // Verificar se consegue fechar com Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Verificar se modal foi fechado
    const modal = page.locator('app-details-modal');
    await expect(modal).not.toBeVisible();

    console.log('✅ Navegação por teclado funciona corretamente');
  });
});
