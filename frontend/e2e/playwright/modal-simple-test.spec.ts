import { test, expect } from '@playwright/test';

/**
 * Teste simples e funcional para validar as correções do modal
 */

test.describe('Teste Simples do Modal', () => {

  test('Teste básico: Abrir modal e verificar funcionamento', async ({ page }) => {
    console.log('🧪 Teste básico do modal...');

    // Navegar para a página inicial
    await page.goto('/');

    // Aguardar carregamento
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    console.log('📋 Página carregada');

    // Clicar no primeiro card
    const firstPokemonCard = page.locator('app-pokemon-card').first();
    await firstPokemonCard.click();

    console.log('🖱️ Clicou no card');

    // Aguardar um tempo maior para o modal carregar
    await page.waitForTimeout(5000);

    // Verificar se o modal existe e tem o atributo correto
    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    const modalExists = await modal.count();

    console.log(`📊 Modal com is-open=true: ${modalExists}`);

    // Aguardar especificamente pelo carregamento do conteúdo do modal
    try {
      await page.waitForSelector('app-details-modal .tab-btn', { timeout: 10000 });
      console.log('✅ Abas carregaram com sucesso');
    } catch (error) {
      console.log('⚠️ Timeout aguardando abas - continuando diagnóstico...');
    }

    if (modalExists > 0) {
      // Aguardar mais tempo para o conteúdo carregar
      await page.waitForTimeout(3000);

      // Verificar se há abas dentro do modal especificamente
      const tabsInModal = await modal.locator('.tab-btn').count();
      console.log(`📑 Abas dentro do modal: ${tabsInModal}`);

      if (tabsInModal > 0) {
        console.log('✅ Modal tem abas - tentando navegar para Curiosidades');

        // Tentar clicar na aba Curiosidades
        const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
        const curiositiesCount = await curiositiesTab.count();

        console.log(`🔍 Abas de Curiosidades encontradas: ${curiositiesCount}`);

        if (curiositiesCount > 0) {
          await curiositiesTab.first().click();
          console.log('🖱️ Clicou na aba Curiosidades');

          // Aguardar carregamento da aba
          await page.waitForTimeout(5000);

          // Verificar se a seção de curiosidades apareceu
          const curiositiesContent = modal.locator('.curiosities-content');
          const curiositiesVisible = await curiositiesContent.count();

          console.log(`📄 Conteúdo de curiosidades: ${curiositiesVisible}`);

          // ✅ NOVO DEBUG: Verificar estado interno do componente
          const debugInfo = await page.evaluate(() => {
            const modal = document.querySelector('app-details-modal') as any;
            if (modal && modal.componentInstance) {
              const component = modal.componentInstance;
              return {
                pokemon: !!component.pokemon,
                flavorTexts: component.flavorTexts?.length || 0,
                tabDataLoaded: component.tabDataLoaded,
                activeTab: component.activeTab,
                isCuriositiesDataReady: component.isCuriositiesDataReady()
              };
            }
            return null;
          });

          console.log('🔍 Debug info:', JSON.stringify(debugInfo, null, 2));

          // ✅ NOVO DEBUG: Verificar elementos específicos
          const tabLoadingElements = await modal.locator('.tab-loading').count();
          const loadingSpinners = await modal.locator('.loading-spinner').count();
          const flavorTexts = await modal.locator('.flavor-text').count();
          console.log('📊 Tab loading elements:', tabLoadingElements);
          console.log('⏳ Spinners de loading:', loadingSpinners);
          console.log('💬 Flavor texts encontrados:', flavorTexts);

          if (curiositiesVisible > 0) {
            console.log('✅ SUCESSO: Seção Curiosidades carregou!');

            // Verificar se há conteúdo real
            const hasRealContent = await curiositiesContent.locator('.info-section, .habitat-info, .flavor-text').count();
            console.log(`📝 Conteúdo real encontrado: ${hasRealContent}`);

            if (hasRealContent > 0) {
              console.log('🎉 PERFEITO: Curiosidades tem conteúdo real!');
            }
          } else {
            console.log('❌ PROBLEMA: Seção Curiosidades não apareceu');

            if (loadingSpinners > 0) {
              console.log('⚠️ ATENÇÃO: Ainda há spinners de loading');
            }

            if (tabLoadingElements > 0) {
              console.log('⚠️ ATENÇÃO: Há elementos de tab loading');
            }
          }
        } else {
          console.log('❌ PROBLEMA: Aba Curiosidades não encontrada');
        }
      } else {
        console.log('❌ PROBLEMA: Modal não tem abas');

        // Verificar se há algum conteúdo no modal
        const modalContent = await modal.innerHTML();
        console.log(`📄 Conteúdo HTML do modal (primeiros 200 chars): ${modalContent.substring(0, 200)}...`);
      }
    } else {
      console.log('❌ PROBLEMA: Modal não foi encontrado');
    }

    // Tirar screenshot final
    await page.screenshot({ path: 'modal-simple-test.png', fullPage: true });
    console.log('📸 Screenshot salvo');
  });

  test('Teste de evolução: Verificar se seção de evolução carrega', async ({ page }) => {
    console.log('🧪 Teste da seção de evolução...');

    await page.goto('/');
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Clicar no primeiro card
    const firstPokemonCard = page.locator('app-pokemon-card').first();
    await firstPokemonCard.click();
    await page.waitForTimeout(5000);

    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    const modalExists = await modal.count();

    if (modalExists > 0) {
      // Tentar clicar na aba Evolução
      const evolutionTab = modal.locator('.tab-btn').filter({ hasText: /Evolução|Evolution/ });
      const evolutionCount = await evolutionTab.count();

      console.log(`🔍 Abas de Evolução encontradas: ${evolutionCount}`);

      if (evolutionCount > 0) {
        await evolutionTab.first().click();
        console.log('🖱️ Clicou na aba Evolução');

        // Aguardar carregamento
        await page.waitForTimeout(8000); // Mais tempo para evolução carregar

        // Verificar se a seção de evolução apareceu
        const evolutionContent = modal.locator('.evolution-content, .evolution-chain');
        const evolutionVisible = await evolutionContent.count();

        console.log(`🧬 Conteúdo de evolução: ${evolutionVisible}`);

        if (evolutionVisible > 0) {
          console.log('✅ SUCESSO: Seção Evolução carregou!');

          // Verificar se não está em loading infinito
          const loadingSpinner = modal.locator('.loading-spinner, ion-spinner');
          const isLoading = await loadingSpinner.count();

          console.log(`⏳ Spinners de loading: ${isLoading}`);

          if (isLoading === 0) {
            console.log('🎉 PERFEITO: Evolução carregou sem loading infinito!');
          } else {
            console.log('⚠️ ATENÇÃO: Ainda há spinners de loading');
          }
        } else {
          console.log('❌ PROBLEMA: Seção Evolução não apareceu');
        }
      }
    }
  });
});
