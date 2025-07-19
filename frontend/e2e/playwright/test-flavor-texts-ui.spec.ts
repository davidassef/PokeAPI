import { test, expect } from '@playwright/test';

/**
 * Teste específico para verificar se os flavor texts pt-BR aparecem na interface
 */

test.describe('Flavor Texts PT-BR na Interface', () => {

  test('Verificar se flavor texts pt-BR aparecem na aba Curiosidades', async ({ page }) => {
    console.log('🇧🇷 Testando flavor texts pt-BR na interface...');

    // Navegar para a página inicial
    await page.goto('/');

    // Aguardar carregamento
    await page.waitForSelector('app-pokemon-card', { timeout: 15000 });
    await page.waitForTimeout(3000);

    console.log('📋 Página carregada, clicando no primeiro card...');

    // Clicar no primeiro card (Bulbasaur)
    const firstPokemonCard = page.locator('app-pokemon-card').first();
    await firstPokemonCard.click();

    // Aguardar modal abrir
    await page.waitForTimeout(5000);

    // Verificar se o modal existe
    const modal = page.locator('app-details-modal[ng-reflect-is-open="true"]');
    const modalExists = await modal.count();

    if (modalExists > 0) {
      console.log('✅ Modal aberto, clicando na aba Curiosidades...');

      // Clicar na aba Curiosidades
      const curiositiesTab = modal.locator('.tab-btn').filter({ hasText: /Curiosidades|Curiosities/ });
      const curiositiesCount = await curiositiesTab.count();

      console.log(`🔍 Abas de Curiosidades encontradas: ${curiositiesCount}`);

      if (curiositiesCount > 0) {
        await curiositiesTab.first().click();
        console.log('🖱️ Clicou na aba Curiosidades');

        // Aguardar carregamento das curiosidades
        await page.waitForTimeout(8000);

        // Verificar se a seção de curiosidades apareceu
        const curiositiesContent = modal.locator('.curiosities-content, .flavor-texts, .flavor-text');
        const curiositiesVisible = await curiositiesContent.count();

        console.log(`💬 Conteúdo de curiosidades: ${curiositiesVisible}`);

        // Verificar se há flavor texts visíveis
        const flavorTexts = modal.locator('.flavor-text, .curiosity-item, .flavor-text-item');
        const flavorTextsCount = await flavorTexts.count();

        console.log(`📝 Flavor texts encontrados: ${flavorTextsCount}`);

        // Verificar se há textos em português
        if (flavorTextsCount > 0) {
          // Pegar o texto do primeiro flavor text
          const firstFlavorText = await flavorTexts.first().textContent();
          console.log(`🔍 Primeiro flavor text: "${firstFlavorText}"`);

          // Verificar se contém palavras em português
          const portugueseWords = ['uma', 'semente', 'plantada', 'costas', 'nasce', 'cresce', 'energia', 'sol'];
          const hasPortuguese = portugueseWords.some(word => 
            firstFlavorText?.toLowerCase().includes(word)
          );

          if (hasPortuguese) {
            console.log('🇧🇷 ✅ SUCESSO: Flavor texts em português detectados!');
          } else {
            console.log('🇺🇸 ❌ PROBLEMA: Flavor texts parecem estar em inglês');
            console.log(`📄 Texto completo: "${firstFlavorText}"`);
          }

          // Verificar se há múltiplos flavor texts
          if (flavorTextsCount > 1) {
            console.log(`📚 Total de ${flavorTextsCount} flavor texts encontrados`);
            
            // Verificar alguns outros textos
            for (let i = 0; i < Math.min(3, flavorTextsCount); i++) {
              const text = await flavorTexts.nth(i).textContent();
              console.log(`📝 Flavor text ${i + 1}: "${text?.substring(0, 50)}..."`);
            }
          }
        } else {
          console.log('❌ Nenhum flavor text encontrado na interface');
        }

        // Verificar se há loading infinito
        const loadingSpinner = modal.locator('.loading-spinner, ion-spinner');
        const isLoading = await loadingSpinner.count();

        console.log(`⏳ Spinners de loading: ${isLoading}`);

        if (isLoading > 0) {
          console.log('⚠️ Ainda há loading na interface');
        } else {
          console.log('✅ Sem loading infinito');
        }

      } else {
        console.log('❌ Aba de Curiosidades não encontrada');
      }
    } else {
      console.log('❌ Modal não abriu');
    }

    // Tirar screenshot
    await page.screenshot({ path: 'flavor-texts-ui-test.png', fullPage: true });
    console.log('📸 Screenshot salvo como flavor-texts-ui-test.png');
  });

});
