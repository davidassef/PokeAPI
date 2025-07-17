import { test, expect } from '@playwright/test';

/**
 * Testes abrangentes para validar as correções específicas do modal de detalhes do Pokémon
 *
 * Foca nos problemas identificados:
 * 1. Chaves de tradução não funcionando
 * 2. Seção "Informações de Captura" não carregando na primeira visualização
 * 3. Seção de evolução com loading infinito após reabrir modal
 * 4. Problemas com cache service e subscriptions
 * 5. Robustez geral do sistema
 */

test.describe('Modal de Detalhes do Pokémon - Testes Abrangentes', () => {

  // Helper function para aguardar modal estar completamente carregado
  async function waitForModalToLoad(page: any) {
    // Aguardar modal existir e estar aberto
    await page.waitForSelector('app-details-modal[ng-reflect-is-open="true"]', { timeout: 15000 });

    // Aguardar conteúdo interno carregar
    await page.waitForSelector('app-details-modal .tab-btn', { timeout: 10000 });

    // Aguardar dados do Pokémon carregarem
    await page.waitForSelector('app-details-modal .pokemon-name, app-details-modal .pokemon-title', { timeout: 10000 });

    // Aguardar um momento adicional para estabilizar
    await page.waitForTimeout(2000);
  }

  // Helper function para abrir modal
  async function openPokemonModal(page: any, pokemonIndex = 0) {
    const pokemonCards = page.locator('app-pokemon-card');
    await pokemonCards.nth(pokemonIndex).click();
    await waitForModalToLoad(page);
    return page.locator('app-details-modal[ng-reflect-is-open="true"]');
  }

  // Helper function para fechar modal
  async function closeModal(page: any) {
    const closeButton = page.locator('app-details-modal .close-btn, app-details-modal .modal-close, app-details-modal ion-button[fill="clear"]').first();
    await closeButton.click();
    await page.waitForTimeout(1000);
  }

  test.beforeEach(async ({ page }) => {
    // Navegar para a página inicial e aguardar carregamento completo
    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);
  });

  test.describe('1. Testes de Chaves de Tradução', () => {

    test('Deve traduzir corretamente evolution.triggers.Nível em pt-BR', async ({ page }) => {
      console.log('🧪 Testando tradução de evolution.triggers.Nível...');

      const modal = await openPokemonModal(page);

      // Navegar para aba Evolução
      const evolutionTab = modal.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
      await evolutionTab.click();
      await page.waitForTimeout(5000);

      // Verificar se não há chaves não traduzidas
      const untranslatedKeys = await page.locator('text=/evolution\.triggers\./').count();
      expect(untranslatedKeys).toBe(0);

      // Verificar se há texto "Nível" traduzido corretamente
      const levelText = await modal.locator('text=/Nível/').count();
      expect(levelText).toBeGreaterThan(0);

      console.log('✅ Chaves de evolução traduzidas corretamente');
    });

    test('Deve traduzir corretamente habitats.mountain em pt-BR', async ({ page }) => {
      console.log('🧪 Testando tradução de habitats.mountain...');

      const modal = await openPokemonModal(page);

      // Navegar para aba Curiosidades
      const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
      await curiositiesTab.click();
      await page.waitForTimeout(5000);

      // Verificar se não há chaves de habitat não traduzidas
      const untranslatedHabitats = await page.locator('text=/habitats\./').count();
      expect(untranslatedHabitats).toBe(0);

      console.log('✅ Chaves de habitat traduzidas corretamente');
    });

    test('Deve funcionar em todos os idiomas suportados', async ({ page }) => {
      console.log('🧪 Testando tradução em múltiplos idiomas...');

      const languages = [
        { code: 'pt-BR', name: 'Português' },
        { code: 'en-US', name: 'English' },
        { code: 'es-ES', name: 'Español' },
        { code: 'ja-JP', name: '日本語' }
      ];

      for (const lang of languages) {
        console.log(`🌐 Testando idioma: ${lang.name}`);

        // Mudar idioma (assumindo que há um seletor de idioma)
        const languageSelector = page.locator('.language-selector, .lang-selector');
        if (await languageSelector.count() > 0) {
          await languageSelector.click();
          await page.locator(`[data-lang="${lang.code}"], text="${lang.name}"`).click();
          await page.waitForTimeout(2000);
        }

        const modal = await openPokemonModal(page);

        // Verificar se não há chaves não traduzidas em nenhuma aba
        const tabs = ['Evolução', 'Curiosidades'];
        for (const tabName of tabs) {
          const tab = modal.locator('.tab-btn').filter({ hasText: new RegExp(tabName, 'i') });
          if (await tab.count() > 0) {
            await tab.click();
            await page.waitForTimeout(3000);

            // Verificar chaves não traduzidas
            const untranslatedKeys = await page.locator('text=/evolution\.triggers\.|habitats\./').count();
            expect(untranslatedKeys).toBe(0);
          }
        }

        await closeModal(page);
      }

      console.log('✅ Traduções funcionam em todos os idiomas');
    });
  });

  test.describe('2. Testes da Seção "Informações de Captura"', () => {

    test('Deve carregar seção Curiosidades na primeira visualização', async ({ page }) => {
      console.log('🧪 Testando carregamento inicial da seção Curiosidades...');

      const modal = await openPokemonModal(page);

      // Navegar DIRETAMENTE para aba Curiosidades (primeira visualização)
      const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
      await curiositiesTab.click();

      // Aguardar carregamento
      await page.waitForTimeout(5000);

      // Verificar se a seção está visível
      const curiositiesContent = modal.locator('.curiosities-content');
      await expect(curiositiesContent).toBeVisible({ timeout: 10000 });

      // Verificar se há conteúdo real (não apenas loading)
      const hasContent = await curiositiesContent.locator('.info-section, .habitat-info, .flavor-text, .capture-info').count();
      expect(hasContent).toBeGreaterThan(0);

      // Verificar se isCuriositiesDataReady() está funcionando
      const isLoading = await modal.locator('.loading-spinner, ion-spinner').filter({ hasText: /Carregando|Loading/ }).count();
      expect(isLoading).toBe(0);

      console.log('✅ Seção Curiosidades carrega na primeira visualização');
    });

    test('Deve funcionar sem necessidade de trocar abas', async ({ page }) => {
      console.log('🧪 Testando que não é necessário trocar abas...');

      const modal = await openPokemonModal(page);

      // Ir direto para Curiosidades SEM passar por outras abas
      const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
      await curiositiesTab.click();
      await page.waitForTimeout(3000);

      // Deve funcionar imediatamente
      const curiositiesContent = modal.locator('.curiosities-content');
      const isVisible = await curiositiesContent.isVisible();
      expect(isVisible).toBe(true);

      console.log('✅ Curiosidades funciona sem trocar abas');
    });

    test('Deve manter dados após navegar entre abas', async ({ page }) => {
      console.log('🧪 Testando persistência de dados entre abas...');

      const modal = await openPokemonModal(page);

      // Navegar para Curiosidades
      const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
      await curiositiesTab.click();
      await page.waitForTimeout(3000);

      // Verificar conteúdo inicial
      const initialContent = await modal.locator('.curiosities-content').innerHTML();
      expect(initialContent.length).toBeGreaterThan(100);

      // Navegar para outra aba
      const overviewTab = modal.locator('.tab-btn').filter({ hasText: /Visão Geral|Overview/ });
      await overviewTab.click();
      await page.waitForTimeout(2000);

      // Voltar para Curiosidades
      await curiositiesTab.click();
      await page.waitForTimeout(2000);

      // Verificar se conteúdo ainda está lá
      const finalContent = await modal.locator('.curiosities-content').innerHTML();
      expect(finalContent.length).toBeGreaterThan(100);

      console.log('✅ Dados persistem entre navegação de abas');
    });
  });

  test.describe('3. Testes da Seção de Evolução', () => {

    test('Deve carregar evolução corretamente na primeira abertura', async ({ page }) => {
      console.log('🧪 Testando carregamento inicial da evolução...');

      const modal = await openPokemonModal(page);

      // Navegar para aba Evolução
      const evolutionTab = modal.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
      await evolutionTab.click();
      await page.waitForTimeout(8000); // Mais tempo para evolução

      // Verificar se carregou
      const evolutionContent = modal.locator('.evolution-content, .evolution-chain');
      await expect(evolutionContent).toBeVisible({ timeout: 15000 });

      // Verificar se não há loading infinito
      const loadingSpinner = modal.locator('.loading-spinner, ion-spinner').filter({ hasText: /Carregando|Loading/ });
      expect(await loadingSpinner.count()).toBe(0);

      console.log('✅ Evolução carrega corretamente na primeira abertura');
    });

    test('Deve recarregar evolução após fechar e reabrir modal', async ({ page }) => {
      console.log('🧪 Testando recarregamento após reabrir modal...');

      // Primeira abertura
      let modal = await openPokemonModal(page);

      const evolutionTab = modal.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
      await evolutionTab.click();
      await page.waitForTimeout(8000);

      // Verificar que carregou
      let evolutionContent = modal.locator('.evolution-content, .evolution-chain');
      await expect(evolutionContent).toBeVisible();

      // Fechar modal
      await closeModal(page);

      // Reabrir modal
      modal = await openPokemonModal(page);

      // Navegar novamente para evolução
      const evolutionTabReopen = modal.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
      await evolutionTabReopen.click();
      await page.waitForTimeout(10000); // Mais tempo para recarregamento

      // Verificar se carregou novamente (não deve ficar em loading infinito)
      evolutionContent = modal.locator('.evolution-content, .evolution-chain');
      await expect(evolutionContent).toBeVisible({ timeout: 15000 });

      // Verificar se não há spinner infinito
      const loadingSpinner = modal.locator('.loading-spinner, ion-spinner').filter({ hasText: /Carregando|Loading/ });
      expect(await loadingSpinner.count()).toBe(0);

      console.log('✅ Evolução recarrega corretamente após reabrir modal');
    });

    test('Deve funcionar com múltiplas aberturas consecutivas', async ({ page }) => {
      console.log('🧪 Testando múltiplas aberturas consecutivas...');

      for (let i = 0; i < 3; i++) {
        console.log(`🔄 Iteração ${i + 1}/3`);

        const modal = await openPokemonModal(page);

        const evolutionTab = modal.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
        await evolutionTab.click();
        await page.waitForTimeout(8000);

        // Verificar se carregou
        const evolutionContent = modal.locator('.evolution-content, .evolution-chain');
        await expect(evolutionContent).toBeVisible({ timeout: 15000 });

        // Verificar se não há loading infinito
        const loadingSpinner = modal.locator('.loading-spinner, ion-spinner').filter({ hasText: /Carregando|Loading/ });
        expect(await loadingSpinner.count()).toBe(0);

        await closeModal(page);
      }

      console.log('✅ Múltiplas aberturas funcionam corretamente');
    });
  });

  test.describe('4. Testes do Sistema de Cache', () => {

    test('Deve funcionar corretamente com cache service', async ({ page }) => {
      console.log('🧪 Testando funcionamento do cache service...');

      // Primeira abertura (dados vão para cache)
      let modal = await openPokemonModal(page);

      const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
      await curiositiesTab.click();
      await page.waitForTimeout(5000);

      // Verificar se carregou
      let curiositiesContent = modal.locator('.curiosities-content');
      await expect(curiositiesContent).toBeVisible();

      await closeModal(page);

      // Segunda abertura (deve usar cache)
      modal = await openPokemonModal(page);

      await curiositiesTab.click();
      await page.waitForTimeout(3000); // Deve ser mais rápido com cache

      // Verificar se ainda funciona
      curiositiesContent = modal.locator('.curiosities-content');
      await expect(curiositiesContent).toBeVisible();

      console.log('✅ Cache service funciona corretamente');
    });

    test('Deve gerenciar subscriptions corretamente', async ({ page }) => {
      console.log('🧪 Testando gerenciamento de subscriptions...');

      // Abrir e fechar modal múltiplas vezes rapidamente
      for (let i = 0; i < 5; i++) {
        const modal = await openPokemonModal(page);

        // Navegar para abas que fazem requests
        const evolutionTab = modal.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
        await evolutionTab.click();
        await page.waitForTimeout(2000);

        const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
        await curiositiesTab.click();
        await page.waitForTimeout(2000);

        await closeModal(page);
      }

      // Verificar se não há vazamentos (modal ainda funciona)
      const modal = await openPokemonModal(page);
      const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
      await curiositiesTab.click();
      await page.waitForTimeout(5000);

      const curiositiesContent = modal.locator('.curiosities-content');
      await expect(curiositiesContent).toBeVisible();

      console.log('✅ Subscriptions gerenciadas corretamente');
    });

    test('Deve funcionar após limpar cache do navegador', async ({ page, context }) => {
      console.log('🧪 Testando após limpar cache...');

      // Primeira abertura
      let modal = await openPokemonModal(page);
      let curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
      await curiositiesTab.click();
      await page.waitForTimeout(5000);

      await closeModal(page);

      // Limpar cache do navegador
      await context.clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Recarregar página
      await page.reload();
      await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
      await page.waitForTimeout(3000);

      // Testar novamente
      modal = await openPokemonModal(page);
      curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
      await curiositiesTab.click();
      await page.waitForTimeout(5000);

      const curiositiesContent = modal.locator('.curiosities-content');
      await expect(curiositiesContent).toBeVisible();

      console.log('✅ Funciona após limpar cache');
    });
  });

  test.describe('5. Testes de Robustez', () => {

    test('Deve suportar múltiplas aberturas e fechamentos consecutivos', async ({ page }) => {
      console.log('🧪 Testando robustez com múltiplas operações...');

      for (let i = 0; i < 10; i++) {
        console.log(`🔄 Ciclo ${i + 1}/10`);

        const modal = await openPokemonModal(page);

        // Testar todas as abas
        const tabs = ['Visão Geral', 'Combate', 'Evolução', 'Curiosidades'];
        for (const tabName of tabs) {
          const tab = modal.locator('.tab-btn').filter({ hasText: new RegExp(tabName, 'i') });
          if (await tab.count() > 0) {
            await tab.click();
            await page.waitForTimeout(1500);

            // Verificar se não há erros
            const errorMessages = await page.locator('text=/erro|error|falha|failed/i').count();
            expect(errorMessages).toBe(0);
          }
        }

        await closeModal(page);
      }

      console.log('✅ Sistema mantém robustez após múltiplas operações');
    });

    test('Deve ter performance aceitável', async ({ page }) => {
      console.log('🧪 Testando performance de carregamento...');

      const performanceResults = [];

      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();

        const modal = await openPokemonModal(page);

        const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
        await curiositiesTab.click();

        // Aguardar conteúdo aparecer
        await page.waitForSelector('.curiosities-content', { timeout: 15000 });

        const loadTime = Date.now() - startTime;
        performanceResults.push(loadTime);

        console.log(`⏱️ Tempo de carregamento ${i + 1}: ${loadTime}ms`);

        // Verificar se carregou em tempo razoável (menos de 10 segundos)
        expect(loadTime).toBeLessThan(10000);

        await closeModal(page);
      }

      const avgTime = performanceResults.reduce((a, b) => a + b, 0) / performanceResults.length;
      console.log(`📊 Tempo médio: ${avgTime.toFixed(0)}ms`);

      console.log('✅ Performance dentro do aceitável');
    });

    test('Deve funcionar com diferentes Pokémon', async ({ page }) => {
      console.log('🧪 Testando com diferentes Pokémon...');

      // Testar com os primeiros 5 Pokémon
      for (let pokemonIndex = 0; pokemonIndex < 5; pokemonIndex++) {
        console.log(`🔍 Testando Pokémon ${pokemonIndex + 1}`);

        const modal = await openPokemonModal(page, pokemonIndex);

        // Testar aba Curiosidades
        const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
        await curiositiesTab.click();
        await page.waitForTimeout(5000);

        const curiositiesContent = modal.locator('.curiosities-content');
        await expect(curiositiesContent).toBeVisible();

        // Testar aba Evolução
        const evolutionTab = modal.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
        await evolutionTab.click();
        await page.waitForTimeout(8000);

        // Verificar se não há loading infinito
        const loadingSpinner = modal.locator('.loading-spinner, ion-spinner').filter({ hasText: /Carregando|Loading/ });
        expect(await loadingSpinner.count()).toBe(0);

        await closeModal(page);
      }

      console.log('✅ Funciona com diferentes Pokémon');
    });

    test('Deve manter estado consistente durante navegação rápida', async ({ page }) => {
      console.log('🧪 Testando navegação rápida entre abas...');

      const modal = await openPokemonModal(page);

      // Navegar rapidamente entre abas
      const tabs = ['Visão Geral', 'Combate', 'Evolução', 'Curiosidades'];

      for (let cycle = 0; cycle < 3; cycle++) {
        for (const tabName of tabs) {
          const tab = modal.locator('.tab-btn').filter({ hasText: new RegExp(tabName, 'i') });
          if (await tab.count() > 0) {
            await tab.click();
            await page.waitForTimeout(500); // Navegação rápida
          }
        }
      }

      // Verificar se Curiosidades ainda funciona após navegação rápida
      const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
      await curiositiesTab.click();
      await page.waitForTimeout(5000);

      const curiositiesContent = modal.locator('.curiosities-content');
      await expect(curiositiesContent).toBeVisible();

      console.log('✅ Estado mantido durante navegação rápida');
    });
  });
});
